// bertui/src/compiler/transform.js - NEW FILE
// PURE JSX/TSX transformation function - NO FILE SYSTEM

/**
 * Transform JSX/TSX code to JavaScript
 * @param {string} sourceCode - The source code to transform
 * @param {Object} options - Transformation options
 * @param {string} options.loader - 'jsx', 'tsx', 'ts', 'js' (default: 'tsx')
 * @param {string} options.env - 'development' or 'production' (default: 'development')
 * @param {boolean} options.addReactImport - Automatically add React import if missing (default: true)
 * @returns {Promise<string>} Transformed JavaScript code
 */
export async function transformJSX(sourceCode, options = {}) {
  const {
    loader = 'tsx',
    env = 'development',
    addReactImport = true
  } = options;

  // Skip transformation if it's plain JS without JSX
  if (loader === 'js' && !sourceCode.includes('React.createElement') && !/<[A-Z]/.test(sourceCode)) {
    return sourceCode;
  }

  try {
    // Create Bun transpiler instance
    const transpiler = new Bun.Transpiler({
      loader,
      target: 'browser',
      define: {
        'process.env.NODE_ENV': JSON.stringify(env)
      },
      tsconfig: {
        compilerOptions: {
          jsx: 'react',
          jsxFactory: 'React.createElement',
          jsxFragmentFactory: 'React.Fragment',
          target: 'ES2020',
          module: 'ESNext'
        }
      }
    });

    let transformed = await transpiler.transform(sourceCode);

    // Add React import if needed and not already present
    if (addReactImport && 
        !transformed.includes('import React') && 
        !transformed.includes('import * as React') &&
        (transformed.includes('React.createElement') || transformed.includes('jsx(') || transformed.includes('jsxs('))) {
      transformed = `import React from 'react';\n${transformed}`;
    }

    // Clean up any dev JSX references
    if (env === 'production') {
      transformed = transformed.replace(/jsxDEV/g, 'jsx');
    }

    return transformed;

  } catch (error) {
    throw new Error(`JSX transformation failed: ${error.message}`);
  }
}

/**
 * Synchronous version of transformJSX
 * Use only when you know the code is small and you need sync execution
 */
export function transformJSXSync(sourceCode, options = {}) {
  const {
    loader = 'tsx',
    env = 'development',
    addReactImport = true
  } = options;

  try {
    const transpiler = new Bun.Transpiler({
      loader,
      target: 'browser',
      define: {
        'process.env.NODE_ENV': JSON.stringify(env)
      }
    });

    let transformed = transpiler.transformSync(sourceCode);

    if (addReactImport && 
        !transformed.includes('import React') && 
        !transformed.includes('import * as React') &&
        (transformed.includes('React.createElement') || transformed.includes('jsx('))) {
      transformed = `import React from 'react';\n${transformed}`;
    }

    if (env === 'production') {
      transformed = transformed.replace(/jsxDEV/g, 'jsx');
    }

    return transformed;

  } catch (error) {
    throw new Error(`JSX transformation failed: ${error.message}`);
  }
}

/**
 * Check if code contains JSX syntax
 */
export function containsJSX(code) {
  return code.includes('React.createElement') || 
         code.includes('React.Fragment') ||
         /<[A-Z]/.test(code) ||
         code.includes('jsx(') ||
         code.includes('jsxs(') ||
         /<[a-z][a-z0-9]*\s/.test(code);
}

/**
 * Remove CSS imports from code (for production builds)
 */
export function removeCSSImports(code) {
  return code
    .replace(/import\s+['"][^'"]*\.css['"];?\s*/g, '')
    .replace(/import\s+['"]bertui\/styles['"]\s*;?\s*/g, '');
}

/**
 * Remove dotenv imports (for browser)
 */
export function removeDotenvImports(code) {
  return code
    .replace(/import\s+\w+\s+from\s+['"]dotenv['"]\s*;?\s*/g, '')
    .replace(/import\s+\{[^}]+\}\s+from\s+['"]dotenv['"]\s*;?\s*/g, '')
    .replace(/\w+\.config\(\s*\)\s*;?\s*/g, '');
}

/**
 * Fix relative imports to include .js extension
 */
export function fixRelativeImports(code) {
  const importRegex = /from\s+['"](\.\.?\/[^'"]+?)(?<!\.js|\.jsx|\.ts|\.tsx|\.json)['"]/g;
  
  return code.replace(importRegex, (match, path) => {
    if (path.endsWith('/') || /\.\w+$/.test(path)) {
      return match;
    }
    return `from '${path}.js'`;
  });
}