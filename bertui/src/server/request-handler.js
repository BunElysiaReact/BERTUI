// bertui/src/server/request-handler.js
import { createDevHandler } from './dev-handler.js';

const handlers = new Map();

async function getHandler(options) {
  const key = JSON.stringify(options);
  if (!handlers.has(key)) {
    handlers.set(key, await createDevHandler(options));
  }
  return handlers.get(key);
}

export async function handleRequest(request, options = {}) {
  const handler = await getHandler(options);
  return handler.handleRequest(request);
}

export function createElysiaMiddleware(options = {}) {
  return async (ctx) => {
    const response = await handleRequest(ctx.request, options);
    if (response) {
      ctx.set.status = response.status;
      response.headers.forEach((value, key) => {
        ctx.set.headers[key] = value;
      });
      return response.text();
    }
  };
}