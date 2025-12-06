import { Link, Outlet, useParams } from "react-router"
import { useWebsocket, WebsocketProvider } from "@repo/connection/context/Websocket"
import { useEffect, useState } from "react"

const ChatHeader = ({ cId, markReady }) => {
  const ws = useWebsocket();

  const [metadata, setMetadata] = useState({ "chat_id": cId, "name": "", "people": [], "online": [], "chatType": "group" });

  useEffect(() => {
    ws.emit("chat:metadata", { chat_id: cId }, (val) => {
      setMetadata(val);
      console.log("Chat metadata loaded:", val);
      markReady();
    });
  }, [cId]);

  return (
    <header className="h-[10vh] pr-8 pl-8 border-b border-white/10 flex items-center">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img src="/2.png" className="h-10 w-10 rounded-[100%]"></img>
          {metadata.online.length > 0 ? (
            <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-black rounded-[100%]"></div>
          ) : null}
        </div>
        <span>
          <h1 className="text-xl">{metadata.name}</h1>
          {(metadata.chatType === "group") ? <p className="text-sm text-white/50">{metadata.online.length} of {metadata.people.length} members online</p> : null}
        </span>
      </div>
      <div className="ml-auto flex items-center space-x-4">
        <button className="text-sm text-white/50 hover:text-white">...</button>
      </div>
    </header>
  )
}

const ChatFooter = ({ cId, disabled }) => {
  const ws = useWebsocket();

  const onSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;

    const messageInput = e.target.elements[0];
    const message = messageInput.value.trim();
    if (message.length === 0) return;

    const curated_object = {
      chat_id: cId,
      body: message,      // TODO: Encrypt message before sending
      attachments: [],    // TODO: Handle attachments
    }

    ws.emit("message:send", curated_object, (response) => {
      if (response.success) {
        console.log(`message send | success=${response.success}`);
        messageInput.value = "";
      } else {
        alert("Failed to send message: " + response.error);
      }
    });
  }

  return (
    <footer className="p-4 h-[10vh] border-t backdrop-blur border-white/10">
      <form className="flex items-center space-x-4" onSubmit={onSubmit}>
        <button
          type="button"
          className="btn btn-secondary btn-icon"
        >
          <img src="/attach.svg" alt="Attach Icon" className="size-6" />
        </button>
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-grow bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
        <button
          type="submit"
          className="btn btn-secondary"
        >
          Send
        </button>
      </form>
    </footer>
  )
}

export const ChatOverlay = () => {
  const params = useParams();
  const chatId = params.chatId; // TODO: What closely to see if it changes and reload messages
  const [readyStates, setReadyStates] = useState({ header: false }); // TODO: More ready states for different components

  // const msg = [{
  //   onThisSide: true, // Sent by user
  //   decryptedContent: "Cuando era que se entregaba el trabajo?",
  //   messageChecksum: "abc123",
  //   timestamp: 1625247600,
  //   senderId: "user1",
  //   recipientId: "user2"
  // }];

  const chatExamples = [
    { id: 1, name: "ReinadoRojo" },
    { id: 2, name: "Pequeño grupo de amigos" },
    { id: 3, name: "(IN2)siders Dev Chat" },
  ];

  const allReady = Object.values(readyStates).every(v => v === true);

  {/* Todo lo que sea una imagen y tenga el logo de (2) es un placeholder */ }

  return (
    <WebsocketProvider>
      <div className="flex flex-row w-[90vw] rounded-xl overflow-hidden border border-white/10 shadow-lg">
        <div className="h-[90vh] w-[30%] bg-black/30 border-r border-white/10">
          {/* Sidebar or chat list can go here */}
          <aside className="p-4 overflow-y-auto">
            <div className="h-[79vh]">
              <Link to="/chat/g-0" className="p-10 center bg-black/20 rounded-lg text-white hover:bg-black/40 cursor-pointer">Global Chat</Link>
              <br />
              <h2 className="text-white text-2xl underline underline-offset-4 text-center">Chats</h2>
              <br />
              <ul className="space-y-2">
                {chatExamples.map(chat => (
                  <Link to={`/chat/${chat.id}`} key={chat.id} className="p-4 flex flex-row items-center gap-6 bg-black/20 rounded-sm text-white hover:bg-black/40 cursor-pointer">
                    <img src="/2.png" alt="userLogo" className="h-10 rounded-[100%]" />
                    {chat.name}
                  </Link>
                ))}
              </ul>
            </div>
            <div className="h-[8vh] w-[25vw] bg-black/50 p-5 rounded-xl flex items-center gap-5">
              <img src="/2.png" className="size-12 rounded-[100%]" />
              <div className="flex flex-col">
                <h1 className="text-xl">Mteoo</h1>
                <p>Online</p>
              </div>
              <h1 className="ml-auto"><img src="/config.svg" alt="Configuration Icon" className="size-6" /></h1>
            </div>
          </aside>
        </div>

        <div className="h-[90vh] w-[70%] bg-black/50">
          {/* Main chat area */}
          <ChatHeader cId={chatId} markReady={() => { setReadyStates((prev) => ({ ...prev, header: true })) }} />
          {/* Messages area */}
          <div className="p-4 overflow-y-auto overflow-hidden h-[calc(90vh-10vh-10vh)] flex flex-col space-y-4">
            <Outlet />
          </div>
          {/* Footer */}
          <ChatFooter cId={chatId} disabled={!allReady} />
        </div>
      </div>
    </WebsocketProvider>
  )
}
