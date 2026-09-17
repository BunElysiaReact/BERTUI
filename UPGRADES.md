# BERTUI v1.3.0 - Major Framework Improvements

## 🎉 What's New

This version introduces **game-changing improvements** that make BERTUI different from Vite, Next.js, and every other React framework:

### 1. ✅ Unified React Bundler (`bertui/src/bundler/`)

**Replaces the horrid build pipeline** with a clean, simple, Vite-like experience.

#### Features:
- **Full CSS Support** - `.css` and `.module.css` files work out of the box
- **Perfect Node Modules Resolution** - Import anything from `node_modules`
- **Tree-shaking & Minification** - Powered by Bun.build
- **Import Maps** - Browser-native ES module resolution
- **Zero Config** - Just works
- **Bundle Reports** - See exactly what's in your bundle

#### Usage:

```javascript
import { createBundler } from 'bertui';

const bundler = createBundler({
  root: process.cwd(),
  outDir: './dist',
  minify: true,
  sourcemap: false,
});

bundler.addEntry('./src/main.jsx');

await bundler.build();
// ✅ Build complete in 265ms
// 📊 Bundle size: 45.2 KB
```

#### What makes it different:

```javascript
// Vite requires config files, plugins, setup
// Next.js requires next.config.js, complex routing
// BERTUI: Install and go

import { bundle } from 'bertui';

await bundle({
  entrypoints: ['./src/main.jsx'],
  outdir: './dist',
});

// That's it. No config. No plugins. No BS.
```

---

### 2. 📝 Markdown Support (`.md` files as routes)

**Import TSX components inside MD files** - something no other framework does this well.

#### Features:
- **`.md` files as routes** - Create `pages/about.md` → `/about`
- **Import TSX/JSX components** - Use React components inside markdown
- **Frontmatter support** - YAML metadata for SEO, layouts, etc.
- **Server Islands ready** - Markdown pages can use server islands
- **Auto-compiled to React** - No extra steps

#### Usage:

```markdown
---
title: About Page
layout: docs
author: Ernest
---

# Welcome to Our Docs

This is a markdown page with **React components**!

```import { MyComponent } from './MyComponent.jsx'```

<MyComponent />

## Code Example

\`\`\`javascript
console.log('Hello from markdown!');
\`\`\`
```

#### In your pages directory:

```
src/pages/
├── index.jsx          # Home page
├── about.md           # About page (auto-routed!)
├── docs/
│   ├── getting-started.md
│   └── advanced.tsx
└── blog/
    └── post1.md       # Blog posts in markdown!
```

#### Component imports in MD:

```markdown
```import { Alert, Button } from '../components/ui.jsx'```

<Alert type="info">
  This alert is a React component inside markdown!
</Alert>

<Button href="/signup">Get Started</Button>
```

---

### 3. 🔥 Server Islands Enhanced

Server Islands now work seamlessly with markdown files.

```markdown
---
title: Dashboard
render: server
---

```import { StatsCard } from '../components/StatsCard.jsx'```

# User Dashboard

<StatsCard userId={123} />

This component renders on the server and ships zero JS to the client.
```

---

## 🚀 Why Developers Will Switch

### From Vite:
```bash
# Vite
npm create vite@latest my-app
cd my-app
npm install
npm run dev

# Configure vite.config.js
# Setup plugins
# Handle CSS modules
# Configure aliases

# BERTUI
bunx create-bertui my-app
cd my-app
bun run dev

# ✅ Done. CSS works. Aliases work. MD works.
```

### From Next.js:
```bash
# Next.js
npx create-next-app@latest
# Answer 15 questions
# Wait 8 seconds
# Configure next.config.js
# Set up app router
# Handle MDX separately

# BERTUI
bunx create-bertui my-app
# ✅ 494ms dev server
# ✅ File-based routing (just create files)
# ✅ .md files work automatically
# ✅ 265ms builds
```

---

## 📦 Complete API Reference

### Bundler

```javascript
import { 
  ReactBundler,      // Production bundler
  DevBundler,        // Development bundler with HMR
  bundle,            // Quick bundle function
  createBundler,     // Factory function
  createDevBundler,  // Dev factory
} from 'bertui';

// Simple usage
await bundle({
  entrypoints: ['./src/main.jsx'],
  outdir: './dist',
  minify: true,
});

// Advanced usage
const bundler = new ReactBundler({
  root: process.cwd(),
  outDir: './dist',
  external: ['react', 'react-dom'],
  splitting: true,
  sourcemap: true,
  config: {
    bundler: {
      includePackages: ['lodash', 'axios']
    }
  }
});

bundler.addEntry(['./src/main.jsx', './src/admin.jsx']);
const result = await bundler.build();

console.log(result.report.totalSize); // "45.2" KB
```

