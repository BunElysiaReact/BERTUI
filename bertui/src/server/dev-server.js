// bertui/src/server/dev-server.js - MODIFIED
// Now uses the new modular dev-handler

import { createDevHandler } from './dev-handler.js';
import logger from '../logger/logger.js';

export async function startDevServer(options = {}) {
  const handler = await createDevHandler(options);
  const server = await handler.start();
  return { handler, server };
}

// Re-export for backward compatibility
export { createDevHandler } from './dev-handler.js';
export { handleRequest } from './request-handler.js';