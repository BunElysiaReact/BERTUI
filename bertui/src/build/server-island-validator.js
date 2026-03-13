// bertui/src/build/server-island-validator.js
// Server Islands removed — all pages are client-rendered.

export function validateServerIsland(sourceCode, filePath) {
  return { valid: true, errors: [] };
}

export function displayValidationErrors(filePath, errors) {}

export async function validateAllServerIslands(routes) {
  return { serverIslands: [], validationResults: [] };
}