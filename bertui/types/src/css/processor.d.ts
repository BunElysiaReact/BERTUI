/**
 * Minify CSS using Lightning CSS with fallback
 */
export function minifyCSS(css: any, options?: {}): Promise<any>;
/**
 * Synchronous version for build scripts
 */
export function minifyCSSSync(css: any, options?: {}): any;
/**
 * Combine multiple CSS files into one
 */
export function combineCSS(files: any): string;
/**
 * Extract CSS imports from JavaScript
 */
export function extractCSSImports(code: any): (string | undefined)[];
/**
 * Check if file is CSS
 */
export function isCSSFile(filename: any): any;
export function processSCSS(scssCode: any, options?: {}): Promise<any>;
export function compileSCSSFile(filePath: any, options?: {}): Promise<any>;
//# sourceMappingURL=processor.d.ts.map