export class HMRHandler {
    constructor(root: any);
    root: any;
    clients: Set<any>;
    compilationQueue: Map<any, any>;
    pendingUpdates: Set<any>;
    isProcessing: boolean;
    onOpen(ws: any): void;
    onClose(ws: any): void;
    onMessage(ws: any, message: any): void;
    notifyAll(message: any): void;
    queueRecompile(filename: any): void;
    processQueue(): Promise<void>;
    handleAccept(moduleId: any): void;
    handleDecline(moduleId: any): void;
    reload(): void;
    dispose(): void;
}
//# sourceMappingURL=hmr-handler.d.ts.map