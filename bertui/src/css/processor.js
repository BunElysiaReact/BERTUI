// bertui/src/css/processor.js - PURE CSS PROCESSING
import { transform } from 'lightningcss';
import logger from '../logger/logger.js';

/**
 * Minify CSS using Lightning CSS with fallback
 */
export async function minifyCSS(css, options = {}) {
  const {
    filename = 'style.css',
    minify = true,
    sourceMap = false,
    targets = {
      chrome: 90 << 16,
      firefox: 88 << 16,
      safari: 14 << 16,
      edge: 90 << 16
    }
  } = options;

  // Empty CSS
  if (!css || css.trim() === '') {
    return '/* Empty CSS */';
  }

  try {
    const { code } = transform({
      filename,
      code: Buffer.from(css),
      minify,
      sourceMap,
      targets,
      drafts: {
        nesting: true
      }
    });
    
    return code.toString();
  } catch (error) {
    logger.warn(`Lightning CSS failed: ${error.message}, using fallback minifier`);
    return fallbackMinifyCSS(css);
  }
}

/**
 * Synchronous version for build scripts
 */
export function minifyCSSSync(css, options = {}) {
  const {
    filename = 'style.css',
    minify = true,
    sourceMap = false
  } = options;

  if (!css || css.trim() === '') {
    return '/* Empty CSS */';
  }

  try {
    const { code } = transform({
      filename,
      code: Buffer.from(css),
      minify,
      sourceMap,
      drafts: {
        nesting: true
      }
    });
    return code.toString();
  } catch (error) {
    return fallbackMinifyCSS(css);
  }
}

/**
 * Combine multiple CSS files into one
 */
export function combineCSS(files) {
  if (!Array.isArray(files)) {
    throw new Error('combineCSS expects an array of {filename, content}');
  }

  return files.map(({ filename, content }) => {
    // Add file comment for debugging
    const header = `/* ${filename} */\n`;
    return header + content;
  }).join('\n\n');
}

/**
 * Fallback CSS minifier (simple but works)
 */
function fallbackMinifyCSS(css) {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove whitespace
    .replace(/\s+/g, ' ')
    // Remove space around { } : ; ,
    .replace(/\s*([{}:;,])\s*/g, '$1')
    // Remove last semicolon before }
    .replace(/;}/g, '}')
    // Remove leading/trailing space
    .trim();
}

/**
 * Extract CSS imports from JavaScript
 */
export function extractCSSImports(code) {
  const imports = [];
  const regex = /import\s+['"]([^'"]*\.css)['"];?/g;
  let match;
  
  while ((match = regex.exec(code)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

/**
 * Check if file is CSS
 */
export function isCSSFile(filename) {
  return filename.toLowerCase().endsWith('.css');
}