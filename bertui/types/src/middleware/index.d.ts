/**
 * Load and run user middleware from src/middleware.ts or src/middleware.js
 */
export function loadMiddleware(root: any): Promise<{
    default: any;
    onRequest: any;
    onResponse: any;
    onError: any;
} | null>;
/**
 * Run middleware chain for a request
 * Returns a Response if middleware intercepted, null to continue
 */
export function runMiddleware(middlewareMod: any, request: any, routeInfo?: {}): Promise<Response | null>;
/**
 * Middleware context passed to every middleware function
 */
export class MiddlewareContext {
    constructor(request: any, options?: {});
    request: any;
    url: URL;
    pathname: string;
    method: any;
    headers: {
        [k: string]: any;
    };
    params: any;
    route: any;
    _response: Response | null;
    _redirectTo: any;
    _stopped: boolean;
    locals: {};
    /** Respond early - stops further processing */
    respond(body: any, init?: {}): void;
    /** Redirect to another URL */
    redirect(url: any, status?: number): void;
    /** Set a response header (added to final response) */
    setHeader(key: any, value: any): void;
    _extraHeaders: {} | undefined;
    /** Check if middleware stopped the chain */
    get stopped(): boolean;
}
/**
 * MiddlewareManager - watches and reloads middleware on change
 */
export class MiddlewareManager {
    constructor(root: any);
    root: any;
    middleware: {
        default: any;
        onRequest: any;
        onResponse: any;
        onError: any;
    } | null;
    watcher: any;
    load(): Promise<this>;
    run(request: any, routeInfo?: {}): Promise<Response | null>;
    watch(): void;
    dispose(): void;
}
//# sourceMappingURL=index.d.ts.map