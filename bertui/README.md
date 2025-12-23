# BertUI ⚡🏝️

**The fastest React framework for developers who refuse to wait. Zero configuration, instant feedback, production-ready builds, and now... PERFECT SEO.**

Zero configuration. 494ms dev server. 265ms builds. **Server Islands for instant SEO.**  
Powered by Bun and Elysia.

[![Production Ready](https://img.shields.io/badge/status-production--ready-brightgreen)](https://github.com/BunElysiaReact/BERTUI)
[![Bun Powered](https://img.shields.io/badge/runtime-Bun-f472b6)](https://bun.sh)
[![Zero Config](https://img.shields.io/badge/config-zero-blue)](https://github.com/BunElysiaReact/BERTUI)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🎉 What's New in v1.1.0: Server Islands Era

**The feature that changes everything.** BertUI is no longer just "fast Vite" (though we were never *just* that). With **Server Islands**, you get:

- 🏝️ **Instant SEO** - Add one line, get static HTML at build time
- ⚡ **Still Lightning Fast** - 265ms builds haven't changed
- 🎯 **Per-Page Control** - Choose what gets pre-rendered
- 🚀 **Zero Complexity** - No SSR setup, no server infrastructure
- 💯 **Perfect for Everything** - Marketing pages AND interactive apps

### The Magic Line

```jsx
// Add this to any page
export const render = "server";

// That's it. You now have instant SEO. 🤯
```

**[Read the complete Server Islands guide →](https://bertui-docswebsite.vercel.app/server-islands)**

---

## ⚡ Proven Performance (Not Promises. Facts.)

**BertUI vs Vite** (tested Dec 2025 on Intel i3-2348M, 7.6GB RAM):

| Metric | BertUI | Vite | Winner |
|--------|--------|------|--------|
| Warm Cache Install | **5.0s** | 35.3s | **BertUI (7x faster)** ⚡ |
| Dev Server Startup | **494ms** | 713ms | **BertUI (1.4x faster)** ⚡ |
| Production Build | **265ms** | 4.70s | **BertUI (18x faster)** ⚡ |
| Bundle Size | **100KB** | 220KB | **BertUI (2.2x smaller)** ⚡ |
| **SSG Capability** | **✅ YES** | **❌ NONE** | **BertUI (exclusive)** 🏝️ |

> **"Your speeds are lies!"** — Critics (probably)  
> **Our response:** [Complete reproducible benchmarks](PERFORMANCE.md) with logs, methodology, and test scripts. Run them yourself. We'll wait. ⏱️

**[See full performance report →](PERFORMANCE.md)**

---

## 🏝️ Server Islands: The Revolution

### What Are They?

Server Islands are BertUI's unique feature that gives you **instant SEO and perfect performance** without sacrificing React's developer experience. Think of them as "optional static site generation with one line of code."

### Why They Matter

```diff
<!-- ❌ OTHER FRAMEWORKS: Empty HTML until JS loads -->
<div id="root"></div>
<script src="app.js"></script>

<!-- ✅ BERTUI WITH SERVER ISLANDS: Full content immediately -->
<div id="root">
  <header>
    <h1>My Awesome Site</h1>
    <nav>...</nav>
  </header>
  <main>
    <article>Full content here!</article>
  </main>
</div>
<script src="app.js"></script>
```

**Benefits:**
- 🚀 **Instant First Paint** - Users see content immediately (0ms TTFB)
- 🔍 **Perfect SEO** - Search engines index full content
- ⚡ **Still Interactive** - React hydrates for full app functionality
- 📦 **Zero Config** - Works automatically for all routes
- 🎯 **Mixed Architecture** - Use Server Islands for landing pages, client-only for dashboards

### How to Use

```jsx
// src/pages/about.jsx
export const render = "server"; // 🏝️ That's it!

export const meta = {
  title: "About Us",
  description: "Learn about our company"
};

export default function About() {
  return (
    <div>
      <h1>About Us</h1>
      <p>Pre-rendered as static HTML at build time!</p>
      <a href="/contact">Contact</a>
    </div>
  );
}
```

**Perfect for:**
- Landing pages
- Blog posts
- Documentation
- Marketing pages
- Any content-heavy page that needs SEO

**Not for:**
- Dashboards (need state)
- Forms (need interactivity)
- Apps with user state

**[Complete Server Islands guide →](https://bertui-docswebsite.vercel.app/server-islands)**

---

## 🚀 Quick Start

### Create New App (Recommended)

```bash
bunx create-bertui my-app
cd my-app
bun run dev
```

That's it. No webpack config. No babel setup. No bullshit.

**First install note:** Initial setup downloads Bun platform binaries (~154MB, one-time cost). Subsequent project creation takes ~5 seconds.

---

## 🔄 Migrate Existing Projects

Got a Vite, CRA, or other React project? Migrate to BertUI in seconds with our migration tool:

```bash
cd your-existing-project
bunx migrate-bertui
```

**What it does:**
1. ✅ Backs up all files to `.bertmigrate/`
2. 🧹 Initializes fresh BertUI project
3. 📝 Creates detailed migration guide
4. 🎯 Detects your framework and provides tailored instructions

### Migration Process

```bash
# 1. Navigate to your project
cd my-vite-app

# 2. Run migration (backs up everything automatically)
bunx migrate-bertui

# 3. Follow the generated MIGRATION_GUIDE.md
cat MIGRATION_GUIDE.md

# 4. Copy your components
cp -r .bertmigrate/src/components src/
cp -r .bertmigrate/src/styles src/

# 5. Convert routes to file-based structure
# Instead of: <Route path="/about" element={<About />} />
# Just create: src/pages/about.jsx

# 6. Update imports
# From: import { Link } from 'react-router-dom'
# To:   import { Link } from 'bertui/router'

# 7. Test it
bun run dev
```

### Before Migration (Vite)
```
your-vite-app/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── components/
├── vite.config.js
└── package.json
```

### After Migration (BertUI)
```
your-vite-app/
├── .bertmigrate/          # 📦 Your backup (safe!)
├── src/
│   ├── pages/             # ⚡ File-based routing!
│   │   ├── index.jsx      # / route
│   │   └── about.jsx      # /about route
│   ├── components/        # Your components
│   └── images/            # Images (auto-served)
├── MIGRATION_GUIDE.md     # Your guide
└── package.json
```

### Rollback If Needed

```bash
# Something wrong? Just restore from backup
rm -rf src/ public/ package.json
cp -r .bertmigrate/* .
```

**[Migration tool documentation →](https://github.com/yourusername/migrate-bertui)**

---

## 🎯 Why BertUI?

### The Problems We Solve

**1. "Cool Vite" Problem (SOLVED ✅)**
- **Before v1.1:** Critics said we were just "fast Vite" with poor SEO
- **After v1.1:** Server Islands give us perfect SEO + unmatched speed
- **Vite can't do this:** Vite has NO SSG capability at all

**2. Speed Without Compromise**
- **Next.js:** Great SSR, but complex setup and slow builds
- **Vite:** Fast dev, but client-only (poor SEO)
- **BertUI:** Fast dev + fast builds + perfect SEO + zero config

**3. The Configuration Hell**
- **Other frameworks:** webpack.config.js, vite.config.js, tsconfig.json, babel.config.js...
- **BertUI:** Zero config files. Just code.

### What Makes Us Unique

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Vite         Fast Dev ✅  Poor SEO ❌  No SSG ❌      │
│  Next.js      Good SEO ✅  Slow Build ❌  Complex ❌   │
│  BertUI       Fast Dev ✅  Good SEO ✅  Fast Build ✅  │
│               Zero Config ✅  Server Islands ✅         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**BertUI is the only framework with:**
- Sub-300ms production builds
- Optional per-page SSG (Server Islands)
- Zero configuration required
- File-based routing out of the box
- Bun-native speed

---

## 📁 File-Based Routing

BertUI has **complete file-based routing** with zero configuration:

```
src/pages/index.jsx                 → /
src/pages/about.jsx                 → /about
src/pages/blog/index.jsx            → /blog
src/pages/user/[id].jsx             → /user/:id
src/pages/shop/[cat]/[prod].jsx     → /shop/:cat/:prod
```

### Dynamic Routes Example

```jsx
// src/pages/user/[id].jsx
export default function UserProfile({ params }) {
  return <div>User ID: {params.id}</div>;
}
```

### Navigation

```jsx
import { Link, useRouter } from 'bertui/router';

// Link component
<Link to="/about">About</Link>

// Programmatic navigation
const { navigate } = useRouter();
navigate('/dashboard');
```

---

## 🖼️ Image Handling

**CRITICAL:** BertUI only processes images from two directories:

```
✅ src/images/  → Served at /images/* (component images)
✅ public/      → Served at /* (global assets like favicon)

❌ Anywhere else → Will cause compilation errors!
```

**Example:**
```jsx
// ✅ CORRECT
import Logo from '../images/logo.png';  // From src/images/
import Favicon from '/favicon.svg';     // From public/

// ❌ WRONG (will break)
import Banner from '../../assets/banner.png';  // Outside allowed dirs
```

---

## 📊 Real-World Performance

Tested on Intel i3-2348M (your results will be better on modern hardware):

| Metric | BertUI | Next.js | Vite |
|--------|--------|---------|------|
| Dev Server Start | **494ms** | 2.1s | 713ms |
| Production Build | **265ms** | 8.4s | 4.7s |
| SSG Per Route | **~80ms** | ~200ms | N/A |
| Bundle Size | **100KB** | 280KB | 220KB |
| **SSG Support** | **✅ YES** | ✅ YES | **❌ NO** |

**Time saved per year:**
- 5 projects/week: ~2.5 hours/year on project creation
- 10 dev server restarts/day: ~9 minutes/year
- 3 builds/day: ~32 minutes/year

**Total: ~2.7 hours of pure waiting time eliminated.**  
But the real win? **Flow state.** When tools respond instantly, you stay focused and ship faster.

---

## 🎨 Features

### Core Features
- ⚡ **38ms Compilation** - Compiles 20 React files in 38ms
- 📁 **Zero Config Routing** - File-based routing with dynamic routes
- 🏝️ **Server Islands** - Optional SSG with one line
- 🔥 **Hot Module Replacement** - Instant updates (30ms HMR)
- 📦 **Zero Config** - Works out of the box
- 🚀 **Production Ready** - Optimized builds, semantic versioning
- 🎯 **React-Focused** - Optimized for React ecosystem

### Developer Experience
- 🔍 **Perfect SEO** - Server Islands generate static HTML
- 💅 **CSS Optimization** - Single minified CSS file with LightningCSS
- 🐛 **Error Overlay** - Full-screen error messages with stack traces
- 📊 **Build Analytics** - Detailed build reports
- 🎨 **Modern CSS** - Support for nesting, variables, and modern features

### Dependency Count

| Framework | Dependencies | Install Size |
|-----------|-------------|--------------|
| **BertUI** | **4** | **~14MB** |
| Vite + React | 15+ | ~50MB |
| Next.js | 50+ | ~200MB |
| Gatsby | 100+ | ~500MB |

**Still the fastest, still the lightest.** 🔥

---

## 🛠️ Commands

```bash
bertui dev         # Start dev server (494ms startup)
bertui build       # Build for production (265ms builds)
```

Or via package.json:
```bash
bun run dev        # Development
bun run build      # Production build
bun run preview    # Preview production build
```

---

## 🏆 When to Use BertUI

### ✅ Perfect For:

- **Speed-First Projects** - You want the fastest possible dev experience
- **Content Sites** - Landing pages, blogs, docs (with Server Islands)
- **Hybrid Apps** - Mix static pages (Server Islands) with interactive apps
- **Multiple Projects** - Create new projects frequently (7x faster scaffolding)
- **Fast CI/CD** - Need quick builds in pipelines (18x faster than Vite)
- **Bun Users** - Already using or willing to try Bun

### ❌ Not For You If:

- **Need Full SSR** - Real-time server rendering (use Next.js or Remix)
- **Content-Heavy Blog** - Needs MDX and advanced content features (use Astro)
- **Multi-Framework** - Want Vue, Svelte support (use Astro or Vite)
- **Can't Use Bun** - Company policy or legacy systems prevent Bun usage
- **Need TypeScript** - We're JavaScript-first by design (see Philosophy below)

**BertUI is laser-focused on: Fast React development with optional perfect SEO.**  
If that's what you need, you'll love it. If not, use the right tool.

---

## 💭 JavaScript-First Philosophy

**BertUI is JavaScript-first and will remain that way.**

We fully support `.jsx` files with complete JSX syntax, but we **do not plan to add TypeScript (`.tsx`) support.**

**Why?**
- We believe in keeping tools simple and focused
- TypeScript adds complexity that goes against "zero config, just code"
- JavaScript is powerful, universal, and requires no compilation step
- We want to eliminate barriers, not add them

If you need TypeScript, we recommend Next.js or Remix - they're excellent frameworks with first-class TypeScript support.

**BertUI's mission:** The fastest React development with zero complexity.  
TypeScript would compromise that mission.

---

## 🌐 Production Deployment

### Supported Platforms
- ✅ Vercel (zero config with included `vercel.json`)
- ✅ Netlify (works out of the box)
- ✅ Cloudflare Pages (instant deploys)
- ✅ Any static host (Nginx, Apache, S3, etc.)

### Vercel Deployment (Recommended)

Your project includes a pre-configured `vercel.json`:

```json
{
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Deployment steps:**
1. Push to GitHub
2. Import to Vercel
3. Deploy (auto-detects config)
4. Done! 🎉

**[Complete deployment guide →](https://bertui-docswebsite.vercel.app/deployment)**

### Live Sites Using BertUI
- [BertUI Docs](https://bertui-docswebsite.vercel.app/) - The site you're reading

---

## 📚 Documentation & Resources

- **Documentation:** https://bertui-docswebsite.vercel.app/
- **Getting Started:** https://bertui-docswebsite.vercel.app/getstarted
- **Server Islands Guide:** https://bertui-docswebsite.vercel.app/server-islands
- **Performance Benchmarks:** [PERFORMANCE.md](PERFORMANCE.md)
- **GitHub:** https://github.com/BunElysiaReact/BERTUI
- **NPM:** https://www.npmjs.com/package/bertui
- **Discord:** https://discord.gg/kvbXfkJG
- **Issues:** https://github.com/BunElysiaReact/BERTUI/issues

---

## 🎓 Learning Path

1. **Quick Start** (5 min)
   - Run `bunx create-bertui my-app`
   - Explore the generated files
   - Start dev server with `bun run dev`

2. **File-Based Routing** (10 min)
   - Create `src/pages/about.jsx`
   - Add dynamic route `src/pages/blog/[slug].jsx`
   - Test navigation with `Link` component

3. **Server Islands** (15 min)
   - Add `export const render = "server";` to a page
   - Build and check the generated HTML
   - View page source to see pre-rendered content

4. **Production Build** (5 min)
   - Run `bun run build`
   - Deploy to Vercel or Netlify
   - Celebrate your blazing-fast site! 🎉

**Total time to mastery: ~35 minutes**

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

```bash
# Clone the repo
git clone https://github.com/BunElysiaReact/BERTUI
cd BERTUI

# Install dependencies
bun install

# Start development
bun run dev

# Make your changes
# Run tests
bun test

# Submit PR
```

**Areas we need help:**
- Documentation improvements
- Bug fixes
- Performance optimizations
- Example projects
- Migration tools

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🙏 Credits & Thanks

**Built with 🔥 by [Pease Ernest](https://github.com/Ernest12287)**  
*Because developers deserve faster tooling and better SEO.*

**Special Thanks:**
- The Bun team for creating an incredible runtime
- The Elysia team for the fastest web framework
- Our early adopters who gave critical feedback
- Everyone who believed in BertUI when it was "just Cool Vite"

**v1.1.0 is dedicated to everyone who said we needed better SEO.**  
You were right. Server Islands is for you. 🏝️

---

## 🎯 The Journey: From "Cool Vite" to Revolution

**v0.1.0 (Nov 26, 2025)** - First release. Fast, but client-only.  
**v1.0.0 (Dec 17, 2025)** - Stable foundation after 35 beta versions.  
**v1.1.0 (Dec 23, 2025)** - Server Islands. Everything changed.

We were called "Cool Vite" and it hurt. We were fast, but missing something crucial: **perfect SEO without complexity.**

Server Islands solved it. Now we're not "Cool Vite." Vite can't do this at all.

**We're BertUI - the framework with Bun speed AND perfect SEO.**

---

## ❓ FAQ

**Q: Is BertUI production-ready?**  
A: Yes! v1.0.0+ is stable and production-ready. Live sites are using it.

**Q: Do I need to use Server Islands?**  
A: No! They're optional. Use them for SEO-critical pages, skip them for interactive apps.

**Q: Can I migrate from Vite/CRA/Next.js?**  
A: Yes! Use `bunx migrate-bertui` for automated migration with backups.

**Q: Does BertUI require a server?**  
A: No! Server Islands generate static HTML at build time. Deploy anywhere.

**Q: What about TypeScript?**  
A: BertUI is JavaScript-first. We don't plan `.tsx` support. Use Next.js if you need TS.

**Q: How do Server Islands compare to Next.js SSG?**  
A: Server Islands are simpler (one line vs complex config) and faster (265ms vs 8s builds).

**Q: Can I use Server Islands with dynamic routes?**  
A: Not yet. Coming in a future release.

**Q: What if I need full SSR?**  
A: Use Next.js or Remix. BertUI focuses on static-first with optional SSG.

---

## 🚀 Ready to Build?

```bash
bunx create-bertui my-app
cd my-app
bun run dev
```

**Join developers building the fastest React apps with perfect SEO.**

---

**Performance claims questioned?** [Read the receipts.](PERFORMANCE.md)  
**Want to understand Server Islands?** [Read the guide.](https://bertui-docswebsite.vercel.app/server-islands)  
**Need help?** [Join our Discord.](https://discord.gg/kvbXfkJG)

**Made with ⚡ and 🏝️ by the BertUI team**