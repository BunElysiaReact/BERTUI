// bertui/src/md/index.js - Markdown Support with Server Islands
// Import .md files alongside .tsx/.jsx files
// Support for importing TSX components inside MD files

import { join, extname, dirname, relative } from 'path';
import { readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import logger from '../logger/logger.js';

/**
 * Discover markdown routes alongside JSX/TSX routes
 */
export async function discoverMarkdownRoutes(pagesDir) {
  const routes = [];
  
  async function scanDirectory(dir, basePath = '') {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, relativePath);
      } else if (entry.isFile()) {
        const ext = extname(entry.name);
        
        // Support .md files as routes
        if (ext === '.md') {
          const fileName = entry.name.replace(ext, '');
          if (fileName === 'loading') continue;

          let route = '/' + relativePath.replace(/\\/g, '/').replace(ext, '');
          if (fileName === 'index') {
            route = route.replace('/index', '') || '/';
          }

          const isDynamic = fileName.includes('[') && fileName.includes(']');
          
          routes.push({
            route: route === '' ? '/' : route,
            file: relativePath.replace(/\\/g, '/'),
            path: fullPath,
            type: isDynamic ? 'dynamic' : 'static',
            isMarkdown: true
          });
        }
      }
    }
  }
  
  await scanDirectory(pagesDir);
  return routes;
}

/**
 * Compile a markdown file to a React component
 * Supports importing and using TSX/JSX components inside MD files
 */
export async function compileMarkdown(srcPath, outDir, root, aliasMap = new Map()) {
  const filename = srcPath.split(/[\\/]/).pop();
  const outFilename = filename.replace(/\.md$/, '.js');
  const outPath = join(outDir, outFilename);
  
  try {
    let mdContent = await Bun.file(srcPath).text();
    
    // Extract frontmatter if present
    const frontmatter = extractFrontmatter(mdContent);
    mdContent = removeFrontmatter(mdContent);
    
    // Parse markdown content for component imports
    const { componentImports, processedMd } = extractComponentImports(mdContent, srcPath, root, aliasMap);
    
    // Convert markdown to JSX
    const jsxContent = markdownToJSX(processedMd);
    
    // Generate the React component
    const componentCode = generateMarkdownComponent(
      filename,
      jsxContent,
      componentImports,
      frontmatter
    );
    
    await Bun.write(outPath, componentCode);
    logger.debug(`Compiled markdown: ${filename} → ${outFilename}`);
    
    return { success: true, outputPath: outPath };
    
  } catch (error) {
    logger.error(`Failed to compile markdown ${filename}: ${error.message}`);
    throw error;
  }
}

/**
 * Extract YAML frontmatter from markdown
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return {};
  
  const yaml = match[1];
  const frontmatter = {};
  
  yaml.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      frontmatter[key.trim()] = valueParts.join(':').trim();
    }
  });
  
  return frontmatter;
}

/**
 * Remove frontmatter from markdown content
 */
function removeFrontmatter(content) {
  return content.replace(/^---\n[\s\S]*?\n---\n/, '');
}

/**
 * Extract component imports from markdown
 * Supports syntax like:
 * ```import { MyComponent } from './MyComponent.jsx'```
 * or
 * <MyComponent /> where we auto-detect imports
 */
function extractComponentImports(mdContent, srcPath, root, aliasMap) {
  const imports = new Set();
  const importRegex = /```import\s+([^`]+)```/g;
  let match;
  
  let processedMd = mdContent;
  
  // Extract explicit imports
  while ((match = importRegex.exec(mdContent)) !== null) {
    const importStatement = match[1].trim();
    imports.add(importStatement);
    // Remove the import block from markdown
    processedMd = processedMd.replace(match[0], '');
  }
  
  // Also detect component usage patterns like <ComponentName />
  // and try to resolve them
  const componentUsageRegex = /<([A-Z][a-zA-Z0-9]*)/g;
  const usedComponents = new Set();
  
  while ((match = componentUsageRegex.exec(processedMd)) !== null) {
    usedComponents.add(match[1]);
  }
  
  // For now, we'll rely on explicit imports
  // Future enhancement: auto-import from a components directory
  
  return {
    componentImports: Array.from(imports),
    processedMd: processedMd
  };
}

/**
 * Convert markdown syntax to JSX
 */
function markdownToJSX(mdContent) {
  let jsx = mdContent;
  
  // Code blocks
  jsx = jsx.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code className="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Inline code
  jsx = jsx.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Bold
  jsx = jsx.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  jsx = jsx.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Links
  jsx = jsx.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Images
  jsx = jsx.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');
  
  // Headings
  jsx = jsx.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  jsx = jsx.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  jsx = jsx.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  jsx = jsx.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  jsx = jsx.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  jsx = jsx.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Paragraphs (simple approach - split by double newlines)
  const paragraphs = jsx.split(/\n\n+/);
  jsx = paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<')) return p; // Already JSX
    if (p.startsWith('```')) return p; // Code block
    return `<p>${p.replace(/\n/g, '<br />')}</p>`;
  }).join('\n');
  
  // Unordered lists
  jsx = jsx.replace(/^- (.+)$/gm, '<li>$1</li>');
  jsx = jsx.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Ordered lists
  jsx = jsx.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Horizontal rule
  jsx = jsx.replace(/^---$/gm, '<hr />');
  
  // Blockquotes
  jsx = jsx.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  
  return jsx;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Generate the final React component from markdown
 */
function generateMarkdownComponent(filename, jsxContent, componentImports, frontmatter) {
  const componentName = filename.replace(/\.md$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
  
  const imports = componentImports.length > 0 
    ? componentImports.join('\n') + '\n'
    : '';
  
  const frontmatterData = Object.keys(frontmatter).length > 0
    ? `\nexport const frontmatter = ${JSON.stringify(frontmatter)};\n`
    : '';
  
  return `${imports}import React from 'react';
${frontmatterData}
export default function ${componentName}() {
  return (
    <div className="markdown-content">
      ${jsxContent}
    </div>
  );
}
`;
}

/**
 * Compile all markdown files in a directory
 */
export async function compileMarkdownDirectory(srcDir, outDir, root, envVars, aliasMap) {
  const stats = { files: 0, skipped: 0 };
  const files = readdirSync(srcDir);
  
  for (const file of files) {
    const srcPath = join(srcDir, file);
    const stat = statSync(srcPath);
    
    if (stat.isDirectory()) {
      if (file === 'api' || file === 'templates') {
        continue;
      }
      const subOutDir = join(outDir, file);
      mkdirSync(subOutDir, { recursive: true });
      const subStats = await compileMarkdownDirectory(srcPath, subOutDir, root, envVars, aliasMap);
      stats.files += subStats.files;
      stats.skipped += subStats.skipped;
    } else if (file.endsWith('.md')) {
      try {
        await compileMarkdown(srcPath, outDir, root, aliasMap);
        stats.files++;
      } catch (error) {
        logger.error(`Failed to compile ${file}: ${error.message}`);
        stats.skipped++;
      }
    }
  }
  
  return stats;
}

/**
 * Check if a file is a markdown file
 */
export function isMarkdownFile(filePath) {
  return filePath.endsWith('.md');
}
