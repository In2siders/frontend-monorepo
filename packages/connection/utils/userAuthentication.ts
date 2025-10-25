import { generateKey, decrypt, readMessage, readPrivateKey } from 'openpgp/lightweight';
import { deflate, inflate } from 'pako'


export async function generateUserKey(username: string) {
    const userMaskedEmail = `masked+${username}@app-domain.com`;
    const { privateKey, publicKey } = await generateKey({
        userIDs: [
            { name: username, email: userMaskedEmail }
        ],
        curve: 'nistP384',
    });
    return { username, privateKey, publicKey };
}

export async function solveChallenge(challenge: string, privateKey: string) {
    const decrypted = await decrypt({
        format: 'binary',
        message: await readMessage({ armoredMessage: challenge }),
        decryptionKeys: await readPrivateKey({ armoredKey: privateKey }),
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

export const compress = (data: string) => (
    btoa(String.fromCharCode(...Array.from(new Uint8Array(deflate(new TextEncoder().encode(data))))))
)

export const decompress = (data: string): string => (
    inflate(Uint8Array.from(atob(data), c => c.charCodeAt(0)), { to: 'string' }) as string
)

/* Fin de las funciones de compresión */