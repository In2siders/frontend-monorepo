import { Link, Outlet, useParams } from "react-router"
import { useWebsocket, WebsocketProvider } from "@repo/connection/context/Websocket"
import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/useAuth";

/**
 *
 * @param {{ name: string; online: string[]; people: string[]; }} param0
 * @returns
 */
const ChatHeader = ({ metadata, markReady }) => {
  return (
    <header className="h-[10vh] pr-8 pl-8 border-b border-white/10 flex items-center">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img src="/2.png" className="h-15 w-15 rounded-[100%]"></img>
          {metadata.online.length > 0 ? (
            <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-black rounded-[100%]"></div>
          ) : null}
        </div>
        <span>
          <h1 className="text-xl">{metadata.name}</h1>
          {(metadata.people.length > 2) ? <p className="text-sm text-white/50">{metadata.online.length} of {metadata.people.length} members online</p> : null}
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
  console.log("Attempting to emit...");

  const onSubmit = (e) => {

    e.preventDefault();

    const message = e.target.elements.message.value.trim();

    if (disabled || !message) return;

    const curated_object = {
      chat_id: cId,
      body: message,
      attachments: [],
    };


    ws.emit("message:send", curated_object, (response) => {
      console.log("Acknowledgment received from server:", response);
      if (response?.success) {
        e.target.elements.message.value = "";
      } else {
        alert("Failed to send: " + response?.error);
      }
    });
  };

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
          name="message"
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
  const { auth, loading, error } = useAuth();
  const chatId = params.chatId; // TODO: What closely to see if it changes and reload messages
  const [readyStates, setReadyStates] = useState({ header: false }); // TODO: More ready states for different components
  const allReady = Object.values(readyStates).every(v => v === true);

  // TODO: Fetch API for chat list and metadata. (Messages are carried through websockets)

  const chat = [
    { id: 1, name: "ReinadoRojo" },
    { id: 2, name: "Pequeño grupo de amigos" },
    { id: 3, name: "(IN2)siders Dev Chat" },
  ];

  if(loading) return <div>Loading...</div>;
  if(error) return <div>Error: {error.message}</div>;

  if(auth && !auth.isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <WebsocketProvider>
      <div className="flex flex-row h-screen w-screen">
        <div className="sidebar">
          <div className="global-chat">
            <h1>Global Chat</h1>
          </div>
          <h1 className="center">Users</h1>
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
            <h1>{auth.user.username}</h1>
          </div>
        </div>

        <div className="chatUI">
          <ChatHeader metadata={{ name: `Offline metadata ${chatId}`, online: [], people: [auth.user.id] }} markReady={() => setReadyStates({ ...readyStates, header: true })} />
          <div className="messages">
            <Outlet />
          </div>
          <ChatFooter cId={chatId} disabled={!allReady} />
        </div>
      </div>

    </WebsocketProvider >
  )
}
