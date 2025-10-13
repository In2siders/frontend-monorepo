import { generateKey } from 'openpgp/lightweight';
import { deflate, inflate } from 'pako'

const API_BASE_URL = 'http://127.0.0.1:5000';
const API_VERSION = 'v1';

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

export async function sendAuthRequest(username: string, pgpPublicKey: string) {
    const response = await fetch(`${API_BASE_URL}/${API_VERSION}/auth/request`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            pgp: pgpPublicKey
        })
    })
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