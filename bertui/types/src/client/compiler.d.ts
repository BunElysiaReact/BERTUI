export function compileProject(root: any): Promise<{
    outDir: any;
    stats: {
        files: number;
        skipped: number;
    };
    routes: any[];
}>;
export function compileFile(srcPath: any, root: any): Promise<{
    success: boolean;
    outputPath?: never;
} | {
    outputPath: any;
    success: boolean;
}>;
//# sourceMappingURL=compiler.d.ts.map