/**
 * Transform JSX/TSX code to JavaScript
 * @param {string} sourceCode - The source code to transform
 * @param {Object} options - Transformation options
 * @param {string} options.loader - 'jsx', 'tsx', 'ts', 'js' (default: 'tsx')
 * @param {string} options.env - 'development' or 'production' (default: 'development')
 * @param {boolean} options.addReactImport - Automatically add React import if missing (default: true)
 * @returns {Promise<string>} Transformed JavaScript code
 */
export function transformJSX(sourceCode: string, options?: {
    loader: string;
    env: string;
    addReactImport: boolean;
}): Promise<string>;
/**
 * Synchronous version of transformJSX
 * Use only when you know the code is small and you need sync execution
 */
export function transformJSXSync(sourceCode: any, options?: {}): any;
/**
 * Check if code contains JSX syntax
 */
export function containsJSX(code: any): any;
/**
 * Remove CSS imports from code (for production builds)
 */
export function removeCSSImports(code: any): any;
/**
 * Remove dotenv imports (for browser)
 */
export function removeDotenvImports(code: any): any;
/**
 * Fix relative imports to include .js extension
 */
export function fixRelativeImports(code: any): any;
//# sourceMappingURL=transform.d.ts.map