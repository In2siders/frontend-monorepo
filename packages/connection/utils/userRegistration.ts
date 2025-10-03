import { generateKey } from 'openpgp/lightweight';

export async function generateUserKey(username: string) {
    const userMaskedEmail = `masked+${username}@app-domain.com`;
    const { privateKey } = await generateKey({
        userIDs: [
            { name: username, email: userMaskedEmail }
        ],
        curve: 'nistP384',
    });
    return privateKey;
}

export async function sendAuthRequest(username: string, pgpPublicKey: string) {
    const response = await fetch('/api/auth/request', {
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