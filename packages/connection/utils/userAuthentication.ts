import { generateKey, decrypt, readMessage, readPrivateKey, encrypt, createMessage } from 'openpgp/lightweight';
import { deflate, inflate } from 'pako'

export async function generateUserKey(username: string) {
    const userMaskedEmail = `masked+${username}@app-domain.com`;
    const { privateKey, publicKey } = await generateKey({
        userIDs: [{ name: username, email: userMaskedEmail }],
        curve: 'nistP256',
    });
    return { username, privateKey, publicKey };
}

export async function solveChallenge(challenge: string, privateKey: string) {
    const decrypted = await decrypt({
        format: 'binary',
        message: await readMessage({ armoredMessage: challenge }),
        decryptionKeys: await readPrivateKey({ armoredKey: privateKey })
    });

    return new TextDecoder().decode(decrypted.data as Uint8Array);
}

export const compress = (data: string) => {
    const compressed = deflate(new TextEncoder().encode(data));
    let binary = '';
    const len = compressed.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(compressed[i]);
    }
    return btoa(binary);
}

export const decompress = (data: string): string => (
    inflate(Uint8Array.from(atob(data), c => c.charCodeAt(0)), { to: 'string' }) as string
)

export const getFromStorage = (u: string): string | null => {
    if (typeof window === 'undefined') return null;
    const compressedKey = window.localStorage.getItem(`upk`);
    if (!compressedKey) return null;

    const decompressedJson = JSON.parse(decompress(compressedKey));
    return decompressedJson[u] || null;
}

export type StoredPrivateKey = {
    username: string;
    privateKey: string;
}

export type StoredChatKey = {
    chatId: string;
    encryptedHybridKey: string;
    updatedAt: number;
    key?: string;
}

const chatHybridKeyMemory = new Map<string, string>();

export async function encryptSymmetricKey(plaintext: string, armoredPrivateKey: string): Promise<string> {
    const privKey = await readPrivateKey({ armoredKey: armoredPrivateKey });
    const pubKey = privKey.toPublic();
    const message = await createMessage({ text: plaintext });
    const encrypted = await encrypt({ message, encryptionKeys: pubKey });
    return encrypted as string;
}

export async function decryptSymmetricKey(ciphertext: string, armoredPrivateKey: string): Promise<string> {
    const privateKey = await readPrivateKey({ armoredKey: armoredPrivateKey });
    const decrypted = await decrypt({
        message: await readMessage({ armoredMessage: ciphertext }),
        decryptionKeys: privateKey,
        format: 'utf8',
    });
    return decrypted.data as string;
}

const MESSAGE_ENCRYPTED_PREFIX = 'pgp:armored:';
const PASSWORD_ENCRYPTED_PREFIX = 'pgp:sym:';

export async function encryptMessageWithHybridKey(plaintext: string, hybridKey: string): Promise<string> {
    const message = await createMessage({ text: plaintext });
    const encrypted = await encrypt({
        message,
        passwords: [hybridKey],
        format: 'armored',
    });
    return `${MESSAGE_ENCRYPTED_PREFIX}${encrypted as string}`;
}

export async function decryptMessageWithHybridKey(ciphertext: string, hybridKey: string): Promise<string> {
    if (!ciphertext || !ciphertext.startsWith(MESSAGE_ENCRYPTED_PREFIX)) {
        return ciphertext;
    }

    const armored = ciphertext.slice(MESSAGE_ENCRYPTED_PREFIX.length);
    const decrypted = await decrypt({
        message: await readMessage({ armoredMessage: armored }),
        passwords: [hybridKey],
        format: 'utf8',
    });

    return decrypted.data as string;
}

export async function encryptTextWithPassword(plaintext: string, password: string): Promise<string> {
    const message = await createMessage({ text: plaintext });
    const encrypted = await encrypt({ message, passwords: [password], format: 'armored' });
    return `${PASSWORD_ENCRYPTED_PREFIX}${encrypted as string}`;
}

export async function decryptTextWithPassword(ciphertext: string, password: string): Promise<string> {
    const armored = ciphertext.startsWith(PASSWORD_ENCRYPTED_PREFIX)
        ? ciphertext.slice(PASSWORD_ENCRYPTED_PREFIX.length)
        : ciphertext;
    const decrypted = await decrypt({
        message: await readMessage({ armoredMessage: armored }),
        passwords: [password],
        format: 'utf8',
    });
    return decrypted.data as string;
}

