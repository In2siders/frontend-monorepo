import { Outlet, useParams } from "react-router"
import {WebsocketProvider} from "@repo/connection/context/Websocket"

export const Chat404 = () => (
    <h1>Chat Not Found</h1>
)
export const NewChatRoom = () => (
    <h1>New Chat Room</h1>
)
export const ChatRoom = () => {    
    const params = useParams();

    console.log("chatId:", params.chatId);

    return (
        <h1>Chat Room {params.chatId}</h1>
    )
}
export const ChatOverlay = () => (
    <WebsocketProvider>
        <h1>Chat Overlay</h1>
        <div>
            <Outlet />
        </div>
    </WebsocketProvider>
)