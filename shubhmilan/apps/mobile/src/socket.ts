import { io, type Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:4000';

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket | null> {
  if (socket?.connected) return socket;
  const token = await SecureStore.getItemAsync('access');
  if (!token) return null;
  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnectionDelayMax: 10_000,
  });
  return socket;
}

export function closeSocket() {
  socket?.disconnect();
  socket = null;
}
