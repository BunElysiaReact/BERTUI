// ==========================================
// bertui-press/src/index.js
// ==========================================
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync, cpSync } from 'fs';
import { join, dirname, basename, relative, extname } from 'path';
import { marked } from 'marked';
import { watch } from 'fs';
import { createLogger } from 'ernest-logger';

const logger = createLogger({
  time: true,
  emoji: true,
  level: 'info',
  prefix: '[BertUI-Press]'
});

export class BertUIPress {
  constructor(options = {}) {
    this.root = options.root || process.cwd();
    this.docsDir = join(this.root, options.docsDir || 'docs');
    this.outDir = join(this.root, options.outDir || 'dist/docs');
    this.template = options.template || this.defaultTemplate();
    this.config = options.config || this.loadConfig();
    this.navigation = [];
  }

  loadConfig() {
    const configPath = join(this.root, 'bertui-press.config.js');
    
    if (existsSync(configPath)) {
      try {
        const config = require(configPath);
        logger.success('Loaded bertui-press.config.js');
        return config.default || config;
      } catch (error) {
        logger.warn(`Failed to load config: ${error.message}`);
      }
    }
    
    return {
      title: 'Documentation',
      description: 'Documentation powered by BertUI-Press',
      logo: '⚡',
      themeColor: '#667eea',
      github: '',
      navigation: []
    };
  }

  async build() {
    logger.bigLog('BUILDING DOCUMENTATION', { color: 'blue' });
    
    if (!existsSync(this.docsDir)) {
      logger.error(`Docs directory not found: ${this.docsDir}`);
      process.exit(1);
    }

    if (existsSync(this.outDir)) {
      logger.info('Cleaning output directory...');
    }
    
    mkdirSync(this.outDir, { recursive: true });

    const startTime = Date.now();
    
    // Build navigation from file structure
    this.navigation = this.buildNavigation(this.docsDir);
    logger.info(`Discovered ${this.navigation.length} pages`);

    // Copy static assets
    const assetsDir = join(this.docsDir, 'assets');
    if (existsSync(assetsDir)) {
      const outAssetsDir = join(this.outDir, 'assets');
      cpSync(assetsDir, outAssetsDir, { recursive: true });
      logger.info('Copied static assets');
    }

    // Build all markdown files
    const files = this.getMarkdownFiles(this.docsDir);
    logger.info(`Building ${files.length} markdown files...`);
    
    for (const file of files) {
      try {
        const markdown = readFileSync(file, 'utf-8');
        const html = this.convertToHTML(markdown, file);
        const outPath = this.getOutputPath(file);
        
        const outDirPath = dirname(outPath);
        if (!existsSync(outDirPath)) {
          mkdirSync(outDirPath, { recursive: true });
        }
        
        writeFileSync(outPath, html);
        const relativePath = relative(this.docsDir, file);
        logger.success(`Built: ${relativePath}`);
      } catch (error) {
        logger.error(`Failed to build ${file}: ${error.message}`);
      }
    }

    const duration = Date.now() - startTime;
    logger.bigLog(`BUILD COMPLETE IN ${duration}ms`, { color: 'green' });
    logger.info(`Output: ${this.outDir}`);
  }

  dev() {
    logger.bigLog('STARTING DEV SERVER', { color: 'blue' });
    
    this.build().then(() => {
      logger.success('Initial build complete');
      logger.info(`👀 Watching: ${this.docsDir}`);
      
      watch(this.docsDir, { recursive: true }, async (eventType, filename) => {
        if (!filename) return;
        
        const ext = extname(filename);
        if (ext === '.md' || ext === '.markdown') {
          logger.info(`📝 File changed: ${filename}`);
          
          try {
            await this.build();
          } catch (error) {
            logger.error(`Rebuild failed: ${error.message}`);
          }
        }
      });

      const configPath = join(this.root, 'bertui-press.config.js');
      if (existsSync(configPath)) {
        watch(configPath, async () => {
          logger.info('📝 Config changed, rebuilding...');
          this.config = this.loadConfig();
          await this.build();
        });
      }
    }).catch(error => {
      logger.error(`Dev server failed: ${error.message}`);
      process.exit(1);
    });
  }