const PersonalDBName = 'personal-db';
const ChatsDBName = 'chats-db';

export function openPersonalDB(): Promise<IDBDatabase> {
  return new Promise((resolve) => {
    const request = indexedDB.open(PersonalDBName, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if(!db.objectStoreNames.contains('keys')) {
        const keysStore = db.createObjectStore('keys', { keyPath: 'username' });
        keysStore.createIndex('username', 'username', { unique: true });
        keysStore.createIndex('privateKey', 'privateKey', { unique: false });
      }
    }

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => console.error('Error opening personal database:', request.error);
  });
}

export function openChatsDB(): Promise<IDBDatabase> {
  return new Promise((resolve) => {
    const request = indexedDB.open(ChatsDBName, 2);

    request.onupgradeneeded = () => {
      const db = request.result;
      let chatsStore: IDBObjectStore;

      if(!db.objectStoreNames.contains('chats')) {
        chatsStore = db.createObjectStore('chats', { keyPath: 'chatId' });
        chatsStore.createIndex('chatId', 'chatId', { unique: true });
      } else {
        chatsStore = request.transaction!.objectStore('chats');
      }

      if (!chatsStore.indexNames.contains('encryptedHybridKey')) {
        chatsStore.createIndex('encryptedHybridKey', 'encryptedHybridKey', { unique: false });
      }
    }

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => console.error('Error opening chats database:', request.error);
  });
}

export function savePrivateKeyToIndexedDB(username: string, privateKey: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openPersonalDB();
            const tx = db.transaction('keys', 'readwrite');
            const store = tx.objectStore('keys');
            store.put({ username, privateKey } as StoredPrivateKey);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        } catch (err) {
            reject(err);
        }
    });
}

export function getPrivateKeyFromIndexedDB(username: string): Promise<string | null> {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openPersonalDB();
            const tx = db.transaction('keys', 'readonly');
            const store = tx.objectStore('keys');
            const req = store.get(username);
            req.onsuccess = () => {
                const result = req.result as StoredPrivateKey | undefined;
                resolve(result?.privateKey || null);
            };
            req.onerror = () => reject(req.error);
        } catch (err) {
            reject(err);
        }
    });
}

export function saveEncryptedChatHybridKey(chatId: string, encryptedHybridKey: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openChatsDB();
            const tx = db.transaction('chats', 'readwrite');
            const store = tx.objectStore('chats');
            store.put({ chatId, encryptedHybridKey, updatedAt: Date.now() } as StoredChatKey);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        } catch (err) {
            reject(err);
        }
    });
}

export function getStoredChatHybridKey(chatId: string): Promise<StoredChatKey | null> {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openChatsDB();
            const tx = db.transaction('chats', 'readonly');
            const store = tx.objectStore('chats');
            const req = store.get(chatId);
            req.onsuccess = () => {
                const result = req.result as StoredChatKey | undefined;
                resolve(result || null);
            };
            req.onerror = () => reject(req.error);
        } catch (err) {
            reject(err);
        }
    });
}

export async function getPrivateKey(username: string): Promise<string | null> {
    const idbKey = await getPrivateKeyFromIndexedDB(username);
    if (idbKey) return idbKey;
    return getFromStorage(username);
}

export function rememberChatHybridKey(chatId: string, plaintextHybridKey: string) {
    chatHybridKeyMemory.set(chatId, plaintextHybridKey);
}

export function clearChatHybridKeyMemory(chatId: string) {
    chatHybridKeyMemory.delete(chatId);
}

export function getChatHybridKeyFromMemory(chatId: string): string | null {
    return chatHybridKeyMemory.get(chatId) || null;
}

export async function resolveChatHybridKey(chatId: string, username: string): Promise<string | null> {
    const inMemory = getChatHybridKeyFromMemory(chatId);
    if (inMemory) return inMemory;

    const stored = await getStoredChatHybridKey(chatId);
    if (!stored) return null;

    if (stored.key) {
        rememberChatHybridKey(chatId, stored.key);
        return stored.key;
    }

    if (!stored.encryptedHybridKey) return null;

    const privateKey = await getPrivateKey(username);
    if (!privateKey) return null;

    const plain = await decryptSymmetricKey(stored.encryptedHybridKey, privateKey);
    rememberChatHybridKey(chatId, plain);
    return plain;
}