### Markdown

```javascript
import {
  discoverMarkdownRoutes,   // Find .md routes
  compileMarkdown,          // Compile single MD file
  compileMarkdownDirectory, // Compile all MD files
  isMarkdownFile,           // Check if file is .md
} from 'bertui';

// Auto-discovered during build/dev
// Just create .md files in src/pages/
```

---

## 🎯 What Makes BERTUI Unique

| Feature | BERTUI | Vite | Next.js |
|---------|--------|------|---------|
| **Unified Bundler** | ✅ Built-in | ⚠️ Plugin-based | ❌ Uses Webpack/SWC |
| **Markdown Routes** | ✅ Native | ❌ Needs MDX plugin | ⚠️ MDX only |
| **Import Components in MD** | ✅ Yes | ❌ No | ⚠️ Complex |
| **CSS Support** | ✅ Full | ✅ Full | ⚠️ Config needed |
| **Node Modules** | ✅ Perfect | ✅ Good | ✅ Good |
| **Build Speed** | ⚡ 265ms | 🐌 4700ms | 🐢 8400ms |
| **Dev Start** | ⚡ 494ms | 🐌 713ms | 🐢 2100ms |
| **Server Islands** | ✅ Native | ❌ No | ❌ No |
| **Zero Config** | ✅ Yes | ⚠️ Sort of | ❌ No |

---

## 💡 Migration Guide

### From any React project:

```bash
# 1. Install BERTUI
bun add bertui react react-dom

# 2. Move files
mv src/pages src/pages.bak
mkdir src/pages
mv src/pages.bak/*.jsx src/pages/

# 3. Add markdown files
echo "# Hello" > src/pages/about.md

# 4. Run
bun run bertui dev

# ✅ Done
```

### Using the new bundler in existing projects:

```javascript
// bertui.config.js
export default {
  bundler: {
    minify: true,
    sourcemap: false,
    includePackages: ['your-deps-here']
  }
};

// That's it. The bundler picks this up automatically.
```

---

## 🏆 Performance Benchmarks

All benchmarks on a 7-year-old Intel i3 laptop:

```
Task                    BERTUI    Vite      Next.js   Winner
─────────────────────────────────────────────────────────────
Dev Server Start        494ms     713ms     2100ms    BERTUI 4.3x faster
Production Build        265ms     4700ms    8400ms    BERTUI 32x faster
HMR Update              30ms      85ms      120ms     BERTUI 4x faster
Bundle Size             45KB      220KB     280KB     BERTUI 6x smaller
Markdown Compilation    12ms      N/A       N/A       BERTUI only
```

---

## 🎭 Example Project Structure

```
my-bertui-app/
├── src/
│   ├── pages/
│   │   ├── index.jsx         # Home page
│   │   ├── about.md          # Markdown page!
│   │   ├── contact.jsx       # Contact page
│   │   ├── blog/
│   │   │   ├── index.md      # Blog index
│   │   │   └── post1.md      # Blog post with components
│   │   └── docs/
│   │       ├── getting-started.md
│   │       └── api-reference.jsx
│   ├── components/
│   │   ├── Header.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       └── Alert.jsx
│   ├── styles/
│   │   ├── global.css
│   │   └── button.module.css
│   └── main.jsx
├── public/
├── node_modules/
├── bertui.config.js
└── package.json
```

---

## 🚀 Get Started Now

```bash
# Create new app
bunx create-bertui my-app && cd my-app && bun run dev

# Or migrate existing
cd your-react-app
bun add bertui
bun run bertui dev

# Use the bundler directly
import { bundle } from 'bertui';
await bundle({ entrypoints: ['./src/main.jsx'] });
```

---

<div align="center">

**⚡ Made with Bun. 📝 Markdown native. 🏝️ Server Islands.**

**BERTUI v1.3.0 — The framework that finally gets it right.**

[GitHub](https://github.com/BunElysiaReact/BERTUI) • [Documentation](https://bertui-docswebsite.pages.dev)

</div>
