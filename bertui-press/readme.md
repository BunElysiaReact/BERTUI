# ⚡ BertUI-Press

Lightning-fast markdown to HTML converter with file-based routing. Convert your documentation into beautiful static sites in seconds.

[![npm version](https://img.shields.io/npm/v/bertui-press.svg)](https://www.npmjs.com/package/bertui-press)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black)](https://bun.sh)

## 🚀 Quick Start

### Installation

```bash
bun add -D bertui-press
```

### Create Your Docs

```
my-project/
├── docs/
│   ├── index.md
│   ├── getting-started.md
│   └── api/
│       ├── introduction.md
│       └── reference.md
└── bertui-press.config.js
```

### Build

```bash
bunx bertui-press build
```

Your docs are now in `dist/docs/` ready to deploy! 🎉

## 📁 File-Based Routing

BertUI-Press automatically generates navigation from your file structure:

```
docs/
├── index.md              → /index.html
├── getting-started.md    → /getting-started.html
├── api/
│   ├── introduction.md   → /api/introduction.html
│   └── reference.md      → /api/reference.html
└── guides/
    └── advanced.md       → /guides/advanced.html
```

**Navigation is automatically generated with proper hierarchy!**

## 🎨 Features

- ⚡ **Blazing Fast** - Built on Bun for instant builds
- 📁 **File-Based Routing** - Automatic navigation from folder structure
- 🎨 **Beautiful Default Theme** - Professional docs out of the box
- 🔥 **Hot Reload** - Watch mode for instant updates
- 📱 **Responsive** - Mobile-friendly by default
- 🎯 **Zero Config** - Works immediately, customize when needed
- 💅 **GitHub Flavored Markdown** - Tables, code blocks, everything
- 🌈 **Syntax Highlighting** - Beautiful code examples
- 🔍 **SEO Friendly** - Proper meta tags and structure

## 📝 Commands

### Build Once

```bash
bertui-press build
```

Generates static HTML files in `dist/docs/`

### Dev Mode (Watch & Rebuild)

```bash
bertui-press dev
```

Watches for changes and rebuilds automatically. Perfect for writing docs!

## ⚙️ Configuration

Create `bertui-press.config.js` in your project root:

```javascript
export default {
  title: "My Awesome Docs",
  description: "Documentation for my awesome project",
  logo: "🚀",
  themeColor: "#667eea",
  github: "https://github.com/username/repo",
  
  // Optional: Custom input/output directories
  docsDir: "docs",      // default: "docs"
  outDir: "dist/docs"   // default: "dist/docs"
};
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | `"Documentation"` | Site title |
| `description` | string | `""` | Site description |
| `logo` | string | `"⚡"` | Logo emoji or text |
| `themeColor` | string | `"#667eea"` | Primary theme color |
| `github` | string | `""` | GitHub repo URL (shows link in sidebar) |
| `docsDir` | string | `"docs"` | Input directory |
| `outDir` | string | `"dist/docs"` | Output directory |

## 📖 Writing Docs

### Basic Markdown

```markdown
# My Page Title

This is a paragraph with **bold** and *italic* text.

## Section Heading

- List item 1
- List item 2
- List item 3

### Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, BertUI-Press!");
}
\`\`\`
```

### Advanced Features

**Tables:**

```markdown
| Feature | Status |
|---------|--------|
| Fast    | ✅     |
| Easy    | ✅     |
| Free    | ✅     |
```

**Blockquotes:**

```markdown
> **Note:** This is important information!
```

**Links:**

```markdown
[Link to another page](./getting-started.html)
[External link](https://github.com)
```

**Images:**

```markdown
![Alt text](./assets/image.png)
```

## 🎨 Customization

### Custom Template

Create your own HTML template:

```javascript
// bertui-press.config.js
export default {
  template: `
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
  <style>
    /* Your custom styles */
  </style>
</head>
<body>
  <nav>{{navigation}}</nav>
  <main>{{content}}</main>
</body>
</html>
  `
};
```

**Available template variables:**
- `{{title}}` - Page title (from h1)
- `{{siteTitle}}` - Site title (from config)
- `{{description}}` - Site description
- `{{logo}}` - Logo
- `{{themeColor}}` - Theme color
- `{{github}}` - GitHub URL
- `{{content}}` - Rendered HTML content
- `{{navigation}}` - Auto-generated navigation
- `{{config}}` - Full config as JSON

### Static Assets

Place images and other assets in `docs/assets/`:

```
docs/
├── assets/
│   ├── logo.png
│   └── screenshot.jpg
└── index.md
```

Reference them in your markdown:

```markdown
![Logo](./assets/logo.png)
```

Assets are automatically copied to the output directory.

## 🚀 Deployment

### Vercel

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel
```

**vercel.json:**

```json
{
  "buildCommand": "bertui-press build",
  "outputDirectory": "dist/docs"
}
```

### Netlify

```bash
# Install Netlify CLI
bun add -g netlify-cli

# Deploy
netlify deploy --prod
```

**netlify.toml:**

```toml
[build]
  command = "bertui-press build"
  publish = "dist/docs"
```

### GitHub Pages

1. Build your docs: `bertui-press build`
2. Push `dist/docs/` to `gh-pages` branch
3. Enable GitHub Pages in repo settings

### Static Hosting

Upload the contents of `dist/docs/` to any static hosting:
- AWS S3 + CloudFront
- Cloudflare Pages
- Firebase Hosting
- Any web server!

## 📊 Example Projects

### Basic Documentation

```
docs/
├── index.md           # Home page
├── installation.md    # Installation guide
├── usage.md          # Usage guide
└── api.md            # API reference
```

### Complex Project

```
docs/
├── index.md
├── getting-started/
│   ├── installation.md
│   ├── quick-start.md
│   └── configuration.md
├── guides/
│   ├── basics.md
│   ├── advanced.md
│   └── best-practices.md
├── api/
│   ├── classes.md
│   ├── functions.md
│   └── types.md
└── assets/
    ├── logo.png
    └── screenshots/
```

## 🛠️ Programmatic Usage

Use BertUI-Press in your own scripts:

```javascript
import { BertUIPress } from 'bertui-press';

const press = new BertUIPress({
  root: process.cwd(),
  docsDir: 'docs',
  outDir: 'dist/docs',
  config: {
    title: 'My Docs',
    themeColor: '#ff6b6b'
  }
});

// Build once
await press.build();

// Watch mode
press.dev();
```

## 🎯 Use Cases

- **Project Documentation** - Document your libraries and frameworks
- **Technical Blogs** - Write markdown, deploy as HTML
- **API References** - Beautiful API docs
- **Knowledge Bases** - Internal documentation
- **User Guides** - Product documentation
- **Tutorials** - Step-by-step guides

## 🆚 Comparison

| Feature | BertUI-Press | VitePress | Docusaurus |
|---------|-------------|-----------|------------|
| Runtime | Bun | Node | Node |
| Build Speed | ⚡⚡⚡ | ⚡⚡ | ⚡ |
| Setup Time | <1 min | ~5 min | ~10 min |
| Config Required | None | Some | Lots |
| Bundle Size | Tiny | Small | Large |

## 🤝 Contributing

We love contributions! Please:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a Pull Request

## 📄 License

MIT © [Pease Ernest](https://github.com/BunElysiaReact)

## 🙏 Credits

- Built with [Bun](https://bun.sh)
- Markdown parsing by [marked](https://marked.js.org)
- Logging by [ernest-logger](https://www.npmjs.com/package/ernest-logger)

---

**Built with ⚡ by developers who love speed**

[⭐ Star on GitHub](https://github.com/BunElysiaReact/bertui-press) • [📦 npm Package](https://www.npmjs.com/package/bertui-press)