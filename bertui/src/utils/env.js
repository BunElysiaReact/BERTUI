// bertui/src/utils/env.js
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Load environment variables for BertUI
 * This runs at BUILD TIME (Node.js), not in the browser
 */
export function loadEnvVariables(root) {
  const envVars = {};
  
  // Load from process.env (already loaded by Bun/Node)
  for (const [key, value] of Object.entries(process.env)) {
    // Only expose variables that start with VITE_ or PUBLIC_
    if (key.startsWith('BERTUI_') || key.startsWith('PUBLIC_')) {
      envVars[key] = value;
    }
  }
  
  return envVars;
}

/**
 * Generate code to inject env variables into the browser
 */
export function generateEnvCode(envVars) {
  const envObject = Object.entries(envVars)
    .map(([key, value]) => `  "${key}": ${JSON.stringify(value)}`)
    .join(',\n');
  
  return `
// Environment variables injected at build time
export const env = {
${envObject}
};

 Make it available globally (optional)
if (typeof window !== 'undefined') {
  window.__BERTUI_ENV__ = env;
}
`;
}

/**
 * Replace process.env references in code with actual values
 */
export function replaceEnvInCode(code, envVars) {
  let result = code;
  
  // Replace process.env.VARIABLE_NAME with actual values
  for (const [key, value] of Object.entries(envVars)) {
    const regex = new RegExp(`process\\.env\\.${key}`, 'g');
    result = result.replace(regex, JSON.stringify(value));
  }
  
  return result;
}