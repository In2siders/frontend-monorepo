import { apiFetch } from "./api"
import { createHash } from 'crypto'

export const getChatInfo = (chatId: string) => {
    // 1. Fetch chat info from server
    return apiFetch(`/chats/${chatId}`, { method: 'GET' })
    // 2. Return chat info in a structured format | TODO: Waiting to know server structure and frontend needs.
    // return ...
}
export const getChatHistory = (chatId: string) => {
    // 1. Fetch chat history from server
    return apiFetch(`/chats/${chatId}/messages`, { method: 'GET' })
    // 2. Return chat history in a structured format | TODO: Waiting to know server structure and frontend needs.
    // return ...
}
export const negotiateHibridEncryption = async (chatId: string) => {
    // 1. Negotiate encryption keys with server
    const negotiationData = await apiFetch(`/chats/${chatId}/negotiate-encryption`, { method: 'POST' })
    // 2. Get negotiation results
    /*
    EXAMPLE: {
        encryptedKey: "zlib-compressed-pgp-encrypted-text-string-with-key",
        userFlake: "user-unique-id-for-the-room-session-required-to-append-to-send-requests";
    }
    */
    const { encryptedKey, userFlake } = negotiationData;

    // 3. Checksum data integrity
    const checksum = createHash('sha256').update(`${encryptedKey}::${userFlake}`).digest('hex');

    // 4. Validate checksum
    const checksumRequest = await apiFetch(`/chats/${chatId}/validate-encryption-checksum?uf=${userFlake}`, {
        method: 'POST',
        body: { checksum },
    });

    // 4.2. Handle invalid checksum
    if (!checksumRequest.valid) {
        throw new Error('Encryption negotiation failed: Data integrity check failed.');
    }

    // 5. Store negotiation results securely | TODO: Implement secure storage mechanism.
    // ...

    // 6. Return negotiation results
    return { encryptedKey, userFlake };
}

export const createEnvelope = ({
    chatId,
    attachments,
    body,
}: { chatId: string; attachments: string[]; body: string }) => {
    // 1. Current timestamp
    const currTimestamp = new Date();
    // 2. Body checksum
    const bodyCheck = createHash('sha512').update(body).digest('hex');
    // 3. ChatID check | TODO: Make this work with socket-io rooms
    const chatIdCheck = createHash('sha512').update(`${chatId}::example-room-authorization-key`).digest('hex');
    // 4. Return envelope
    return {
        timestamp: currTimestamp.toISOString(),
        body,
        attachments,
        bodyChecksum: bodyCheck,
        chatIdChecksum: chatIdCheck,
    }
}
export const parseEnvelope = ({ chatId, envelope }: { chatId: string; envelope: any }) => {
    // 1. Get envelope data
    const { timestamp, body, attachments, bodyChecksum, chatIdChecksum } = envelope;
    
    // 2. Compute expected checksums
    const bodyExpected = createHash('sha512').update(body).digest('hex');
    const chatIdExpected = createHash('sha512').update(`${chatId}::example-room-authorization-key`).digest('hex');
    
    // 3. Validate envelope
    const isValidEnvelope = (bodyExpected === bodyChecksum) && (chatIdExpected === chatIdChecksum);

    // 4. Return parsed data
    return {
        valid: isValidEnvelope,
        timestamp,
        body,
        attachments,
    };
}

export const signalAttachmentUpload = async () => {
    // 1. Ping server and ask for upload URL
    const requestedData = await apiFetch(`/attachments/request-upload`, { method: 'POST' })
    // 2. Receive a URL with authorization from server
    const signedUrl = requestedData.signedUrl; // EXAMPLE: "https://att.server.com/upload/attId?ip=hexIP&exp=expiration
    // 3. Upload attachment to authorized URL
    return signedUrl;
}
export const getAttachmentDownloadLink = async (attId: string) => {
    // 1. Request signed download URL from server
    const requestedData = await apiFetch(`/attachments/request-download/${attId}`, { method: 'POST' })
    // 2. Receive signed URL from server    
    const signedUrl = requestedData.signedUrl; // EXAMPLE: "https://att.server.com/full/attId?sig=file-signature"
    // 3. Download attachment from signed URL
    return signedUrl;
}