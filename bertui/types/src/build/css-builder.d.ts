/**
 * Build and minify CSS for production using Lightning CSS
 * @param {string} srcPath - Source CSS file path
 * @param {string} destPath - Destination CSS file path
 */
export function buildCSS(srcPath: string, destPath: string): Promise<{
    success: boolean;
    size: string;
}>;
/**
 * Copy CSS without minification (for dev)
 * @param {string} srcPath - Source CSS file path
 * @param {string} destPath - Destination CSS file path
 */
export function copyCSS(srcPath: string, destPath: string): Promise<{
    success: boolean;
}>;
//# sourceMappingURL=css-builder.d.ts.map