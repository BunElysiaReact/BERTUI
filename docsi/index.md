# BertUI Documentation

Welcome to **BertUI** - the lightning-fast React development framework powered by Bun.

## ⚠️ Important Notice

**Built-in CSS animations are temporarily unavailable** due to compatibility issues with `bun.build`. They will return in an upcoming release. [Learn more](./guides/animations.html)

## Why BertUI?

BertUI combines the incredible speed of Bun with the elegance of React, giving you:

- ⚡ **Instant Startup** - Dev server starts in <100ms
- 📁 **File-Based Routing** - Just create files, routes happen automatically
- 🔥 **Hot Module Replacement** - See changes instantly
- 📦 **Zero Config** - Works out of the box
- 🚀 **Production Ready** - Optimized builds with code splitting

## Quick Start

Get started in 30 seconds:

```bash
bunx create-bertui my-app
cd my-app
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and start building!

## What You Get

When you run `bunx create-bertui`, you get:

✅ **Complete project structure** with best practices  
✅ **File-based routing** already configured  
✅ **Sample pages** showing routing in action  
✅ **Beautiful example components**  
✅ **All dependencies** pre-installed  
✅ **Zero configuration** needed

## Features

### 📁 File-Based Routing

```
src/pages/
├── index.jsx              → /
├── about.jsx              → /about
├── blog/
│   ├── index.jsx         → /blog
│   └── [slug].jsx        → /blog/:slug (dynamic!)
└── user/[id]/posts.jsx   → /user/:id/posts
```

Just create files. Routes happen automatically. Magic! ✨

### 🔥 Hot Module Replacement

Edit your files and see changes **instantly** without losing component state. No refresh needed!

### ⚡ Lightning Fast

- **<100ms** dev server startup
- **<50ms** hot module reload  
- **Sub-second** production builds
- Powered by Bun's native speed

### 📦 Production Ready

```bash
bun run build
```

Creates optimized bundles with:
- ✅ Automatic code splitting
- ✅ Minification
- ✅ Tree shaking
- ✅ Source maps

## Next Steps

### Getting Started
- [Installation Guide](./getting-started/installation.html) - Set up BertUI
- [Your First Page](./getting-started/first-page.html) - Create a simple page

### Guides
- [File-Based Routing](./guides/routing.html) - Master routing
- ~~[CSS Animations](./guides/animations.html)~~ - Temporarily unavailable (see alternatives)

### Tutorials
- [Build a Blog](./tutorials/blog.html) - Step-by-step tutorial

### Reference
- [API Reference](./api/reference.html) - Complete API docs

## Community

- [GitHub](https://github.com/BunElysiaReact/BERTUI) - Source code & issues
- [Report Issues](https://github.com/BunElysiaReact/BERTUI/issues) - Found a bug?
- [Discussions](https://github.com/BunElysiaReact/BERTUI/discussions) - Ask questions

## Support the Project

If you find BertUI useful:
- ⭐ Star us on [GitHub](https://github.com/BunElysiaReact/BERTUI)
- 🐛 Report bugs and request features
- 📢 Share with other developers
- 💡 Contribute improvements

---

**Built with ⚡ by developers who love speed**