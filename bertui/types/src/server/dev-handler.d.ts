export function createDevHandler(options?: {}): Promise<{
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
}>;
//# sourceMappingURL=dev-handler.d.ts.map