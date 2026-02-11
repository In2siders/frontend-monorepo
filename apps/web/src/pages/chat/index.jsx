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
    return (
      <header className="h-[8vh] px-4 bg-gradient-to-r from-white/5 to-white/[0.02] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse"></div>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Loading...</p>
            <p className="text-white/40 text-xs">Fetching chat details</p>
          </div>
        </div>
        <button className="w-4 p-2 hover:bg-white/10 rounded-lg transition-colors">
          <span className="text-white/50 hover:text-white text-lg">⋮</span>
        </button>
      </header>
    )
  }

  return (
    <header className="h-[8vh] px-4 bg-gradient-to-r from-white/5 to-white/[0.02] border-b border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img src="/2.png" className="w-10 h-10 rounded-full object-cover" alt={chatMetadata.name} />
          {chatMetadata?.online?.length > 0 ? (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white/20"></div>
          ) : (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-gray-500 rounded-full border-2 border-white/20"></div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-white font-semibold text-sm">{chatMetadata.name}</h1>
          <p className="text-xs text-white/40">
            {chatMetadata.online.length} of {chatMetadata.people.length} online
          </p>
        </div>
      </div>
      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
        <span className="text-white/50 hover:text-white text-lg">⋮</span>
      </button>
    </header>
  )
}

const Sidebar = ({ chats, readyStates, auth }) => {
  return (
    <aside className="sidebar flex flex-col h-full bg-gradient-to-b from-white/5 to-white/[0.02] border-r border-white/10">
      {/* Header Section */}
      <div className="global-chat p-4 border-b border-white/10">
        <h1 className="text-lg font-semibold text-white">(In2)Siders</h1>
        <button className="w-9 p-2"><img src="/config.svg"></img></button>
      </div>

      {/* Users Section Header */}
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Direct Messages</h2>
      </div>

      {/* User List */}
      <div className="user-list flex-1 overflow-y-auto">
        {readyStates.chats ? (
          chats.length > 0 ? (
            chats.map(chat => (
              <Link
                to={`/chat/${chat.id}`}
                key={chat.id}
                className="user-card group flex items-center gap-3 px-3 py-2 mx-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src="/2.png"
                    alt={`${chat.name} avatar`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white/20"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate group-hover:text-white transition-colors">{chat.name}</h3>
                  <p className="text-xs text-white/40 truncate">Active now</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="flex items-center justify-center h-32 text-center px-4">
              <p className="text-sm text-white/40">No chats yet</p>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="flex flex-col items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <p className="text-xs text-white/50">Loading chats...</p>
            </div>
          </div>
        )}
      </div>

      {/* User Panel */}
      <div className="user-panel border-t border-white/10 p-3 bg-white/5">
        <div className="flex items-center gap-3">
          <img
            src="/2.png"
            alt="User avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/50">Logged in as</p>
            <h4 className="text-sm font-medium text-white truncate">{auth?.user?.username || 'User'}</h4>
          </div>
        </div>
      </div>
    </aside>
  )
}

const ChatFooter = ({ cId, disabled }) => {
  const ws = useWebsocket();
  const fileInputRef = useRef(null);

  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);

const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB en bytes

    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} Es demasiado grande, El limite es de 1MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const processedFiles = await Promise.all(validFiles.map(file => {
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
    if (isSending || (!messageText.trim() && attachments.length === 0)) return;

    setIsSending(true);

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
        setIsSending(false);
      } else {
        alert("Failed to send: " + response?.error);
        setIsSending(false);
      }
    });
  };

  return (
    <footer className="w-full mt-auto flex flex-col pointer-events-auto bg-gradient-to-t from-white/5 to-white/[0.02]">

      {/* -- PREVIEW BOX -- */}
      {attachments.length > 0 && (
        <div className="flex gap-2 px-3 py-1.5 bg-white/5 border-t border-white/10 overflow-x-auto custom-scrollbar">
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
              <div key={i} className="relative flex items-center gap-1.5 flex-shrink-0 group p-1.5 bg-white/5 rounded-md border border-white/10 hover:border-white/20 transition-colors">
                <div className="relative flex-shrink-0">
                  <div className="h-8 w-8 rounded-md border border-white/20 bg-white/5 flex items-center justify-center overflow-hidden text-sm">
                    {isImage ? (
                      <img
                        src={file.previewUrl}
                        className="h-full w-full object-cover"
                        alt="preview"
                      />
                    ) : isVideo ? (
                      <video src={file.previewUrl} className="h-full w-full object-cover" />
                    ) : isAudio ? (
                      <span className="text-lg animate-pulse">🎵</span>
                    ) : (
                      <span className="text-lg">{getPreviewIcon(file.filename)}</span>
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white truncate">{file.filename}</p>
                  <p className="text-[10px] text-white/50">{(file.data.length / 1024).toFixed(1)} KB</p>
                </div>

                <button
                  type="button"
                  className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 size-3.5 rounded-full text-white text-[7px] flex items-center justify-center border border-black shadow-lg z-10"
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
      <form
        className={`flex items-center gap-2 p-3 border-t border-white/10 transition-opacity ${isSending ? 'opacity-60' : 'opacity-100'}`}
        onSubmit={onSubmit}
      >
        {/* 1. The Hidden File Input */}
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isSending}
          className="hidden"
        />

        {/* 2. The Attach Button */}
        <button
          type="button"
          className="p-2.5 hover:bg-white/10 rounded-lg transition-all duration-200 text-white/50 hover:text-white flex-shrink-0"
          onClick={() => !isSending && fileInputRef.current.click()}
          disabled={isSending}
          title="Attach file"
        >
          <img src="/attach.svg" alt="Attach" className="w-5 h-5" />
        </button>

        {/* 3. The Text Input */}
        <input
          name="message"
          type="text"
          placeholder={isSending ? "Uploading file..." : "Type a message..."}
          className="bg-white/5 flex-1 px-3 py-2.5 rounded-lg border border-white/10 outline-none text-sm text-white placeholder-white/40 hover:border-white/20 focus:border-white/40 focus:bg-white/10 transition-all duration-200"
          disabled={isSending || disabled}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="true"
          data-lpignore="true"
        />

        {/* 4. The Send Button */}
        <button
          type="submit"
          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/40 text-white text-sm rounded-lg flex items-center justify-center font-medium transition-all duration-200 flex-shrink-0 min-w-[70px]"
          disabled={isSending || disabled || (!messageText.trim() && attachments.length === 0)}
        >
          {isSending ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Send"
          )}
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
        <Sidebar chats={chats} readyStates={readyStates} auth={auth} />

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
