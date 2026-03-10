/**
 * Load environment variables from .env file
 * @param {string} root - Project root directory
 * @returns {Object} Environment variables
 */
export function loadEnvVariables(root: string): Object;
/**
 * Generate JavaScript code to expose environment variables
 * @param {Object} envVars - Environment variables object
 * @returns {string} JavaScript code
 */
export function generateEnvCode(envVars: Object): string;
/**
 * Replace process.env references in code
 * @param {string} code - Source code
 * @param {Object} envVars - Environment variables
 * @returns {string} Code with replaced env vars
 */
export function replaceEnvInCode(code: string, envVars: Object): string;
//# sourceMappingURL=env.d.ts.map