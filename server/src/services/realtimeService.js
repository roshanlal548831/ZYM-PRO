import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import User from '../models/User.js';
import { allowedOrigins } from '../config/corsOptions.js';
import { env } from '../config/env.js';

let io;

function readCookie(header, name) {
  const entry = header?.split(';').map((value) => value.trim()).find((value) => value.startsWith(`${name}=`));
  if (!entry) return null;
  try { return decodeURIComponent(entry.slice(name.length + 1)); }
  catch { return null; }
}

function scheduleExpiryDisconnect(socket, expiresAt) {
  let timer;
  const checkExpiry = () => {
    if (!socket.connected) return;
    const remaining = expiresAt * 1000 - Date.now();
    if (remaining <= 0) {
      socket.emit('session:revoked');
      socket.disconnect(true);
      return;
    }
    timer = setTimeout(checkExpiry, Math.min(remaining, 2_147_000_000));
  };
  checkExpiry();
  return () => clearTimeout(timer);
}

export function initializeRealtimeServer(httpServer) {
  if (io) throw new Error('Realtime server has already been initialized');
  io = new Server(httpServer, {
    serveClient: false,
    cors: { origin: allowedOrigins, credentials: true, methods: ['GET', 'POST'] },
  });

  io.use(async (socket, next) => {
    const token = readCookie(socket.handshake.headers.cookie, 'accessToken');
    if (!token) {
      socket.data.user = null;
      return next();
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      if (payload.type !== 'access') throw new Error('Invalid session');
      const user = await User.findById(payload.sub).select('_id role isActive isEmailVerified +tokenVersion');
      if (!user || !user.isActive || !user.isEmailVerified || payload.tokenVersion !== user.tokenVersion) {
        throw new Error('Invalid session');
      }
      socket.data.user = { id: String(user._id), role: user.role };
      socket.data.expiresAt = payload.exp;
      next();
    } catch {
      // Treat expired or revoked cookies like an anonymous socket connection.
      socket.data.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    socket.join('public');
    const user = socket.data.user;
    if (user) {
      socket.join(`user:${user.id}`);
      socket.join(user.role === 'admin' ? 'admins' : 'members');
      const clearExpiryTimer = scheduleExpiryDisconnect(socket, socket.data.expiresAt);
      socket.once('disconnect', clearExpiryTimer);
    }
  });

  return io;
}

export function publishRealtimeChange(tags, { memberId, members = false, publicUpdate = false } = {}) {
  if (!io || !Array.isArray(tags) || tags.length === 0) return;
  const event = { tags };
  io.to('admins').emit('data:changed', event);
  if (memberId) io.to(`user:${String(memberId)}`).emit('data:changed', event);
  if (members) io.to('members').emit('data:changed', event);
  if (publicUpdate) io.to('public').emit('data:changed', event);
}

export function disconnectRealtimeUser(userId) {
  if (!io || !userId) return;
  const room = `user:${String(userId)}`;
  io.to(room).emit('session:revoked');
  io.in(room).disconnectSockets(true);
}

export function closeRealtimeServer() {
  if (!io) return Promise.resolve();
  const current = io;
  io = undefined;
  return new Promise((resolve) => current.close(resolve));
}
