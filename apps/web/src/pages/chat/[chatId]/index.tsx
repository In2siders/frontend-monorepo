import { Message } from "@/index";
import { useWebsocket } from "@repo/connection/context/Websocket";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

type MessageListObject = {
  _id: string;              // Server Push Id
  _hash: string;            // Client computed hash
  _processed: boolean;      // If the message has been processed by the client
  _client_sent: boolean;    // If the message was sent by this client
  raw_data: Message;        // Raw message data
  processed_data?: Message; // Processed message data (e.g., decrypted)
}

export const ChatRoom = () => {
  const ws = useWebsocket();
  const params = useParams();
  const cId = params.chatId || "";

  const [messageList, setMessageList] = useState<MessageListObject[]>([]);

  useEffect(() => {
    ws.emit("room:join", { roomId: params.chatId });

    return () => {
      ws.emit("room:leave", { roomId: params.chatId });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cId]);

  useEffect(() => {
    ws.on("message:proxy", (body) => {
      const curated_list = {
        _id: body._push_id,
        _hash: body._hash, // TODO: Compute hash on client side
        _processed: true,
        _client_sent: true,
        raw_data: body.message,
        processed_data: body.message, // TODO: Process message
      }
      setMessageList((prevList) => [...prevList, curated_list]);
    })

    ws.on("message:received", (data) => {
      const exists = messageList.find(msg => msg._id === data.raw_messages._push_id);
      if (exists) return; // Avoid duplicates

      const curated_list = {
        _id: data.raw_messages._push_id,
        _hash: data.raw_messages._hash, // TODO: Compute hash on client side
        _processed: false,
        _client_sent: false,
        raw_data: data.raw_messages,
      }

      setMessageList((prevList) => [...prevList, curated_list]);
    })
  }, [ws, messageList]);

  // Vigil for new messages to process (e.g., decrypt)
  useEffect(() => {
    messageList.forEach((msg) => {
      if (msg._processed) return;

      // TODO: Process message (e.g., decryption logic)
      const processedMessage = {
        ...msg,
        _processed: true,
        processed_data: msg.raw_data,
      };

      setMessageList((prevList) =>
        prevList.map((m) => (m._id === msg._id ? processedMessage : m))
      );
    });
  }, [messageList]);

  return (
    <div>Chat Room {params.chatId}</div>
  )
}
