/**
 * Extract static HTML from a Server Island component
 * @param {string} sourceCode - The component source code
 * @param {string} filePath - Path to file (for error messages)
 * @returns {string|null} Extracted HTML or null if extraction fails
 */
export function extractStaticHTML(sourceCode: string, filePath?: string): string | null;
/**
 * Quick check if a file is a Server Island
 */
export function isServerIsland(sourceCode: any): any;
/**
 * Extract component name from file
 */
export function extractComponentName(filePath: any): any;
//# sourceMappingURL=extractor.d.ts.map