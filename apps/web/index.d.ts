type Message = {
  id: string;
  senderId: string;
  timestamp: string;
  body: string;
  attachments?: Array<string>;
  _hash: string;        // Server calculated hash for integrity verification
}

export { Message };