  buildNavigation(dir, basePath = '') {
    const nav = [];
    const entries = readdirSync(dir, { withFileTypes: true });
    
    // Sort: directories first, then files
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'assets') continue;
      
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        const children = this.buildNavigation(fullPath, relativePath);
        if (children.length > 0) {
          nav.push({
            type: 'directory',
            name: this.formatTitle(entry.name),
            path: relativePath.replace(/\\/g, '/'),
            children
          });
        }
      } else if (entry.name.endsWith('.md')) {
        const markdown = readFileSync(fullPath, 'utf-8');
        const title = this.extractTitle(markdown) || this.formatTitle(entry.name.replace('.md', ''));
        
        nav.push({
          type: 'file',
          name: title,
          path: relativePath.replace(/\\/g, '/').replace('.md', '.html')
        });
      }
    }
    
    return nav;
  }

  formatTitle(filename) {
    return filename
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  getMarkdownFiles(dir) {
    const files = [];
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'assets') continue;
      
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...this.getMarkdownFiles(fullPath));
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.markdown')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  convertToHTML(markdown, filepath) {
    // Configure marked with GitHub Flavored Markdown
    marked.setOptions({
      gfm: true,
      breaks: false,
      headerIds: true,
      mangle: false
    });

    const html = marked(markdown);
    const title = this.extractTitle(markdown) || 'Documentation';
    const currentPath = this.getOutputPath(filepath).replace(this.outDir, '');
    
    return this.template
      .replace(/\{\{title\}\}/g, title)
      .replace(/\{\{siteTitle\}\}/g, this.config.title)
      .replace(/\{\{description\}\}/g, this.config.description)
      .replace(/\{\{logo\}\}/g, this.config.logo)
      .replace(/\{\{themeColor\}\}/g, this.config.themeColor)
      .replace(/\{\{github\}\}/g, this.config.github)
      .replace('{{content}}', html)
      .replace('{{navigation}}', this.renderNavigation(currentPath))
      .replace('{{config}}', JSON.stringify(this.config));
  }

  renderNavigation(currentPath) {
    const renderItems = (items, level = 0) => {
      return items.map(item => {
        if (item.type === 'directory') {
          return `
            <div style="margin-left: ${level * 1}rem;">
              <div style="font-weight: 600; margin: 0.5rem 0; color: #667eea;">
                📁 ${item.name}
              </div>
              ${renderItems(item.children, level + 1)}
            </div>
          `;
        } else {
          const isActive = currentPath.includes(item.path);
          return `
            <a href="/${item.path}" 
               style="
                 display: block;
                 padding: 0.5rem;
                 margin-left: ${level * 1}rem;
                 color: ${isActive ? '#667eea' : '#666'};
                 text-decoration: none;
                 border-left: 3px solid ${isActive ? '#667eea' : 'transparent'};
                 background: ${isActive ? 'rgba(102, 126, 234, 0.1)' : 'transparent'};
                 border-radius: 4px;
                 transition: all 0.2s;
               "
               onmouseover="this.style.background='rgba(102, 126, 234, 0.1)'"
               onmouseout="this.style.background='${isActive ? 'rgba(102, 126, 234, 0.1)' : 'transparent'}'"
            >
              📄 ${item.name}
            </a>
          `;
        }
      }).join('');
    };

    return renderItems(this.navigation);
  }

  extractTitle(markdown) {
    const match = markdown.match(/^#\s+(.+)$/m);
    return match ? match[1] : null;
  }

  getOutputPath(filepath) {
    const relative = filepath.replace(this.docsDir, '');
    return join(this.outDir, relative.replace(/\.md$|\.markdown$/, '.html'));
  }

  defaultTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}} - {{siteTitle}}</title>
  <meta name="description" content="{{description}}">
  <meta name="theme-color" content="{{themeColor}}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.7;
      color: #333;
      background: #fafafa;
    }

    .container {
      display: grid;
      grid-template-columns: 280px 1fr;
      min-height: 100vh;
    }

    .sidebar {
      background: white;
      border-right: 1px solid #e5e7eb;
      padding: 2rem;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .logo {
      font-size: 2rem;
    }

    .site-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: {{themeColor}};
    }

    .content {
      max-width: 900px;
      padding: 3rem;
      background: white;
      margin: 2rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    h1, h2, h3, h4 {
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-weight: 700;
      line-height: 1.3;
    }

    h1 {
      font-size: 2.5rem;
      color: {{themeColor}};
      border-bottom: 3px solid {{themeColor}};
      padding-bottom: 0.5rem;
      margin-top: 0;
    }

    h2 {
      font-size: 2rem;
      color: #764ba2;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 0.5rem;
    }

    h3 { font-size: 1.5rem; color: #555; }
    h4 { font-size: 1.25rem; color: #666; }

    p { margin-bottom: 1.25rem; font-size: 1.05rem; }

    code {
      background: #f4f4f4;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #e83e8c;
    }

    pre {
      background: #1a1a1a;
      color: #4ade80;
      padding: 1.5rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1.5rem 0;
      border: 1px solid #333;
    }

    pre code {
      background: none;
      padding: 0;
      color: #4ade80;
      font-size: 0.95rem;
    }

    a {
      color: {{themeColor}};
      text-decoration: none;
      font-weight: 500;
    }

    a:hover {
      text-decoration: underline;
    }

    ul, ol {
      margin-left: 1.5rem;
      margin-bottom: 1.25rem;
    }

    li {
      margin-bottom: 0.5rem;
    }

    blockquote {
      border-left: 4px solid {{themeColor}};
      padding-left: 1.5rem;
      margin: 1.5rem 0;
      color: #666;
      font-style: italic;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
    }

    th, td {
      border: 1px solid #e5e7eb;
      padding: 0.75rem;
      text-align: left;
    }

    th {
      background: #f9fafb;
      font-weight: 600;
    }

    .github-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #333;
      color: white;
      border-radius: 6px;
      margin-top: 1rem;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .container {
        grid-template-columns: 1fr;
      }
      
      .sidebar {
        position: static;
        height: auto;
        border-right: none;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .content {
        margin: 1rem;
        padding: 1.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">{{logo}}</div>
        <div class="site-title">{{siteTitle}}</div>
      </div>
      
      <nav>
        {{navigation}}
      </nav>

      {{github}}
    </aside>

    <main class="content">
      {{content}}
    </main>
  </div>
</body>
</html>`;
  }
}

