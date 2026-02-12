// bertui/src/server-islands/extractor.js - PURE SERVER ISLAND EXTRACTOR
// Extract static HTML from Server Island components

import logger from '../logger/logger.js';

/**
 * Extract static HTML from a Server Island component
 * @param {string} sourceCode - The component source code
 * @param {string} filePath - Path to file (for error messages)
 * @returns {string|null} Extracted HTML or null if extraction fails
 */
export function extractStaticHTML(sourceCode, filePath = 'unknown') {
  try {
    // Find the return statement
    const returnMatch = sourceCode.match(/return\s*\(/);
    if (!returnMatch) {
      logger.warn(`⚠️  Could not find return statement in ${filePath}`);
      return null;
    }

    // Get code before return for validation
    const codeBeforeReturn = sourceCode.substring(0, returnMatch.index);
    
    // Check for hooks (disallowed in Server Islands)
    const hooks = [
      'useState', 'useEffect', 'useContext', 'useReducer',
      'useCallback', 'useMemo', 'useRef', 'useImperativeHandle',
      'useLayoutEffect', 'useDebugValue', 'useId',
      'useDeferredValue', 'useTransition', 'useSyncExternalStore'
    ];

    for (const hook of hooks) {
      const hookRegex = new RegExp(`\\b${hook}\\s*\\(`, 'g');
      if (hookRegex.test(codeBeforeReturn)) {
        logger.error(`❌ Server Island at ${filePath} contains React hook: ${hook}`);
        return null;
      }
    }

    // Check for router imports (disallowed)
    if (sourceCode.includes('from \'bertui/router\'') || 
        sourceCode.includes('from "bertui/router"')) {
      logger.error(`❌ Server Island at ${filePath} imports from 'bertui/router'`);
      return null;
    }

    // Check for event handlers (disallowed in static HTML)
    const eventHandlers = [
      'onClick=', 'onChange=', 'onSubmit=', 'onInput=', 
      'onFocus=', 'onBlur=', 'onMouseEnter=', 'onMouseLeave=',
      'onKeyDown=', 'onKeyUp=', 'onScroll='
    ];

    for (const handler of eventHandlers) {
      if (sourceCode.includes(handler)) {
        logger.error(`❌ Server Island at ${filePath} uses event handler: ${handler.replace('=', '')}`);
        return null;
      }
    }

    // Extract the JSX content
    const fullReturnMatch = sourceCode.match(/return\s*\(([\s\S]*?)\);?\s*}/);
    if (!fullReturnMatch) {
      logger.warn(`⚠️  Could not extract JSX from ${filePath}`);
      return null;
    }

    let html = fullReturnMatch[1].trim();

    // Remove comments
    html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    
    // Convert className to class
    html = html.replace(/className=/g, 'class=');
    
    // Convert style objects to inline CSS strings
    html = convertStyleObjects(html);
    
    // Fix self-closing tags
    html = fixVoidElements(html);
    
    // Remove JavaScript expressions
    html = removeJSExpressions(html);
    
    // Clean up whitespace
    html = html.replace(/\s+/g, ' ').trim();

    logger.debug(`   Extracted ${html.length} chars of static HTML from ${filePath}`);
    return html;

  } catch (error) {
    logger.error(`Failed to extract HTML from ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Convert React style objects to inline CSS strings
 */
function convertStyleObjects(html) {
  return html.replace(/style=\{\{([^}]+)\}\}/g, (match, styleObj) => {
    try {
      // Parse the style object properties
      const props = [];
      let current = '';
      let depth = 0;
      
      for (let i = 0; i < styleObj.length; i++) {
        const char = styleObj[i];
        if (char === '(') depth++;
        if (char === ')') depth--;
        
        if (char === ',' && depth === 0) {
          props.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      if (current.trim()) props.push(current.trim());

      // Convert to CSS string
      const cssString = props
        .map(prop => {
          const colonIndex = prop.indexOf(':');
          if (colonIndex === -1) return '';
          
          const key = prop.substring(0, colonIndex).trim();
          const value = prop.substring(colonIndex + 1).trim();
          
          if (!key || !value) return '';
          
          // Convert camelCase to kebab-case
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          // Remove quotes from value
          const cssValue = value.replace(/['"]/g, '');
          
          return `${cssKey}: ${cssValue}`;
        })
        .filter(Boolean)
        .join('; ');
      
      return `style="${cssString}"`;
    } catch (e) {
      return 'style=""';
    }
  });
}

/**
 * Fix void elements (self-closing tags)
 */
function fixVoidElements(html) {
  const voidElements = [
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
    'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
  ];

  return html.replace(/<(\w+)([^>]*)\s*\/>/g, (match, tag, attrs) => {
    if (voidElements.includes(tag.toLowerCase())) {
      // Keep self-closing for void elements
      return match;
    } else {
      // Expand to open/close tags for non-void elements
      return `<${tag}${attrs}></${tag}>`;
    }
  });
}

/**
 * Remove JavaScript expressions from JSX
 */
function removeJSExpressions(html) {
  return html
    // Template literals: {`value`} → value
    .replace(/\{`([^`]*)`\}/g, '$1')
    // String literals: {'value'} or {"value"} → value
    .replace(/\{(['"])(.*?)\1\}/g, '$2')
    // Number literals: {123} → 123
    .replace(/\{(\d+)\}/g, '$1')
    // Remove other expressions
    .replace(/\{[^}]+\}/g, '');
}

/**
 * Quick check if a file is a Server Island
 */
export function isServerIsland(sourceCode) {
  return sourceCode.includes('export const render = "server"');
}

/**
 * Extract component name from file
 */
export function extractComponentName(filePath) {
  const fileName = filePath.split(/[\/\\]/).pop() || '';
  return fileName.replace(/\.[^/.]+$/, '');
}