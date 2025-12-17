# BertUI App

A **lightning-fast React application** built with [BertUI](https://github.com/BunElysiaReact/BERTUI). 

## ⚡ Speed Stats

```
✨ Production Build:  35ms
🚀 Dev Server Start:  16ms  
🔥 Hot Module Reload: <50ms
```

> **BertUI's Philosophy:** We're not trying to outshine Vite or be the next Next.js. We're a **fast, simple, joy-to-use** UI library built for **speed and ease**. Write regular React code you already know - the only new thing to learn is our `Link` component. That's it!

📊 **[See Full Performance Breakdown](PERFORMANCE.md)** - We have bragging rights!

## 🚀 Getting Started

### Prerequisites
You need **Bun** installed on your system.

### Development
Start the local development server:
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view your app with **blazing fast HMR**.

### Build for Production
Generate optimized static assets with pre-rendered HTML:
```bash
bun run build
```

### Preview Production Build
Serve the optimized `dist/` folder locally:
```bash
bun run preview
```

## 📁 Project Structure

```
src/
├── pages/          # 📄 File-based routes
│   ├── index.jsx   # Home page (/)
│   ├── about.jsx   # About page (/about)
│   └── blog/       # Blog section
├── components/     # 🧩 Reusable components
└── styles/         # 🎨 CSS files (imported in components)
    ├── global.css
    ├── home.css
    ├── about.css
    ├── blog.css
    └── blog-post.css
```

## 🎨 Styling

BertUI v0.3.7+ supports CSS imports! Import your styles directly in components:

```jsx
import '../styles/home.css';

export default function Home() {
  return <div className="home-container">...</div>;
}
```

### Global Styles
Add global styles in `src/styles/global.css` - it's automatically included.

## 🌍 Environment Variables

Create a `.env` file in your project root:

```bash
# Copy the example
cp .env.example .env
```

Then edit with your values:

```env
# Exposed to browser (safe for client-side)
PUBLIC_APP_NAME=My Awesome App
PUBLIC_API_URL=https://api.myapp.com
BERTUI_USERNAME=John Doe

# Only available during build (NOT exposed to browser)
SECRET_API_KEY=shh_this_is_a_secret
```

> **Important:** Only variables prefixed with `PUBLIC_` or `BERTUI_` are exposed to the browser. Never put sensitive secrets in public variables!

### Using in Components
```jsx
// src/pages/index.jsx
const appName = process.env.PUBLIC_APP_NAME || "BertUI App";
const apiUrl = process.env.BERTUI_API_URL;
```

## 📚 File-Based Routing

Routing is based entirely on file paths within `src/pages/`.

| File Path | Route | Description |
|-----------|-------|-------------|
| `src/pages/index.jsx` | `/` | Home Page |
| `src/pages/about.jsx` | `/about` | Static Route |
| `src/pages/blog/index.jsx` | `/blog` | Blog Index |
| `src/pages/blog/[slug].jsx` | `/blog/:slug` | Dynamic Route |

### Navigation
Use BertUI's `Link` component (the only new thing to learn!):

```jsx
import { Link } from 'bertui/router';

<Link to="/about">Go to About</Link>
```

### Dynamic Routes Example
```jsx
// src/pages/user/[id].jsx
export default function User({ params }) {
  return <div>User ID: {params.id}</div>;
}
```

## 🏷️ SEO & Meta Tags

> **⚠️ IMPORTANT NOTE:** Meta tag functionality is available but **NOT YET PUSHED TO NPM**. This feature is coming in the next release!

Add per-page metadata using `export const meta`:

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

### How Meta Tags Work 💡

| Environment | How It Works | Meta Tags Status |
|-------------|--------------|------------------|
| **Dev Server** (`bun run dev`) | Only compiles and serves `.js` files. The dev server uses a single HTML shell for all routes. | ❌ **Not functional** - Meta tags won't appear in page source |
| **Production Build** (`bun run build`) | Generates a separate HTML file for each route with the meta tags injected into the `<head>`. | ✅ **Fully functional** - Perfect for SEO and social sharing |

**Why this design?**
- **Dev speed is priority #1**: The dev server focuses on lightning-fast compilation and HMR
- **Production is where SEO matters**: Build time is when we generate proper HTML with meta tags for search engines

> **Always test your meta tags with:** `bun run build` → `bun run preview` before deploying!

## 📦 Adding Dependencies

BertUI supports the full npm ecosystem:

```bash
bun add <package-name>
```

Example:
```bash
bun add axios @tanstack/react-query ernest-logger
```

Then import normally:
```jsx
import axios from 'axios';
import { createLogger } from 'ernest-logger';
```

## 🚀 Deployment

BertUI outputs a standard static `dist/` folder.

### Vercel
```bash
bunx vercel
```
The included `vercel.json` handles SPA routing automatically.

### Netlify
```bash
bunx netlify deploy
```

### Static Hosting
Upload the `dist/` folder to any static host (GitHub Pages, Cloudflare Pages, AWS S3, etc.).

## ⚡ Performance (We Can Brag About This!)

BertUI is **INSANELY FAST** thanks to leveraging Bun's native tools:

### Real Build Times:
```bash
$ bun run build
✨ Build complete in 35ms  # YES, THIRTY-FIVE MILLISECONDS!
```

> **⚠️ First Build Note:** Your first build might take ~50ms as Bun caches modules. Second build onwards? Back to blazing 35ms. We can't apologize enough for that extra 15ms. 😅

### Real Dev Server Startup:
```bash
$ bun run dev
✅ Compiled 6 files in 16ms
🚀 Server running at http://localhost:3000
```

**Compare that to Vite:**
- ⚡ BertUI: **35ms builds** | **16ms compilation**
- 🐌 Vite: Several seconds (especially with plugins)

### 🙏 Our Sincere Apologies

> **Dear Developer,**
>
> We must apologize profusely for the **2-3 seconds** it takes to install BertUI for the first time. 😔
>
> ```bash
> bun add bertui
> # *gasp* takes 2-3 whole seconds as Bun caches files! 😱
> ```
>
> We know, we know... those precious 2 seconds could have been spent... well, we're not sure what you do in 2 seconds, but we're deeply sorry anyway!
>
> **Important:** This is Bun's caching system (not us!), but we'll take the blame. It's the least we can do for making you wait an eternity (okay, 2 seconds).
>
> After that first install? Everything is **instant**. We promise! ⚡
>
> **Sincerely,**  
> *The BertUI Team (masters of the non-apology apology)*

### Why So Fast?

**Our Philosophy: Use Bun's Native Tools**
- No webpack, no rollup, no complex plugin systems
- **Bun.build** for bundling (native speed)
- **Bun.Transpiler** for JSX/TSX (native speed)
- **Lightning CSS** for CSS processing (written in Rust!)
- **Elysia** for dev server (Bun-native HTTP server)

**Result:** Sub-second builds, instant dev server, blazing HMR 🔥

### What You Get:
```
✅ 6 files compiled in 16ms
✅ CSS minified: 2.43KB → 1.84KB (-24.1%)
✅ SEO-optimized HTML per route
✅ Tree-shaking and code splitting
✅ All in 35ms total build time
```

## 🎯 What Makes BertUI Different?

- ⚡ **Stupid Fast**: 35ms builds, 16ms compilation - faster than you can blink
- 🎓 **Zero Learning Curve**: Write React exactly how you already know it
- 📁 **File-Based Routing**: No route config needed
- 🎨 **CSS Import Support**: Import styles directly in components
- 🔐 **Environment Variables**: Simple, secure config management
- 📦 **Full npm Ecosystem**: Use any library you want
- 🚫 **No Magic**: We don't try to be everything - just fast and simple
- 🛠️ **Bun-Native**: Every tool is Bun-native for maximum speed

### What We're NOT Trying To Be
- ❌ A Vite replacement (though we're faster 😏)
- ❌ The next Next.js
- ❌ A full-stack framework
- ❌ Complicated

### What We ARE
- ✅ The **fastest** React dev experience you'll ever use
- ✅ Perfect for SPAs and static sites
- ✅ Built for developers who value speed and simplicity
- ✅ **Speed first, joy second, everything else third**

## 📖 Learn More

- [BertUI Documentation](https://github.com/BunElysiaReact/BERTUI)
- [Bun Documentation](https://bun.sh/docs)
- [React Documentation](https://react.dev)

## 🐛 Troubleshooting

### First Build Seems Slow?
Don't worry! First build takes ~50ms (Bun caches modules). Every build after that is blazing fast at ~35ms. Run it twice, you'll see! 😉

### First Install Taking 2-3 Seconds?
That's Bun caching packages for future installs. We know, we know... those precious 2 seconds. We're deeply sorry for the inconvenience. 😅 (It's Bun's fault, not ours, but we'll take the blame!)

### Environment Variables Not Working
1. Ensure variables are prefixed with **`PUBLIC_`** or **`BERTUI_`**
2. **Restart dev server** after `.env` changes
3. Test with production build: `bun run build`

### Meta Tags Not Showing
Remember: Meta tags only work in **production builds** (`bun run build`), not in dev server HTML source. This is by design for maximum dev speed.

### CSS Not Loading
Make sure you're importing CSS in your components:
```jsx
import '../styles/your-style.css';
```

## 📄 License

MIT

---

**Made with ⚡ and joy**