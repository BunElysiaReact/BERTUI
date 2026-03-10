/**
 * Validates that a Server Island component follows all rules
 * @param {string} sourceCode - The component source code
 * @param {string} filePath - Path to the file (for error messages)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateServerIsland(sourceCode: string, filePath: string): {
    valid: boolean;
    errors: string[];
};
/**
 * Display validation errors in a clear format
 */
export function displayValidationErrors(filePath: any, errors: any): void;
/**
 * Extract and validate all Server Islands in a project
 */
export function validateAllServerIslands(routes: any): Promise<{
    serverIslands: any[];
    validationResults: {
        valid: boolean;
        errors: string[];
        route: any;
        path: any;
    }[];
}>;
//# sourceMappingURL=server-island-validator.d.ts.map