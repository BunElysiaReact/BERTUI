# BertUI ⚡🏝️

**The fastest React frontend framework.**

Zero configuration. 494ms dev server. 265ms builds. **Perfect SEO with Server Islands.**

Powered by Bun and Elysia. **Built for developers who refuse to wait.**

[![Production Ready](https://img.shields.io/badge/status-production--ready-brightgreen)](https://github.com/BunElysiaReact/BERTUI) 
[![Version](https://img.shields.io/badge/version-1.1.1-blue)](https://www.npmjs.com/package/bertui)
[![Bun Powered](https://img.shields.io/badge/runtime-Bun-f472b6)](https://bun.sh) 
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

```bash
# One command. Zero config. Instant speed.
bunx create-bertui my-app && cd my-app && bun run dev
```

---

## 🎯 What BertUI Is

**A frontend framework that gives you everything React should have had from day one:**

- ⚡ **Sub-500ms dev starts** - Faster than Vite, Next.js, and everything else
- 🏗️ **Sub-300ms builds** - Production builds in the time others compile one file
- 🏝️ **Server Islands** - Optional SSG for perfect SEO (one line of code)
- 📁 **File-based routing** - Just create files in `pages/`, that's it
- 🗺️ **Auto SEO** - Sitemap and robots.txt generated automatically
- 📘 **TypeScript ready** - Full type definitions, zero setup required
- 🎨 **CSS built-in** - Global styles with LightningCSS optimization
- 🔥 **30ms HMR** - Instant hot reloading that actually works

**No webpack config. No babel setup. No framework fatigue. Just React, done right.**

---

## ⚡ Performance That Matters

**Real benchmarks on a 7-year-old laptop (Intel i3-2348M, 7.6GB RAM):**

| Metric | BertUI | Vite | Next.js | Your Gain |
|--------|--------|------|---------|-----------|
| Dev Server | **494ms** | 713ms | 2,100ms | 1.4-4.3x faster ⚡ |
| Prod Build | **265ms** | 4,700ms | 8,400ms | 18-32x faster ⚡ |
| Bundle Size | **100KB** | 220KB | 280KB | 2.2-2.8x smaller ⚡ |
| HMR Speed | **30ms** | 85ms | 120ms | 2.8-4x faster ⚡ |

**If BertUI is this fast on old hardware, imagine what it does on yours.** 🚀

> Full methodology and reproducible benchmarks: [PERFORMANCE.md](PERFORMANCE.md)

---

## 🏝️ Server Islands: Perfect SEO, Zero Complexity

**The problem:** Every React framework makes you choose:
- ✅ Vite: Fast dev, ❌ terrible SEO (client-only)
- ✅ Next.js: Good SEO, ❌ slow builds + server required
- ✅ Gatsby: Perfect SEO, ❌ 45-second builds

**BertUI's solution:** Server Islands (optional SSG)

```jsx
// src/pages/about.jsx

// 🏝️ Add ONE line to enable static generation
export const render = "server";

// 🎯 Optional: Add SEO metadata
export const meta = {
  title: "About Us",
  description: "Learn about our team",
  keywords: "about, company, team"
};

// ⚛️ Write normal React (no hooks, no event handlers)
export default function About() {
  return (
    <div>
      <h1>About Us</h1>
      <p>This page is pre-rendered as static HTML!</p>
      <p>Search engines see everything instantly.</p>
    </div>
  );
}
```

**At build time:**
- ✅ Generates static HTML for instant loading
- ✅ Auto-adds to sitemap.xml
- ✅ Perfect SEO without SSR complexity
- ✅ Still builds in 265ms

**[Complete Server Islands guide →](https://bertui-docswebsite.pages.dev/server-islands)**

---

## 📦 Installation

```bash
# Create new app
bunx create-bertui my-app

# Start development
cd my-app
bun run dev

# Build for production
bun run build
```

**30 seconds from zero to running. No configuration required.**

---

## 📁 Project Structure

```
my-app/
├── src/
│   ├── pages/
│   │   ├── index.jsx          # Route: /
│   │   ├── about.jsx          # Route: /about
│   │   └── blog/
│   │       ├── index.jsx      # Route: /blog
│   │       └── [slug].jsx     # Route: /blog/:slug (dynamic)
│   ├── components/             # Your React components
│   ├── styles/
│   │   └── global.css         # Automatically imported
│   └── images/                 # Served at /images/*
├── public/
│   └── favicon.svg             # Static assets
├── dist/                       # Production build output
│   ├── sitemap.xml            # 🆕 Auto-generated
│   └── robots.txt             # 🆕 Auto-generated
└── package.json
```

---

## 🛣️ File-Based Routing

**Just create files. BertUI handles the rest.**

```
src/pages/index.jsx          →  /
src/pages/about.jsx          →  /about
src/pages/blog/index.jsx     →  /blog
src/pages/blog/[slug].jsx    →  /blog/:slug
src/pages/user/[id].jsx      →  /user/:id
```

### Dynamic Routes

```jsx
// src/pages/blog/[slug].jsx

export default function BlogPost({ params }) {
  return <h1>Post: {params.slug}</h1>;
}

// /blog/hello-world → params.slug = "hello-world"
```

### Navigation

```jsx
import { Link, useRouter } from 'bertui/router';

function Nav() {
  const { navigate, pathname } = useRouter();
  
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <button onClick={() => navigate('/blog')}>Blog</button>
      
      <p>Current: {pathname}</p>
    </nav>
  );
}
```

---

## ⚙️ Configuration (Optional)

**BertUI works with zero config, but you can customize:**

```javascript
// bertui.config.js (optional)

export default {
  siteName: "My Awesome Site",
  baseUrl: "https://example.com",
  
  meta: {
    title: "My Site - Built with BertUI",
    description: "Lightning-fast React app",
    keywords: "react, fast, bertui",
    author: "Your Name"
  },
  
  robots: {
    disallow: ["/admin", "/api"],  // Block from search engines
    crawlDelay: 1                  // Seconds between crawls
  }
};
```

---

## 🎨 Styling

### Global CSS

```css
/* src/styles/global.css */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui;
  line-height: 1.5;
}
```

**Automatically imported and optimized with LightningCSS.**

### CSS Modules (coming soon)

```jsx
import styles from './Button.module.css';

export default function Button() {
  return <button className={styles.primary}>Click</button>;
}
```

---

## 🔌 Official Packages

### bertui-icons (Available Now)

**10x faster icon library powered by Zig.**

```bash
bun add bertui-icons
```

```jsx
import { ArrowRight, Bell, User } from 'bertui-icons';

function App() {
  return (
    <div>
      {/* Basic icon */}
      <ArrowRight size={24} />
      
      {/* Icon with text overlay (exclusive!) */}
      <Bell color="red">{notificationCount}</Bell>
      
      {/* Custom positioning */}
      <User x={20} y={15} fontSize={10}>VIP</User>
    </div>
  );
}
```

**[bertui-icons documentation →](https://github.com/BunElysiaReact/bertui-icons)**

---

## 🚀 Coming Soon

**Future packages (not available yet):**

- 🔄 **bertui-elysia** - Full-stack addon (API routes, auth, database)
- 🎨 **bertui-animation** - GPU-accelerated animations
- 📊 **bertui-charts** - High-performance charts

**Why wait?** We're building these in native code (Zig/C++) for maximum performance.

---

## 🌐 Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
# 2. Import to Vercel
# 3. Deploy

# Done! 🎉
```

### Other Platforms

**All of these work with zero config:**
- ✅ Netlify
- ✅ Cloudflare Pages
- ✅ GitHub Pages
- ✅ Any static host (Nginx, Apache, S3)

**[Deployment guide →](https://bertui-docswebsite.pages.dev/deployment)**

---

## 📊 Comparison

| Feature | BertUI | Next.js | Vite | Remix |
|---------|--------|---------|------|-------|
| Dev Server | 494ms | 2.1s | 713ms | 1.8s |
| Prod Build | 265ms | 8.4s | 4.7s | 6.2s |
| Bundle Size | 100KB | 280KB | 220KB | 250KB |
| Server Islands | ✅ Built-in | ❌ No | ❌ No | ❌ No |
| Auto SEO | ✅ Yes | ⚠️ Manual | ❌ No | ⚠️ Manual |
| Zero Config | ✅ True | ⚠️ Some | ⚠️ Some | ⚠️ Some |
| TypeScript | ✅ No setup | ✅ Config needed | ✅ Config needed | ✅ Config needed |

---

## 🛠️ Commands

```bash
# Development
bun run dev              # Start dev server (494ms)

# Production
bun run build            # Build for production (265ms)
bun run preview          # Preview production build

# Create new app
bunx create-bertui my-app
```

---

## 📚 Documentation

- **Website:** https://bertui-docswebsite.pages.dev/
- **Getting Started:** https://bertui-docswebsite.pages.dev/getstarted
- **Server Islands:** https://bertui-docswebsite.pages.dev/server-islands
- **GitHub:** https://github.com/BunElysiaReact/BERTUI

---

## 💬 Community

- **GitHub Discussions:** https://github.com/BunElysiaReact/BERTUI/discussions
- **Issues:** https://github.com/BunElysiaReact/BERTUI/issues
- **Discord:** https://discord.gg/x8JXvHKd

---

## ⭐ Support the Project

If BertUI makes your React development faster, give us a star! ⭐

**[github.com/BunElysiaReact/BERTUI](https://github.com/BunElysiaReact/BERTUI)**

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🙏 Credits

- **Runtime:** [Bun](https://bun.sh/) - The fastest JavaScript runtime
- **Server:** [Elysia](https://elysiajs.com/) - Fast and elegant web framework
- **CSS:** [LightningCSS](https://lightningcss.dev/) - Lightning-fast CSS processing
- **Icons:** [Lucide](https://lucide.dev/) - Beautiful icon set

---

<div align="center">

**Made with ⚡ by the BertUI team**

*"The fastest React framework. Everything React should have been."*

[Website](https://bertui-docswebsite.pages.dev) • [GitHub](https://github.com/BunElysiaReact/BERTUI) • [npm](https://www.npmjs.com/package/bertui)

</div>