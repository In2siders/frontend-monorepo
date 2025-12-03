import { useWebsocket } from "@repo/connection/context/Websocket";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

export const ChatRoom = () => {
  const ws = useWebsocket();
  const params = useParams();

  const [messageList, setMessageList] = useState<Array<object>>([]); // [ { message_data }, ... ]
  const [completedList, _setCompletedList] = useState<Array<string>>([]); // [ message_hash, ... ]

  useEffect(() => {
    if (!ws) return;

    ws.emit("room:join", { roomId: params.chatId });

    return () => {
      ws.emit("room:leave", { roomId: params.chatId });
    };
  }, [ws, params.chatId]);

  useEffect(() => {
    if (!ws) return;
    if(!ws.connected) return;

    ws.on("message", (data) => {
      setMessageList((prevList) => [...prevList, data.raw_messages]);
    })
  }, [ws, messageList, completedList]);

  return (
    <div>Chat Room {params.chatId}</div>
  )
}
