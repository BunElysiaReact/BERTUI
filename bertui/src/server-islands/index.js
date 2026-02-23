// bertui/src/server-islands/index.js - NEW FILE
// PURE Server Island extraction - AST-based, not regex

import { validateServerIsland } from '../build/server-island-validator.js';

function extractStaticHTML(componentCode) {
  // For now, use existing regex-based extractor
  // TODO: Replace with proper AST parser
  return extractJSXFromReturn(componentCode);
}

function extractJSXFromReturn(code) {
  const returnMatch = code.match(/return\s*\(([\s\S]*?)\);?\s*}/);
  if (!returnMatch) return null;
  
  let html = returnMatch[1].trim();
  
  // Basic transformations
  html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  html = html.replace(/className=/g, 'class=');
  
  // Convert style objects to strings
  html = html.replace(/style=\{\{([^}]+)\}\}/g, (match, styleObj) => {
    const props = styleObj.split(',').map(p => p.trim()).filter(Boolean);
    const cssString = props
      .map(prop => {
        const [key, value] = prop.split(':').map(s => s.trim());
        if (!key || !value) return '';
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        const cssValue = value.replace(/['"]/g, '');
        return `${cssKey}: ${cssValue}`;
      })
      .filter(Boolean)
      .join('; ');
    return `style="${cssString}"`;
  });
  
  // Fix void elements
  const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 
                        'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  
  html = html.replace(/<(\w+)([^>]*)\s*\/>/g, (match, tag, attrs) => {
    if (voidElements.includes(tag.toLowerCase())) {
      return match;
    }
    return `<${tag}${attrs}></${tag}>`;
  });
  
  // Remove JS expressions
  html = html.replace(/\{`([^`]*)`\}/g, '$1');
  html = html.replace(/\{(['"])(.*?)\1\}/g, '$2');
  html = html.replace(/\{(\d+)\}/g, '$1');
  
  return html;
}


export { extractStaticHTML, isServerIsland, extractComponentName } from './extractor.js';
export { validateServerIsland, displayValidationErrors, validateAllServerIslands } from '../build/server-island-validator.js';