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
    <footer className="footer">
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
          className=""
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

  const chat = [
    { id: 1, name: "ReinadoRojo" },
    { id: 2, name: "Pequeño grupo de amigos" },
    { id: 3, name: "(IN2)siders Dev Chat" },
  ];

  const allReady = Object.values(readyStates).every(v => v === true);

  return (
    <WebsocketProvider>
      <div className="flex flex-row h-screen w-screen">
        <div className="sidebar">
          <div className="global-chat">
            <h1>Global Chat</h1>
          </div>
          <h1>Users</h1>
          <div className="user-list">
            {chat.map(chat => (
              <Link to={`/chat/${chat.id}`} key={chat.id} className="user-card">
                <img src="/2.png" alt="userLogo" />
                <h1>{chat.name}</h1>
              </Link>
            ))}
          </div>
          <div className="user-panel">
            <img src="/2.png" alt="userLogo" />
            <h1>Placeholder</h1>
          </div>
        </div>

        <div className="chatUI">
          <ChatHeader cId={chatId} markReady={() => setReadyStates({ ...readyStates, header: true })} />
          <div className="messages">
            <Outlet />
          </div>
          <ChatFooter cId={chatId} disabled={!allReady} />
        </div>
      </div>

    </WebsocketProvider >
  )
}
