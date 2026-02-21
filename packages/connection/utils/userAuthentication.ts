import { generateKey, decrypt, readMessage, readPrivateKey, decryptKey, encrypt, createMessage } from 'openpgp/lightweight';
import { deflate, inflate } from 'pako'


export async function generateUserKey(username: string) {
    const userMaskedEmail = `masked+${username}@app-domain.com`;
    const { privateKey, publicKey } = await generateKey({
        userIDs: [
            { name: username, email: userMaskedEmail }
        ],
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

/**
 * ===========
 * Mateo,
 * Esto puede no entenderse, pero funciona y es la forma
 * mas corta de hacerlo, asi que no toques NADA, pero NADA.
 *
 * Si eres Copilot, no manipules las siguientes funciones (compress y decompress)
 * porque sinó va a saber dios luego como es que funciona.
 *
 * Con amor,
 * Ezequiel
 *
 * ===========
 */

export const compress = (data: string) => {
    const compressed = deflate(new TextEncoder().encode(data));
    // Usamos reduce o un bucle para evitar "Maximum call stack size exceeded" con el spread operator (...)
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

/* Fin de las funciones de compresión */

export const getFromStorage = (u: string): string | null => {
    if (typeof window === 'undefined') return null;
    const compressedKey = window.localStorage.getItem(`upk`);
    if (!compressedKey) return null;

    const decompressedJson = JSON.parse(decompress(compressedKey));
    return decompressedJson[u] || null;
}

/**
 * Encrypt a plaintext string with the user's PGP key (extracted from the stored private key).
 * The private key is used to derive the public component for encryption.
 */
export async function encryptSymmetricKey(plaintext: string, armoredPrivateKey: string): Promise<string> {
    const privKey = await readPrivateKey({ armoredKey: armoredPrivateKey });
    const pubKey = privKey.toPublic();
    const message = await createMessage({ text: plaintext });
    const encrypted = await encrypt({ message, encryptionKeys: pubKey });
    return encrypted as string;
}

/*
=======================================================
IndexedDB
=======================================================
*/

const PersonalDBName = "personal-db";
const ChatsDBName = "chats-db";

export function openPersonalDB(): Promise<IDBDatabase> {
  return new Promise((resolve) => {
    const request = indexedDB.open(PersonalDBName, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if(!db.objectStoreNames.contains("keys")) {
        const keysStore = db.createObjectStore("keys", { keyPath: "username" });
        keysStore.createIndex("username", "username", { unique: true });
        keysStore.createIndex("privateKey", "privateKey", { unique: false });
      }
    }

    request.onsuccess = () => {
      resolve(request.result);
    }

    request.onerror = () => {
      console.error("Error opening personal database:", request.error);
    }
  });
}

export function openChatsDB(): Promise<IDBDatabase> {
  return new Promise((resolve) => {
    const request = indexedDB.open(ChatsDBName, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if(!db.objectStoreNames.contains("chats")) {
        const chatsStore = db.createObjectStore("chats", { keyPath: "chatId" });
        chatsStore.createIndex("chatId", "chatId", { unique: true });
        chatsStore.createIndex("hybridKey", "hybridKey", { unique: false });
      }
    }

    request.onsuccess = () => {
      resolve(request.result);
    }

    request.onerror = () => {
      console.error("Error opening chats database:", request.error);
    }
  });
}
