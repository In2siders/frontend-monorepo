import { Link, Outlet, useParams } from "react-router"
import { useWebsocket, WebsocketProvider } from "@repo/connection/context/Websocket"
import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/useAuth";
import { apiFetch } from "@repo/connection/utils/api";
import toast from "react-hot-toast";

/**
 *
 * @param {{ name: string; online: string[]; people: string[]; }} param0
 * @returns
 */
const ChatHeader = ({ chatId, markReady }) => {
  const [chatMetadata, setChatMetadata] = useState(null);

  const fetchMetadata = async () => {
    try {
      const jsonData = await apiFetch(`/chat/metadata/${chatId}`)
      if (!jsonData.success) throw new Error(jsonData.error || "Failed to fetch metadata");

      setChatMetadata(jsonData.data);
      markReady();
    } catch (err) {
      console.error("Error fetching metadata:", err);
      toast.error("We couldn't load chat metadata. See the console for more details.");
    }
  }

  useEffect(() => {
    fetchMetadata();
  }, [chatId]);

  if (!chatMetadata) {
    <header className="h-[10vh] pr-8 pl-8 border-b border-white/10 flex items-center">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img src="/2.png" className="h-15 w-15 rounded-[100%]" />
        </div>
        <span>
          <h1 className="text-xl">Error loading metadata!</h1>
          <p className="text-sm text-white/50">0 of 0 members online</p>
        </span>
      </div>
      <div className="ml-auto flex items-center space-x-4">
        <button className="text-sm text-white/50 hover:text-white">...</button>
      </div>
    </header>
  }

  return (
    <header className="h-[10vh] pr-8 pl-8 border-b border-white/10 flex items-center">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img src="/2.png" className="h-15 w-15 rounded-[100%]"></img>
          {chatMetadata && chatMetadata.online.length > 0 ? (
            <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-black rounded-[100%]"></div>
          ) : null}
        </div>
        <span>
          <h1 className="text-xl">{chatMetadata ? chatMetadata.name : "Loading..."}</h1>
          {(chatMetadata && chatMetadata.people.length > 2) ? <p className="text-sm text-white/50">{chatMetadata.online.length} of {chatMetadata.people.length} members online</p> : null}
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
  const { chatId } = useParams();
  const { auth, loading, error } = useAuth();

  const [chats, setChats] = useState([]);
  const [readyStates, setReadyStates] = useState({ header: false, chats: false }); // TODO: More ready states for different components
  const allReady = Object.values(readyStates).every(v => v === true);

  const fetchChats = async () => {
    try {
      const jsonData = await apiFetch("/chat/groups")
      if (!jsonData.success) throw new Error(jsonData.error || "Failed to fetch chats");

      setChats(jsonData.data);
      setReadyStates(prev => ({ ...prev, chats: true }));
    } catch (err) {
      console.error("Error fetching chats:", err);
      toast.error("We couldn't load your chats. See the console for more details.");
    }
  }

  useEffect(() => {
    if(!auth || !auth.isAuthenticated) return;

    fetchChats();
  }, [auth]);

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
            {readyStates.chats ? chats.map(chat => (
              <Link to={`/chat/${chat.id}`} key={chat.id} className="user-card">
                <img src="/2.png" alt={`${chat.name} avatar`} />
                <h1>{chat.name}</h1>
              </Link>
            )) : (
              <div className="p-4">
                <p className="text-sm text-white/50">Loading chats...</p>
              </div>
            )}
          </div>
          <div className="user-panel">
            <img src="/2.png" alt="userLogo" />
            <h1>{auth.user.username}</h1>
          </div>
        </div>

        <div className="chatUI">
          <ChatHeader chatId={chatId} markReady={() => setReadyStates({ ...readyStates, header: true })} />
          <div className="messages">
            <Outlet />
          </div>
          <ChatFooter cId={chatId} disabled={!allReady} />
        </div>
      </div>

    </WebsocketProvider >
  )
}
