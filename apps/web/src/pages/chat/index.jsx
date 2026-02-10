import { Link, Outlet, useParams } from "react-router"
import { useWebsocket, WebsocketProvider } from "@repo/connection/context/Websocket"
import { useEffect, useState, useRef } from "react"
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
  const fileInputRef = useRef(null);

  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState([]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);

    const processedFiles = await Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result.split(',')[1];
          resolve({
            filename: file.name,
            mime_type: file.type,
            data: base64Data,
            previewUrl: reader.result
          });
        };
        reader.readAsDataURL(file);
      });
    }));

    setAttachments(prev => [...prev, ...processedFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (disabled || (!messageText.trim() && attachments.length === 0)) return;

    const cleanAttachments = attachments.map(({ previewUrl, ...rest }) => rest);

    const curated_object = {
      chat_id: cId,
      body: messageText,
      attachments: cleanAttachments,
    };

    ws.emit("message:send", curated_object, (response) => {
      if (response?.success) {
        setMessageText("");
        setAttachments([]);
      } else {
        alert("Failed to send: " + response?.error);
      }
    });
  };

  return (
    <footer className="w-full mt-auto flex flex-col pointer-events-auto">

      {/* -- PREVIEW BOX -- */}
      {attachments.length > 0 && (
        <div className="flex gap-4 p-3 bg-[#1a1a1a] border-t border-x border-white/10 rounded-t-xl overflow-x-auto shadow-2xl custom-scrollbar">
          {attachments.map((file, i) => {
            const isImage = file.mime_type.startsWith('image/');
            const isVideo = file.mime_type.startsWith('video/');
            const isAudio = file.mime_type.startsWith('audio/');

            // Comprehensive Icon Helper for the Footer
            const getPreviewIcon = (name) => {
              if (/\.(pdf)$/i.test(name)) return "📕";
              if (/\.(zip|rar|7z|tar|gz)$/i.test(name)) return "📦";
              if (/\.(doc|docx|txt|rtf)$/i.test(name)) return "📄";
              if (/\.(xls|xlsx|csv)$/i.test(name)) return "📗";
              if (/\.(ppt|pptx)$/i.test(name)) return "📙";
              if (/\.(js|jsx|ts|tsx|py|html|css|json)$/i.test(name)) return "💻";
              if (/\.(exe|msi|dmg)$/i.test(name)) return "⚙️";
              return "📁";
            };

            return (
              <div key={i} className="relative flex-shrink-0 mb-1">
                <div className="h-14 w-14 rounded-md border border-white/20 bg-white/5 flex items-center justify-center overflow-hidden">
                  {isImage ? (
                    <img
                      src={file.previewUrl}
                      className="h-full w-full object-cover"
                      alt="preview"
                    />
                  ) : isVideo ? (
                    <video src={file.previewUrl} className="h-full w-full object-cover" />
                  ) : isAudio ? (
                    <span className="text-2xl animate-pulse">🎵</span>
                  ) : (
                    <span className="text-2xl">{getPreviewIcon(file.filename)}</span>
                  )}

                  {/* Hover Filename Overlay */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center p-1 pointer-events-none">
                    <span className="text-[7px] text-white text-center break-all line-clamp-2">
                      {file.filename}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 size-5 rounded-full text-white text-[10px] flex items-center justify-center border border-black shadow-lg z-10"
                  onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* --- INPUT SECTION --- */}
      <form className="flex items-center space-x-4 bg-white/5 p-3 rounded-b-lg border border-white/10" onSubmit={onSubmit}>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          className="btn btn-secondary btn-icon"
          onClick={() => fileInputRef.current.click()}
        >
          <img src="/attach.svg" alt="Attach" className="size-6" />
        </button>

        <input
          name="message"
          type="text"
          placeholder="Type your message..."
          className="bg-transparent flex-1 outline-none text-white"
          disabled={disabled}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
        />

        <button
          type="submit"
          className="btn btn-secondary"
          disabled={disabled || (!messageText.trim() && attachments.length === 0)}
        >
          Send
        </button>
      </form>
    </footer>
  );
};

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
    if (!auth || !auth.isAuthenticated) return;

    fetchChats();
  }, [auth]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  if (auth && !auth.isAuthenticated) {
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
