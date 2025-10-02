// @repo/common/Utils/useSocket.ts (Para acceso Facil) - bleh
import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Base packet interface
export interface BasePacket {
    type: string;
    timestamp: string;
    data?: any;
}

// Socket hook
export const useSocket = (serverUrl: string = 'http://localhost:5000') => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [packets, setPackets] = useState<BasePacket[]>([]);

    // Connect to server
    const connect = useCallback(() => {
        const newSocket = io(serverUrl);
        
        newSocket.on('connect', () => {
            setIsConnected(true);
            console.log('Connected to server');
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Disconnected from server');
        });

        newSocket.on('packet', (packet: BasePacket) => {
            setPackets(prev => [...prev, packet]);
        });

        setSocket(newSocket);
        return newSocket;
    }, [serverUrl]);

    // Disconnect from server
    const disconnect = useCallback(() => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
        }
    }, [socket]);

    // Send packet
    const sendPacket = useCallback((type: string, data?: any) => {
        if (socket && isConnected) {
            const packet: BasePacket = {
                type,
                timestamp: new Date().toISOString(),
                data
            };
            socket.emit('packet', packet);
        }
    }, [socket, isConnected]);

    // Auto-connect on mount
    useEffect(() => {
        const newSocket = connect();
        
        return () => {
            newSocket.disconnect();
        };
    }, [connect]);

    return {
        isConnected,
        packets,
        sendPacket,
        disconnect,
        connect
    };
};