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
  server = app.listen(env.PORT);
  server.on('error', (error) => {
    console.error('HTTP server failed to start:', error);
    process.exit(1);
  });
  initializeRealtimeServer(server);
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
start().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
