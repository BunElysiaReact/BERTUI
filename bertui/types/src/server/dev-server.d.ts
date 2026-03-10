export function startDevServer(options?: {}): Promise<{
    handler: {
        handleRequest: (request: any) => Promise<any>;
        start: () => Promise<any>;
        notifyClients: (message: any) => void;
        dispose: () => void;
        config: any;
        hasRouter: any;
        websocketHandler: {
            open(ws: any): void;
            close(ws: any): void;
        };
    };
    server: any;
}>;
export { createDevHandler } from "./dev-handler.js";
export { handleRequest } from "./request-handler.js";
//# sourceMappingURL=dev-server.d.ts.map