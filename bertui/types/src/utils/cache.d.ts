export function cached(options?: {}): (target: any, propertyKey: any, descriptor: any) => any;
export class BertuiCache {
    constructor(options?: {});
    maxSize: any;
    ttl: any;
    stats: {
        hits: number;
        misses: number;
        sets: number;
        evictions: number;
    };
    store: Map<any, any>;
    fileCache: Map<any, any>;
    fileTimestamps: Map<any, any>;
    codeCache: Map<any, any>;
    cssCache: Map<any, any>;
    imageCache: Map<any, any>;
    weakCache: Map<any, any> | undefined;
    cleanupInterval: number;
    get(key: any, options?: {}): any;
    set(key: any, value: any, options?: {}): void;
    getFile(filePath: any, options?: {}): Promise<any>;
    getTransformed(sourceCode: any, options?: {}): any;
    setTransformed(sourceCode: any, result: any, options?: {}): void;
    getCSS(css: any, options?: {}): any;
    setCSS(css: any, result: any, options?: {}): void;
    mget(keys: any): any[];
    mset(entries: any): void;
    getStats(): {
        hits: number;
        misses: number;
        sets: number;
        evictions: number;
        hitRate: string;
        size: number;
        fileCacheSize: number;
        codeCacheSize: number;
        cssCacheSize: number;
        imageCacheSize: number;
        memory: {
            heapUsed: string;
            heapTotal: string;
            rss: string;
        };
    };
    getSize(value: any): any;
    evictLRU(): void;
    cleanup(): void;
    dispose(): void;
}
export const globalCache: BertuiCache;
//# sourceMappingURL=cache.d.ts.map