# BertUI ⚡

**Zero-config React framework powered by Bun. File-based routing, Server Islands, and a build system that gets out of your way.**

[![Version](https://img.shields.io/badge/version-1.2.9-blue)](https://www.npmjs.com/package/bertui)
[![Bun Powered](https://img.shields.io/badge/runtime-Bun-f472b6)](https://bun.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Quick Start
```bash
bunx create-bertui my-app
cd my-app
bun run dev
```

---

## What's New in v1.2.9

### Server Islands — Rebuilt from the Ground Up

Server Islands are back and fully working. One export, zero config, pure HTML at build time.
```jsx
// src/pages/about.jsx
export const render = "static"

export default function About() {
  return (
    <div>
      <h1>About Us</h1>
      <p>Rendered at build time. Zero JS in the browser.</p>
    </div>
  )
}
```

BertUI runs `renderToString` on your page at build time and writes pure HTML to `dist/`. No React runtime ships to the browser. No hydration. Just HTML.

Three render modes, one export:
```jsx
// Pure HTML — zero JS, zero React in the browser
export const render = "static"

// SSR HTML + JS bundle — pre-rendered for instant load, hydrated for interactivity  
export const render = "server"

// Default — client-only React SPA (no export needed)
export default function Page() {}
```

**Rules for static and server pages:**
- No React hooks (`useState`, `useEffect`, etc.)
- No event handlers (`onClick`, `onChange`, etc.)
- No browser APIs (`window`, `document`, `localStorage`)
- Violations are caught at build time with a clear error

---

## What's New in v1.2.2

### Import Aliases (`importhow`)
No more `../../../` chains. Define aliases in your config and import cleanly from anywhere.
```javascript
// bertui.config.js
export default {
  importhow: {
    amani: '../components',
    ui:    '../components/ui',
  }
}
```
```javascript
// anywhere in your project
import Button from 'amani/button';
import Card from 'ui/card';
```

Aliases are resolved at compile time — zero runtime overhead.

### Node Modules — Just Work
Install a package, import it. That's it.
```javascript
import { format } from 'date-fns';
import confetti from 'canvas-confetti';
```

In dev, packages are served from your local filesystem. In production, only the packages you actually import are bundled and tree-shaken into the output.

### CLI — New Look
The build and dev output is now compact and step-based instead of verbose line-by-line logs.
```
  ██████╗ ███████╗██████╗ ████████╗██╗   ██╗██╗
  ██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██║   ██║██║
  ██████╔╝█████╗  ██████╔╝   ██║   ██║   ██║██║
  ██╔══██╗██╔══╝  ██╔══██╗   ██║   ██║   ██║██║
  ██████╔╝███████╗██║  ██║   ██║   ╚██████╔╝██║
  ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝
  by Pease Ernest  ·  BUILD

  [ 1/10] ✓  Loading env
  [ 2/10] ✓  Compiling           5 routes
  [ 3/10] ⠸  Layouts             ...
  ...
  ✓ Done  0.54s
  JS bundle    32.6 KB
  Output       dist/
```

Debug logs are written silently to `.bertui/dev.log`.

### Dev Server — No More Restarts
Run `bun add some-package` and the dev server picks it up automatically. The import map rebuilds and the browser reloads — no restart needed.

---

## Features

### File-Based Routing
```
src/pages/index.jsx          →  /
src/pages/about.jsx          →  /about
src/pages/blog/index.jsx     →  /blog
src/pages/blog/[slug].jsx    →  /blog/:slug
```

### Server Islands

Three render modes. One export at the top of your page.
```jsx
// render = "static" — pure HTML, zero JS
// Perfect for: marketing pages, blog posts, docs, any page without interactivity
export const render = "static"
export const title = "About Us"

export default function About() {
  return (
    <div>
      <h1>About Us</h1>
      <p>Pre-rendered at build time. Instant load, perfect SEO.</p>
    </div>
  )
}
```
```jsx
// render = "server" — SSR HTML in the body + JS bundle attached
// Perfect for: pages that need fast first paint AND interactivity after load
export const render = "server"

export default function Dashboard() {
  return <div><h1>Dashboard</h1></div>
}
```
```jsx
// default — client-only React (no export needed)
// Perfect for: highly interactive pages, apps, anything with lots of state
export default function Editor() {
  const [value, setValue] = useState('')
  return <textarea onChange={e => setValue(e.target.value)} />
}
```

BertUI automatically detects the render mode and generates the right HTML for each page. Static pages get zero JS. Server pages get pre-rendered HTML with hydration. Default pages get the full SPA treatment.

### TypeScript

`.tsx` and `.ts` files work with no setup. Mix them freely with `.jsx`.
```typescript
// src/pages/blog/[slug].tsx
import { useRouter } from 'bertui/router';

export default function BlogPost() {
  const { params } = useRouter();
  return <h1>Post: {params.slug}</h1>;
}
```

### SEO

`sitemap.xml` and `robots.txt` are generated automatically from your routes. Requires `baseUrl` in config.
```javascript
export default {
  baseUrl: 'https://example.com',
  robots: {
    disallow: ['/admin'],
    crawlDelay: 1,
  }
}
```

### CSS

Put your styles in `src/styles/`. They are combined and minified with LightningCSS into a single `bertui.min.css`.

---

## Project Structure
```
my-app/
├── src/
│   ├── pages/          # File-based routing
│   ├── components/     # Your components
│   └── styles/         # Global CSS
├── public/             # Static assets
├── dist/               # Production output
│   ├── sitemap.xml
│   ├── robots.txt
│   └── assets/
└── bertui.config.js
```

---

## Configuration
```javascript
// bertui.config.js
export default {
  siteName: 'My Site',
  baseUrl:  'https://example.com',

  importhow: {
    ui: '../components/ui',
  },

  robots: {
    disallow:   ['/admin'],
    crawlDelay: 1,
  },

  meta: {
    title:       'My Site',
    description: 'Built with BertUI',
    themeColor:  '#000000',
  },
}
```

---

## Performance

Benchmarks on an Intel i3-2348M, 7.6GB RAM.

| Metric       | BertUI  | Vite    | Next.js |
|--------------|---------|---------|---------|
| Dev start    | 494ms   | 713ms   | 2,100ms |
| Prod build   | 265ms   | 4,700ms | 8,400ms |
| Bundle size  | ~32KB   | 220KB   | 280KB   |
| HMR          | 30ms    | 85ms    | 120ms   |

---

## Coming Soon

- `bertui-elysia` — API routes, auth, database
- `bertui-animate` — GPU-accelerated animations
- Partial hydration — `<Island>` component for mixed static/interactive pages

---

## Credits

- Runtime: [Bun](https://bun.sh)
- CSS: [LightningCSS](https://lightningcss.dev)

---

Made by Pease Ernest