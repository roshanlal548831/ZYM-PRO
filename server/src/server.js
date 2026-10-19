import { createServer } from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { startMembershipExpiryJob } from './jobs/membershipExpiryJob.js';
import { closeRealtimeServer, initializeRealtimeServer } from './services/realtimeService.js';

let server;
let expiryJob;
let shuttingDown = false;

async function start() {
  await connectDatabase();
  expiryJob = startMembershipExpiryJob();
  server = createServer(app);
  initializeRealtimeServer(server);
  server.listen(env.PORT);
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  expiryJob?.stop();
  await closeRealtimeServer();
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
start().catch(() => {
  process.exit(1);
});
