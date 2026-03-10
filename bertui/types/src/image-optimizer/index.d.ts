export function optimizeImage(buffer: any, options?: {}): Promise<{
    data: any;
    original_size: any;
    optimized_size: any;
    format: any;
    savings_percent: number;
}>;
export function optimizeImagesBatch(images: any, format?: string, options?: {}): Promise<({
    filename: any;
    data: any;
    original_size: any;
    optimized_size: any;
    format: any;
    savings_percent: number;
    error?: never;
    success?: never;
} | {
    filename: any;
    error: any;
    success: boolean;
})[]>;
export function hasWasm(): boolean;
export const version: "1.1.7";
//# sourceMappingURL=index.d.ts.map