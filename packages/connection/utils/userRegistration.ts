import { generateKey } from 'openpgp/lightweight';
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