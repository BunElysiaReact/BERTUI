// bertui/src/server/request-handler.js - NEW FILE
// Standalone request handler for BertUI

import { createDevHandler } from './dev-handler.js';

/**
 * Handle a single HTTP request with BertUI
 * @param {Request} request - The HTTP request
 * @param {Object} options - Options
 * @param {string} options.root - Project root directory
 * @param {number} options.port - Port number
 * @returns {Promise<Response|null>} Response or null if not handled
 */
export async function handleRequest(request, options = {}) {
  const handler = await createDevHandler(options);
  return handler.handleRequest(request);
}

/**
 * Create a middleware function for Elysia
 * @param {Object} options - Options
 * @returns {Function} Elysia middleware
 */
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
    return; // Continue to next middleware
  };
}