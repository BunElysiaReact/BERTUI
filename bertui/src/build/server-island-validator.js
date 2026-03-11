// bertui/src/build/server-island-validator.js
// Fixed validation for Server Islands - no false positives!

import logger from '../logger/logger.js';

/**
 * Validates that a Server Island component follows all rules
 * @param {string} sourceCode - The component source code
 * @param {string} filePath - Path to the file (for error messages)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateServerIsland(sourceCode, filePath) {
  const errors = [];
  
  // SUPER AGGRESSIVE STRIPPING: Remove EVERYTHING that could be a false positive
  
  // First, remove all JSX prop values that contain code examples
  let cleanedCode = sourceCode
    // Remove the entire content of <Code> components (most common culprit)
    .replace(/<Code[^>]*>[\s\S]*?<\/Code>/g, '')
    // Remove the entire content of <InlineCode> components
    .replace(/<InlineCode[^>]*>[\s\S]*?<\/InlineCode>/g, '')
    // Remove any JSX expression that looks like it contains code
    .replace(/\{`[\s\S]*?`\}/g, '{}')
    .replace(/\{[\s\S]*?import[\s\S]*?\}/g, '{}')
    .replace(/\{[\s\S]*?useState[\s\S]*?\}/g, '{}')
    .replace(/\{[\s\S]*?useEffect[\s\S]*?\}/g, '{}')
    .replace(/\{[\s\S]*?fetch\([\s\S]*?\}/g, '{}');
  
  // Then strip all string literals
  cleanedCode = cleanedCode
    .replace(/`[\s\S]*?`/g, '""')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    // Remove comments
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Rule 1: No React hooks (check the cleaned code only)
  const hookPatterns = [
    'useState', 'useEffect', 'useContext', 'useReducer',
    'useCallback', 'useMemo', 'useRef', 'useImperativeHandle',
    'useLayoutEffect', 'useDebugValue', 'useId', 'useDeferredValue',
    'useTransition', 'useSyncExternalStore'
  ];
  
  for (const hook of hookPatterns) {
    // Look for the hook as a function call, but only in the cleaned code
    const regex = new RegExp(`\\b${hook}\\s*\\(`, 'g');
    
    // Also check that it's not preceded by "import" or part of a comment
    const matches = cleanedCode.match(regex);
    if (matches) {
      // Verify this isn't in an import statement by checking context
      const hookIndex = cleanedCode.indexOf(matches[0]);
      const contextBefore = cleanedCode.substring(Math.max(0, hookIndex - 50), hookIndex);
      
      if (!contextBefore.includes('import')) {
        errors.push(`❌ Uses React hook: ${hook}`);
      }
    }
  }
  
  // Rule 2: No bertui/router imports
  if (sourceCode.includes('from \'bertui/router\'') || 
      sourceCode.includes('from "bertui/router"')) {
    errors.push('❌ Imports from \'bertui/router\' (use <a> tags instead of Link)');
  }
  
  // Rule 3: No browser APIs (check cleaned code)
  const browserAPIs = [
    { pattern: '\\bwindow\\.(?!location)', name: 'window' },
    { pattern: '\\bdocument\\.', name: 'document' },
    { pattern: '\\blocalStorage\\.', name: 'localStorage' },
    { pattern: '\\bsessionStorage\\.', name: 'sessionStorage' },
    { pattern: '\\bnavigator\\.', name: 'navigator' },
    { pattern: '\\blocation\\.(?!href)', name: 'location' },
    { pattern: '\\bhistory\\.', name: 'history' },
    { pattern: '\\bfetch\\s*\\(', name: 'fetch' },
    { pattern: '\\.addEventListener\\s*\\(', name: 'addEventListener' },
    { pattern: '\\.removeEventListener\\s*\\(', name: 'removeEventListener' },
    { pattern: '\\bsetTimeout\\s*\\(', name: 'setTimeout' },
    { pattern: '\\bsetInterval\\s*\\(', name: 'setInterval' },
    { pattern: '\\brequestAnimationFrame\\s*\\(', name: 'requestAnimationFrame' },
    { pattern: '\\bconsole\\.', name: 'console' }
  ];
  
  for (const api of browserAPIs) {
    const regex = new RegExp(api.pattern, 'g');
    if (regex.test(cleanedCode)) {
      if (api.name === 'console') {
        logger.warn(`⚠️  ${filePath} uses console.log (will not work in static HTML)`);
      } else {
        errors.push(`❌ Uses browser API: ${api.name}`);
      }
    }
  }
  
  // Rule 4: No event handlers (check cleaned code)
  const eventHandlers = [
    'onClick=', 'onChange=', 'onSubmit=', 'onInput=', 'onFocus=',
    'onBlur=', 'onMouseEnter=', 'onMouseLeave=', 'onKeyDown=',
    'onKeyUp=', 'onScroll='
  ];
  
  for (const handler of eventHandlers) {
    const escapedHandler = handler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedHandler}\\s*{`, 'g');
    if (regex.test(cleanedCode)) {
      errors.push(`❌ Uses event handler: ${handler.replace('=', '')} (Server Islands are static HTML)`);
    }
  }
  
  // Rule 5: Check for dynamic imports
  if (/import\s*\(/.test(cleanedCode)) {
    errors.push('❌ Uses dynamic import() (not supported in Server Islands)');
  }
  
  // Rule 6: Check for async/await
  if (/async\s+function|async\s*\(|async\s+\w+\s*\(/.test(cleanedCode)) {
    errors.push('❌ Uses async/await (Server Islands must be synchronous)');
  }
  
  const valid = errors.length === 0;
  
  return { valid, errors };
}



/**
 * Display validation errors in a clear format
 */
export function displayValidationErrors(filePath, errors) {
  logger.error(`\n🏝️  Server Island validation failed: ${filePath}`);
  logger.error('\nViolations:');
  errors.forEach(error => logger.error(`  ${error}`));
  logger.error('\n📖 Server Island Rules:');
  logger.error('  ✅ Pure static JSX only');
  logger.error('  ❌ No React hooks (useState, useEffect, etc.)');
  logger.error('  ❌ No Link component (use <a> tags)');
  logger.error('  ❌ No browser APIs (window, document, fetch)');
  logger.error('  ❌ No event handlers (onClick, onChange, etc.)');
  logger.error('\n💡 Tip: Remove the "export const render = \\"server\\"" line');
  logger.error('   if you need these features (page will be client-only).\n');
}

/**
 * Extract and validate all Server Islands in a project
 */
export async function validateAllServerIslands(routes) {
  const serverIslands = [];
  const validationResults = [];
  
  for (const route of routes) {
    const sourceCode = await Bun.file(route.path).text();
    const isServerIsland = sourceCode.includes('export const render = "server"');
    
    if (isServerIsland) {
      const validation = validateServerIsland(sourceCode, route.path);
      
      validationResults.push({
        route: route.route,
        path: route.path,
        ...validation
      });
      
      if (validation.valid) {
        serverIslands.push(route);
      }
    }
  }
  
  return { serverIslands, validationResults };
}