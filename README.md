# BertUI ⚡

**Lightning-fast React development powered by Bun.**

> **Our Philosophy:** We're not trying to outshine Vite or be the next Next.js. BertUI is a **fast, simple, joy-to-use** framework built for **speed and ease**. Write regular React code you already know - the only new thing to learn is our `Link` component. That's it!

## ⚡ Speed Stats

```
✨ Production Build:  35ms (50ms first time)
🚀 Dev Server Start:  16ms  
🔥 Hot Module Reload: <50ms
```

[📊 See Full Performance Breakdown](#-performance-we-can-brag-about-this)

---

## 🙏 Our Sincere Apologies

> We must apologize profusely for the **2-3 seconds** it takes to install BertUI for the first time. 😔
>
> This is Bun's caching system (not our fault!), but we'll take the blame. After that first install, everything is **instant**. ⚡

---

## Features

- ⚡ **Blazing Fast** - 35ms builds, 16ms dev server startup
- 📁 **File-Based Routing** - Zero config, just create files
- 🔥 **Hot Module Replacement** - Instant updates via WebSocket
- 📦 **Zero Config** - Works out of the box
- 🎨 **CSS Import Support** - Import styles directly in components
- 🔐 **Environment Variables** - `BERTUI_` and `PUBLIC_` prefix support
- 🚀 **Production Ready** - SEO-optimized HTML, tree-shaking, minification
- 📚 **External Libraries** - Full npm ecosystem support

---

## Quick Start

### Create New App (Recommended)
```bash
bunx create-bertui my-app
cd my-app
bun run dev
```

This creates a complete BertUI project with:
- ✅ Pre-configured file structure
- ✅ Sample pages with routing
- ✅ Beautiful example components
- ✅ CSS styling examples
- ✅ All dependencies installed

### Manual Installation (Advanced)
```bash
bun add bertui react react-dom
```

Then manually set up:
- Project structure (`src/pages/`, `src/main.jsx`)
- Router configuration
- Build configuration

**💡 Tip:** Use `bunx create-bertui` for the best experience!

---

## Commands

```bash
bertui dev         # Start dev server
bertui build       # Build for production
```

---

## 📁 File-Based Routing

BertUI has **complete file-based routing** with zero configuration!

### Basic Routes
```
src/pages/index.jsx       → /
src/pages/about.jsx       → /about
src/pages/blog/index.jsx  → /blog
```

### Dynamic Routes
```
src/pages/user/[id].jsx           → /user/:id
src/pages/blog/[slug].jsx         → /blog/:slug
src/pages/shop/[cat]/[prod].jsx   → /shop/:cat/:prod
```

### Navigation
```jsx
import { Link, useRouter } from 'bertui/router';

// Link component (the only new thing to learn!)
<Link to="/about">About</Link>

// Programmatic navigation
function MyComponent() {
  const { navigate } = useRouter();
  
  return (
    <button onClick={() => navigate('/dashboard')}>
      Go to Dashboard
    </button>
  );
}
```

### Route Parameters
```jsx
// src/pages/user/[id].jsx
export default function UserProfile({ params }) {
  return <div>User ID: {params.id}</div>;
}
```

---

## 🎨 Styling

### CSS Imports (v0.3.7+)
```jsx
import '../styles/home.css';

export default function Home() {
  return <div className="home-container">Content</div>;
}
```

### Global Styles
Add global styles in `src/styles/global.css` - automatically included.

---

## 🔐 Environment Variables

Create a `.env` file:

```env
# Exposed to browser (safe for client-side)
PUBLIC_APP_NAME=My Awesome App
BERTUI_API_URL=https://api.example.com

# Server-side only (NOT exposed to browser)
SECRET_API_KEY=super_secret_key
```

Access in your code:
```jsx
const appName = process.env.PUBLIC_APP_NAME;
const apiUrl = process.env.BERTUI_API_URL;
```

> **Important:** Only `PUBLIC_` and `BERTUI_` prefixed variables are exposed to the browser!

---

## 🏷️ SEO & Meta Tags

> **⚠️ Note:** Meta tag functionality exists but is **NOT YET PUSHED TO NPM**. Coming in the next release!

Add per-page metadata:

```jsx
// src/pages/about.jsx
export const meta = {
  title: "About Us - My App",
  description: "Learn about our amazing team",
  keywords: "about, team, company",
  ogImage: "/about-og.png",
  ogTitle: "About Us",
  ogDescription: "Our story"
};

export default function About() {
  return <div>About content...</div>;
}
```

### How Meta Tags Work

| Environment | Status | Why |
|-------------|--------|-----|
| **Dev Server** (`bertui dev`) | ❌ Not functional | Dev server only compiles `.js` files for maximum speed |
| **Production Build** (`bertui build`) | ✅ Fully functional | Generates separate HTML per route with meta tags for SEO |

**Design Philosophy:** Dev speed is priority #1. SEO matters in production, not development.

> Always test meta tags with: `bun run build` → `bun run preview`

---

## ⚡ Performance (We Can Brag About This!)

### Real Build Times
```bash
$ bun run build
✨ Build complete in 35ms
```

> **Note:** First build takes ~50ms (Bun caches modules). Second build onwards: blazing 35ms!

### Real Dev Server
```bash
$ bun run dev
✅ Compiled 6 files in 16ms
🚀 Server running at http://localhost:3000
```

### Comparison

| Framework | Build Time | Dev Startup | Notes |
|-----------|------------|-------------|-------|
| **BertUI** | **35ms** | **16ms** | Subsequent builds |
| **BertUI (first)** | **50ms** | **16ms** | First build only |
| Vite | 2-5s | 300-800ms | With plugins |
| Create React App | 15-30s | 5-15s | Very slow |
| Next.js | 3-8s | 1-3s | Full-featured |

### Why So Fast?

**Our Philosophy: Use Bun's Native Tools**
- ✅ **Bun** runtime (3x faster than Node.js)
- ✅ **Bun.build** for bundling (10x faster than Webpack)
- ✅ **Bun.Transpiler** for JSX (native, instant)
- ✅ **Lightning CSS** for styles (100x faster, written in Rust!)
- ✅ **Elysia** for dev server (Bun-native HTTP)
- ✅ **File-based routing** (no parsing overhead)

**Result:** No plugins, no complexity, just pure speed.

---

## 📦 External Libraries

BertUI supports the full npm ecosystem:

```bash
bun add axios @tanstack/react-query
```

Then import normally:
```jsx
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
```

---

## 📊 How It Works

1. **Developer creates pages:**
   ```bash
   src/pages/
   ├── index.jsx
   ├── about.jsx
   └── user/[id].jsx
   ```

2. **BertUI discovers routes automatically**

3. **Router code is auto-generated:**
   - Creates `.bertui/router.js`
   - Imports all page components
   - Provides routing logic

4. **Dev server serves SPA:**
   - All routes serve the same HTML shell
   - Client-side routing handles navigation
   - HMR updates routes on file changes

5. **Production build generates:**
   - Separate optimized HTML per route
   - Minified CSS with Lightning CSS
   - Tree-shaken JavaScript bundles
   - SEO-optimized meta tags

---

## 🎯 What Makes BertUI Different?

### What We're NOT
- ❌ A Vite replacement (though we're faster 😏)
- ❌ The next Next.js
- ❌ A full-stack framework
- ❌ Complicated

### What We ARE
- ✅ The **fastest** React dev experience
- ✅ Perfect for SPAs and static sites
- ✅ Built for developers who value speed and simplicity
- ✅ **Speed first, joy second, everything else third**

### Key Principles
1. 🚀 **Use the fastest tool for every job**
2. 🎓 **Zero learning curve** - just React
3. 📦 **No magic** - transparent and simple
4. ⚡ **Eliminate all unnecessary abstraction**

---

## 🎓 Usage Example

```jsx
// src/pages/index.jsx
import { Link } from 'bertui/router';
import '../styles/home.css';

export const meta = {
  title: "Home - My App",
  description: "Welcome to my awesome app"
};

export default function Home() {
  const apiUrl = process.env.BERTUI_API_URL;
  
  return (
    <div className="home-container">
      <h1>Welcome to My App!</h1>
      <nav>
        <Link to="/about">About</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/user/123">My Profile</Link>
      </nav>
    </div>
  );
}

// src/pages/user/[id].jsx
export default function UserProfile({ params }) {
  return (
    <div>
      <h1>User {params.id}</h1>
      <p>Profile page for user {params.id}</p>
    </div>
  );
}
```

---

## 🚀 Deployment

BertUI outputs a standard static `dist/` folder:

### Vercel
```bash
bunx vercel
```

### Netlify
```bash
bunx netlify deploy
```

### Static Hosting
Upload `dist/` to any static host (GitHub Pages, Cloudflare Pages, AWS S3, etc.)

---

## 🐛 Troubleshooting

### First Build Seems Slow?
First build takes ~50ms (Bun caches modules). Every build after: blazing 35ms. Run it twice! 😉

### First Install Taking 2-3 Seconds?
That's Bun caching packages. We know... those precious 2 seconds. We're deeply sorry! 😅 (It's Bun's fault, not ours!)

### Environment Variables Not Working
1. Ensure variables are prefixed with **`PUBLIC_`** or **`BERTUI_`**
2. **Restart dev server** after `.env` changes
3. Test with production build: `bun run build`

### Meta Tags Not Showing
Remember: Meta tags only work in **production builds**, not dev server. This is by design for maximum dev speed.

### CSS Not Loading
Make sure you're importing CSS in your components:
```jsx
import '../styles/your-style.css';
```

---

## 🎯 Roadmap

- [x] File-based routing
- [x] Dynamic routes
- [x] CSS import support
- [x] Environment variables
- [x] SEO meta tags
- [x] Meta tags pushed to npm 
- [ ] Layouts and nested routing
- [ ] API routes
- [ ] MDX support
- [ ] Static generation improvements

---

## 📖 Learn More

- [GitHub Repository](https://github.com/BunElysiaReact/BERTUI)
- [Bun Documentation](https://bun.sh/docs)
- [React Documentation](https://react.dev)

---

## 📄 License

MIT

---

## 🙌 Contributing

Contributions are welcome! Please open an issue or PR on GitHub.

---

**Made with ⚡ speed and ❤️ by developers who hate waiting**

*BertUI - Fast, Simple, Joyful React Development*