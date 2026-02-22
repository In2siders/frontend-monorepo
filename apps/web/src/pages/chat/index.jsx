import { Link, Outlet, useNavigate, useParams } from "react-router"
import { useWebsocket, WebsocketProvider } from "@repo/connection/context/Websocket"
import { useEffect, useState, useRef } from "react"
import { useAuth } from "../../hooks/useAuth";
import { apiFetch } from "@repo/connection/utils/api";
import { encryptMessageWithHybridKey, encryptTextWithPassword, resolveChatHybridKey } from "@repo/connection/utils/userAuthentication";
import toast from "react-hot-toast";
import { NewGroupModal } from "../../components/NewGroupModal";

const ChatHeader = ({ chatId, markReady, auth }) => {
  const navigate = useNavigate();
  const [chatMetadata, setChatMetadata] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupImage64, setGroupImage64] = useState(null);
  const [savingGroupSettings, setSavingGroupSettings] = useState(false);

  const fetchMetadata = async () => {
    if (!chatId) {
      setChatMetadata(null);
      markReady();
      return;
    }

    try {
      const jsonData = await apiFetch(`/chat/metadata/${chatId}`)
      if (!jsonData.success) throw new Error(jsonData.error || "Failed to fetch metadata");

      setChatMetadata(jsonData.data);
      setGroupName(jsonData?.data?.name || "");
      markReady();
    } catch (err) {
      console.error("Error fetching metadata:", err);
    }
  }

  useEffect(() => {
    fetchMetadata();
  }, [chatId]);

  const copyInviteLink = async () => {
    if (!chatId || !auth?.user?.username) return;

    try {
      const chatHybridKey = await resolveChatHybridKey(chatId, auth.user.username);
      if (!chatHybridKey) {
        toast.error("Chat key is missing from secure storage.");
        return;
      }

      const inviteTransportKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const encryptedGroupKey = await encryptTextWithPassword(chatHybridKey, inviteTransportKey);
      const response = await apiFetch('/groups/generate-invite-code', {
        method: 'POST',
        body: JSON.stringify({ groupId: chatId, encryptedGroupKey }),
      });

      if (!response?.success || !response?.data?.invite) {
        toast.error(response?.error || "Could not generate invite code.");
        return;
      }

      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const inviteLink = `${baseUrl}/chat/join/${response.data.invite}/#/${encodeURIComponent(inviteTransportKey)}`;
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied to clipboard.");
      setMenuOpen(false);
    } catch (err) {
      console.error("Invite generation failed:", err);
      toast.error("Could not generate invite link right now.");
    }
  }

  const onGroupImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) {
      toast.error("Image must be under 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || "").split(",")[1];
      setGroupImage64(base64 || null);
    };
    reader.readAsDataURL(file);
  }

  const saveGroupSettings = async () => {
    if (!chatId || !groupName.trim() || savingGroupSettings) return;
    setSavingGroupSettings(true);
    try {
      const response = await apiFetch('/groups/update', {
        method: 'POST',
        body: JSON.stringify({ groupId: chatId, name: groupName.trim(), encodedImage: groupImage64 }),
      });
      if (!response?.success) {
        toast.error(response?.error || "Could not update group settings.");
        return;
      }
      toast.success("Group settings updated.");
      setGroupSettingsOpen(false);
      setMenuOpen(false);
      fetchMetadata();
      window.dispatchEvent(new Event("groups:refresh"));
    } catch (err) {
      console.error("Group settings update failed:", err);
      toast.error("Could not update group settings right now.");
    } finally {
      setSavingGroupSettings(false);
    }
  }

  const leaveGroup = async () => {
    if (!chatId) return;
    try {
      const response = await apiFetch('/groups/leave', {
        method: 'POST',
        body: JSON.stringify({ groupId: chatId }),
      });
      if (!response?.success) {
        toast.error(response?.error || "Could not leave group.");
        return;
      }
      toast.success("You left the group.");
      setMenuOpen(false);
      window.dispatchEvent(new Event("groups:refresh"));
      navigate('/chat');
    } catch (err) {
      console.error("Leave group failed:", err);
      toast.error("Could not leave group right now.");
    }
  }

  const myRole = chatMetadata?.people?.find((p) => p?.id === auth?.user?.id)?.role;

  if (!chatId) {
    return (
      <header className="h-[8vh] px-4 bg-gradient-to-r from-white/5 to-white/[0.02] border-b border-white/10 flex items-center justify-center">
        <p className="text-sm text-white/60">Select a chat to continue</p>
      </header>
    )
  }

  if (!chatMetadata) {
    return (
      <header className="h-[8vh] px-4 bg-gradient-to-r from-white/5 to-white/[0.02] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative"><div className="w-10 h-10 rounded-full bg-white/5 animate-pulse"></div></div>
          <div><p className="text-white text-sm font-semibold">Loading...</p><p className="text-white/40 text-xs">Fetching chat details</p></div>
        </div>
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
          <p className="text-xs text-white/40">{chatMetadata.online.length} of {chatMetadata.people.length} online</p>
        </div>
      </div>

      <div className="relative">
        <button onClick={() => setMenuOpen((v) => !v)} className="px-3 py-2 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 text-white/80 text-xs">
          Actions
        </button>
        {menuOpen && (
          <div className="absolute top-12 right-0 w-44 rounded-lg border border-white/10 bg-black/90 p-1 z-30">
            <button onClick={copyInviteLink} className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded">Invite</button>
            <button onClick={() => setGroupSettingsOpen(true)} className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded">Settings</button>
            <button onClick={leaveGroup} className="w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-white/10 rounded" disabled={myRole === "owner" && (chatMetadata.people.length > 1)}>
              {myRole === "owner" && (chatMetadata.people.length > 1) ? "Leave (owner blocked)" : "Leave"}
            </button>
          </div>
        )}
      </div>

      {groupSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-neutral-900 border border-white/10 p-5 flex flex-col gap-3">
            <h3 className="text-white font-semibold">Group Settings</h3>
            <input className="input" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group title" />
            <input type="file" accept="image/*" onChange={onGroupImageChange} className="text-xs text-white/70" />
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => setGroupSettingsOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveGroupSettings} disabled={savingGroupSettings}>{savingGroupSettings ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

const Sidebar = ({ auth, markReady, logout }) => {
  const [chats, setChats] = useState([]);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);

  const fetchChats = async () => {
    try {
      const jsonData = await apiFetch("/groups")
      if (!jsonData.success) throw new Error(jsonData.error || "Failed to fetch chats");

      setChats(jsonData.data);
      markReady();
    } catch (err) {
      console.error("Error fetching chats:", err);
      toast.error("We couldn't load your chats. See the console for more details.");
    }
  }

  useEffect(() => {
    if (!auth || !auth.isAuthenticated) return;

    fetchChats();
  }, [auth]);

  useEffect(() => {
    const onRefreshGroups = () => {
      if (!auth || !auth.isAuthenticated) return;
      fetchChats();
    };

    window.addEventListener("groups:refresh", onRefreshGroups);
    return () => window.removeEventListener("groups:refresh", onRefreshGroups);
  }, [auth]);

  const onLogout = async () => {
    try {
      await logout();
      window.location.href = '/auth/login';
    } catch (err) {
      console.error('Logout failed:', err);
      toast.error('Could not log out right now.');
    }
  }

  return (
    <aside className="sidebar flex flex-col h-full bg-gradient-to-b from-white/5 to-white/[0.02] border-r border-white/10">
      {/* Header Section */}
      <div className="global-chat p-4 border-b border-white/10">
        <h1 className="text-lg font-semibold text-white">(In2)Siders</h1>
        <NewGroupModal triggerClassName="w-9 p-2">
          <img src="/config.svg" /> {/* TODO: Change this to a plus */}
        </NewGroupModal>
      </div>

      {/* Users Section Header */}
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Direct Messages</h2>
      </div>

      {/* User List */}
      <div className="user-list flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="px-4 py-2 text-sm text-white/50">No active chats. Start a new conversation!</div>
        ) : (
          chats.map(chat => (
              <Link to={`/chat/${chat.id}`} key={chat.id}
                className="user-card group flex items-center gap-3 px-3 py-2 mx-2 rounded-lg hover:bg-white/10 transition-colors duration-200">
                <div className="relative flex-shrink-0">
                  <img src={chat.image ? chat.image : "/2.png"} alt={`${chat.name} avatar`} className="w-10 h-10 rounded-full object-cover" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white/20"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate group-hover:text-white transition-colors">{chat.name}</h3>
                  <p className="text-xs text-white/40 truncate">Active now</p>
                </div>
              </Link>
            ))
        )}
      </div>

      {/* User Panel */}
      <div className="user-panel border-t border-white/5 p-3 bg-white/[0.03]">
        <div className="flex items-center gap-3 w-full">
          <div className="relative">
            <button
              onClick={() => setAccountMenuOpen((v) => !v)}
              className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                <path d="M4 20a8 8 0 0 1 16 0" />
              </svg>
            </button>
            {accountMenuOpen && (
              <div className="absolute bottom-12 left-0 w-44 rounded-lg border border-white/10 bg-black/90 p-1 z-40">
                <button onClick={() => { setAccountSettingsOpen(true); setAccountMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded">Settings</button>
                <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-white/10 rounded">Logout</button>
              </div>
            )}
          </div>
          <div className="flex-1 flex-row min-w-0">
            <h4 className="text-sm font-medium text-white truncate">{auth.user.username}</h4>
          </div>
        </div>

        {accountSettingsOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl bg-neutral-900 border border-white/10 p-5 flex flex-col gap-3">
              <h3 className="text-white font-semibold">Account Settings</h3>
              <p className="text-sm text-white/60">Username</p>
              <input className="input" value={auth.user.username} disabled />
              <div className="flex justify-end">
                <button className="btn btn-ghost" onClick={() => setAccountSettingsOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

const ChatFooter = ({ cId, disabled }) => {
  const ws = useWebsocket();
  const { auth } = useAuth();
  const fileInputRef = useRef(null);

  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const messageInputRef = useRef(null);

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

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isSending || (!messageText.trim() && attachments.length === 0)) return;
    if (!cId) return;

    setIsSending(true);

    let encryptedBody = messageText;
    try {
      const hybridKey = await resolveChatHybridKey(cId, auth?.user?.username || "");
      if (hybridKey && messageText.trim()) {
        encryptedBody = await encryptMessageWithHybridKey(messageText, hybridKey);
      }
    } catch (err) {
      console.error("Could not encrypt outgoing message, sending plaintext.", err);
    }

    const cleanAttachments = attachments.map(({ previewUrl, ...rest }) => rest);

    const curated_object = {
      chat_id: cId,
      body: encryptedBody,
      attachments: cleanAttachments,
    };

    ws.emit("message:send", curated_object, (response) => {
      if (response?.success) {
        setMessageText("");
        setAttachments([]);
        setIsSending(false);

        setTimeout(() => {
          messageInputRef.current?.focus();
        }, 0);

      } else {
        alert("Failed to send: " + response?.error);
        setIsSending(false);
        messageInputRef.current?.focus();
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
          ref={messageInputRef}
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
  const { auth, loading, error, logout } = useAuth();
  const hasChatSelected = Boolean(chatId);

  const [readyStates, setReadyStates] = useState({ header: !hasChatSelected, chats: false }); // TODO: More ready states for different components
  const allReady = Object.values(readyStates).every(v => v === true);

  useEffect(() => {
    setReadyStates((prev) => ({ ...prev, header: !hasChatSelected }));
  }, [hasChatSelected]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  if (auth && !auth.isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <WebsocketProvider>
      <div className="flex flex-row h-screen w-screen">
        <Sidebar auth={auth} logout={logout} markReady={() => setReadyStates((prev) => ({ ...prev, chats: true }))} />

        <div className="chatUI">
          <ChatHeader chatId={chatId} auth={auth} markReady={() => setReadyStates((prev) => ({ ...prev, header: true }))} />
          <div className="messages">
            {hasChatSelected ? (
              <Outlet />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <h1 className="text-2xl font-bold text-white">Select a chat to continue</h1>
              </div>
            )}
          </div>
          <ChatFooter cId={chatId} disabled={!allReady || !hasChatSelected} />
        </div>
      </div>

    </WebsocketProvider >
  )
}
