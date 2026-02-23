// '* as React' cuz this shit doesn't work without it.
import * as React from "react";
import { io, ManagerOptions, Socket, SocketOptions } from "socket.io-client";

type WSContext = {
    socket: Socket | null;
    connected: boolean;
    emit: (event: string, ...args: any[]) => void;
    on: (event: string, cb: (...args: any[]) => void) => void;
    off: (event: string, cb?: (...args: any[]) => void) => void;
};

const WebsocketContext = React.createContext<WSContext | undefined>(undefined);

// AI bullshit
function getEnv(key: string, required: boolean = false) {
    if (import.meta.env[key]) {
      if(required && !import.meta.env[key]) {
        throw new Error(`Environment variable ${key} is required but not set.`);
      }
      return import.meta.env[key]
    }
}

export const WebsocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [connected, setConnected] = React.useState(false);
    const socketRef = React.useRef<Socket | null>(null);

    React.useEffect(() => {
        const url = getEnv("VITE_WS_URI", true);

        const opts: Partial<ManagerOptions & SocketOptions> = {
          transports: ["websocket"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 3,
          rememberUpgrade: true,
        };

        const socket = io(url, opts);
        socketRef.current = socket;

        const onConnect = () => {
            setConnected(true);
            console.log("Websocket connected");
        };
        const onDisconnect = () => {
            setConnected(false);
            console.log("Websocket disconnected");
        };
        const onConnectError = (error: Error) => {
            setConnected(false);
            console.log("Websocket connection error", error);
        };

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
    }, []);

    const emit = React.useCallback((event: string, ...args: any[]) => {
        socketRef.current?.emit(event, ...args);
    }, []);

    const on = React.useCallback((event: string, cb: (...args: any[]) => void) => {
        if (socketRef.current) socketRef.current.on(event, cb);
    }, []);

    const off = React.useCallback((event: string, cb?: (...args: any[]) => void) => {
        if (cb) socketRef.current?.off(event, cb);
        else socketRef.current?.removeAllListeners(event);
    }, []);

    const value: WSContext = React.useMemo(() => ({
        socket: socketRef.current,
        connected,
        emit,
        on,
        off,
    }), [connected, emit, on, off]);

    return <WebsocketContext.Provider value={value}>{children}</WebsocketContext.Provider>;
};

export function useWebsocket() {
    const ctx = React.useContext(WebsocketContext);
    if (!ctx) throw new Error("useWebsocket must be used within a WebsocketProvider");
    return ctx;
}
