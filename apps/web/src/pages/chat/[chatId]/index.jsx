import { useParams } from "react-router";

export const ChatRoom = () => {
  const params = useParams();

  console.log("chatId:", params.chatId);

  return (
    <h1>{params.chatId}</h1>
  )
}
