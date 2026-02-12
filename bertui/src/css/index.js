// bertui/src/css/index.js - NEW FILE
// PURE CSS processing - no server

import { transform } from 'lightningcss';
import logger from '../logger/logger.js';

export async function minifyCSS(css, options = {}) {
  try {
    const { code } = transform({
      filename: options.filename || 'style.css',
      code: Buffer.from(css),
      minify: true,
      sourceMap: false,
      targets: {
        chrome: 90 << 16,
        firefox: 88 << 16,
        safari: 14 << 16,
        edge: 90 << 16
      },
      drafts: {
        nesting: true
      }
    });
    return code.toString();
  } catch (error) {
    logger.warn(`CSS minification failed: ${error.message}`);
    // Fallback minification
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,])\s*/g, '$1')
      .replace(/;}/g, '}')
      .trim();
  }
}

export function combineCSS(files) {
  return files.map(({ filename, content }) => 
    `/* ${filename} */\n${content}`
  ).join('\n\n');
}


export { minifyCSS, minifyCSSSync, combineCSS, extractCSSImports, isCSSFile } from './processor.js';
export { buildAllCSS } from '../build/processors/css-builder.js';
export { buildCSS, copyCSS } from '../build/css-builder.js';