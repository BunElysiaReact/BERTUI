/**
 * Handle a single HTTP request with BertUI
 * @param {Request} request - The HTTP request
 * @param {Object} options - Options
 * @param {string} options.root - Project root directory
 * @param {number} options.port - Port number
 * @returns {Promise<Response|null>} Response or null if not handled
 */
export function handleRequest(request: Request, options?: {
    root: string;
    port: number;
}): Promise<Response | null>;
/**
 * Create a middleware function for Elysia
 * @param {Object} options - Options
 * @returns {Function} Elysia middleware
 */
export function createElysiaMiddleware(options?: Object): Function;
//# sourceMappingURL=request-handler.d.ts.map