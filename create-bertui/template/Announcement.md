# ⚡ Introducing BertUI v1.2.0

We've been heads down building. Here's what's new.

---

## 🆕 What's New

### 📐 Layout System
Shared UI that wraps your pages automatically. Create `src/layouts/default.tsx` and every page gets your nav, footer, and shell — zero config. Need a blog-specific layout? `src/layouts/blog.tsx` wraps `/blog/*` only.

### ⏳ Per-Route Loading States
Place a `loading.tsx` next to any page and BertUI shows it while React mounts. Loading states inherit from parent routes — `/blog/post` uses `/blog/loading.tsx` if no specific one exists.

### 🛡️ Middleware
Create `src/middleware.ts` and it runs before every single request. Auth checks, redirects, logging, maintenance mode — all in one place.

### 🎨 CSS Modules
Name your file `Button.module.css` and BertUI handles scoping automatically. Class names are hashed at compile time — no collisions, no runtime overhead, zero config.

```jsx
import styles from './Button.module.css';
<button className={styles.btn}>Click</button>
```

### ⚡ Partial Hydration
BertUI now scans every page at build time for hooks and event handlers. Pages with none ship **zero JavaScript**. Pages with interactivity get full hydration. Completely automatic — no config, no annotations.

### 📊 Bundle Analyzer
Every production build now generates `dist/bundle-report.html` — a visual breakdown of your bundle by file, type, and size. Run `bertui analyze --open` to view it anytime.

### 🔧 CLI Scaffolder
Stop writing boilerplate. Generate anything with one command:

```bash
bertui create page about
bertui create page blog/[slug]
bertui create component Button
bertui create layout blog
bertui create loading blog
bertui create middleware
```

### 🏗️ New Starter Template
`bunx create-bertui` now scaffolds a project that demonstrates every framework feature — layouts, loading states, middleware, CSS Modules, Server Islands, and partial hydration — all working out of the box.

---

## 🐛 Bug Fixes

- Fixed `loading.tsx` being registered as a route instead of a loading component
- Fixed `index.jsx` routes (`/` and `/blog`) missing from the router
- Fixed CSS Module `.js` mapping files generating into wrong directory (double `styles/styles/` path)
- Fixed `main.js` not being generated during dev compilation
- Fixed MIME type mismatch blocking JavaScript modules from loading
- Fixed relative import paths for CSS Modules across nested page directories

---

## 📊 Performance

Real numbers on a 9-route project:

| Metric | v1.2.0 |
|--------|--------|
| Production build | ~93ms |
| Dev server start | ~26ms compile |
| CSS optimization | -23.8% |
| JS shipped to static pages | **0 bytes** |

---

## 🚀 Get Started

```bash
bunx create-bertui my-app
cd my-app
bun run dev
```

**Docs:** [bertui-docswebsite.vercel.app](https://bertui-docswebsite.vercel.app)  
**GitHub:** [github.com/BunElysiaReact/BERTUI](https://github.com/BunElysiaReact/BERTUI)  
**Discord:** [discord.gg/kvbXfkJG](https://discord.gg/kvbXfkJG)

---

*Built with ⚡ by Pease Ernest*