// '* as React' cuz this shit doesn't work without it.
import * as React from "react";
import { io, Socket } from "socket.io-client";

type WSContext = {
    socket: Socket | null;
    connected: boolean;
    emit: (event: string, ...args: any[]) => void;
    on: (event: string, cb: (...args: any[]) => void) => void;
    off: (event: string, cb?: (...args: any[]) => void) => void;
};

const WebsocketContext = React.createContext<WSContext | undefined>(undefined);

// AI bullshit
function getEnv(key: string) {
    if (import.meta.env[key]) {
        return import.meta.env[key]
    }
}

export const WebsocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [connected, setConnected] = React.useState(false);
    const socketRef = React.useRef<Socket | null>(null);

    React.useEffect(() => {
        const { url, path } = buildUrl();

        const token =
            getEnv("REACT_APP_WS_TOKEN", "VITE_WS_TOKEN", "NEXT_PUBLIC_WS_TOKEN", "WS_TOKEN") ??
            typeof window !== "undefined"
                ? localStorage.getItem("AUTH_TOKEN") || undefined
                : undefined;

        const opts: any = {
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: Infinity,
        };
        if (path) opts.path = path;
        if (token) opts.auth = { token };

        const socket = io(url, opts);
        socketRef.current = socket;

        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);
        const onConnectError = () => setConnected(false);

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("connect_error", onConnectError);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("connect_error", onConnectError);
            socket.disconnect();
            socketRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const emit = React.useCallback((event: string, ...args: any[]) => {
        socketRef.current?.emit(event, ...args);
    }, []);

    const on = React.useCallback((event: string, cb: (...args: any[]) => void) => {
        socketRef.current?.on(event, cb);
    }, []);

    const off = React.useCallback((event: string, cb?: (...args: any[]) => void) => {
        if (cb) socketRef.current?.off(event, cb);
        else socketRef.current?.removeAllListeners(event);
    }, []);

    const value: WSContext = {
        socket: socketRef.current,
        connected,
        emit,
        on,
        off,
    };

    return <WebsocketContext.Provider value={value}>{children}</WebsocketContext.Provider>;
};

export function useWebsocket() {
    const ctx = React.useContext(WebsocketContext);
    if (!ctx) throw new Error("useWebsocket must be used within a WebsocketProvider");
    return ctx;
}