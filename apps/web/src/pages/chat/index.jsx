import { Outlet, useParams } from "react-router"
import { WebsocketProvider } from "@repo/connection/context/Websocket"

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
export const ChatOverlay = () => {
    const msg = [{
        onThisSide: true, // Sent by user
        decryptedContent: "Hello, how are you?",
        messageChecksum: "abc123",
        timestamp: 1625247600,
        senderId: "user1",
        recipientId: "user2"
    }, {
        onThisSide: false, // Received message
        decryptedContent: "I'm good, thank you!",
        messageChecksum: "def456",
        timestamp: 1625247660,
        senderId: "user2",
        recipientId: "user1"
    }, {
        onThisSide: true, // Sent by user
        decryptedContent: "What about you?",
        messageChecksum: "ghi789",
        timestamp: 1625247720,
        senderId: "user1",
        recipientId: "user2"
    }]

    const chatExamples = [
        { id: 1, name: "Chat with Alice" },
        { id: 2, name: "Project Discussion" },
        { id: 3, name: "Random Talks" },
    ];

    return (
        <WebsocketProvider>
            <div className="flex w-[90vw] rounded-xl overflow-hidden border border-white/10 shadow-lg">
                <div className="h-[90vh] w-[30%] bg-black/30 border-r border-white/10">
                    {/* Sidebar or chat list can go here */}
                    <aside className="p-4 h-full overflow-y-auto">
                        <h1 className="p-10 center bg-black/20 rounded-lg text-white hover:bg-black/40 cursor-pointer">Global Chat</h1>
                        <br />
                        <h2 className="text-white text-lg mb-4 text-center">Chats</h2>
                        <ul className="space-y-2">
                            {chatExamples.map(chat => (
                                <li key={chat.id} className="p-4 bg-black/20 rounded-lg text-white hover:bg-black/40 cursor-pointer">
                                    {chat.name}
                                </li>
                            ))} 
                        </ul>
                    </aside>

                </div>
                <div className="h-[90vh] w-[70%] bg-black/50">
                    {/* Main chat area */}

                    {/* Header */}

                    <header className="h-[10vh] pb-4 pt-2 pr-8 pl-8 border-b border-white/10 flex items-center ">
                        <div className="flex items-center space-x-4">
                        <Outlet />
                        </div>

                        <div className="ml-auto flex items-center space-x-4">
                        <button className="text-sm text-white/50 hover:text-white">...</button>
                        </div>
                    </header>
                    {/* Messages area */}

                    <div className="p-4 overflow-y-auto overflow-hidden h-[calc(90vh-10vh-10vh)] flex flex-col space-y-4">
                        {msg.map((message, index) => (
                            <div
                                className={`mb-4 p-3 rounded-lg max-w-[70%] ${message.onThisSide ? 'bg-blue-800 text-white self-end' : 'bg-gray-200 text-black self-start'}`}
                                key={index}>
                                {/* TODO: Ezequiel, Esto es un placeholder cuando puedas implementar el contenido real del mensaje */}
                                {message.onThisSide ? 'Tu: ' : 'Ellos: '}
                                {message.decryptedContent}
                            </div>
                        ))}
                    </div>

                    {/* Footer */}

                    <footer className="p-4 h-[10vh] border-t backdrop-blur border-white/10">
                        <form className="flex items-center space-x-4">
                            <input
                                type="text"
                                placeholder="Type your message..."
                                className="flex-grow bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                            >
                                Send
                            </button>
                        </form>
                    </footer>
                </div>
            </div>
        </WebsocketProvider>
    )
}