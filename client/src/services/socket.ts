import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

let socket: Socket | null = null;

/**
 * Returns the singleton Socket.io client.
 * Automatically connects with the JWT from localStorage.
 * Call disconnect() on logout.
 */
export const getSocket = (): Socket => {
  if (socket?.connected) return socket;

  const token = localStorage.getItem('trimaki_token');

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[WS] Connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[WS] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[WS] Disconnected:', reason);
  });

  return socket;
};

/** Disconnect and clean up the socket (call on logout) */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
