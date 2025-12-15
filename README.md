# ⚡ BertUI

**Lightning-Fast React Development Powered by Bun**

[![npm version](https://img.shields.io/npm/v/bertui.svg)](https://www.npmjs.com/package/bertui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black)](https://bun.sh)

[Quick Start](#-quick-start) • [Features](#-features) • [Documentation](#-documentation) • [Examples](#-examples)

</div>

---

## 🤔 What is BertUI?

BertUI is a **zero-config React framework** that combines:
- 🚀 **Bun's native speed** for instant dev server startup
- 📁 **File-based routing** inspired by Next.js
- 🔥 **Lightning-fast HMR** via WebSockets
- 🎨 **Built-in CSS animations** (15+ utility classes)
- 📦 **Production-ready builds** with automatic optimization

**Think**: Next.js simplicity + Vite speed + Bun performance = BertUI ⚡

---

## 🚀 Quick Start

### Create Your First App

```bash
# Create a new BertUI app (takes 5 seconds!)
bunx create-bertui my-app

# Navigate to your app
cd my-app

# Start development server
bun run dev
```

**That's it!** Open [http://localhost:3000](http://localhost:3000) and start building! 🎉

---

## ✨ Features

### 🏎️ Blazing Fast Performance
- **<100ms** dev server startup
- **<50ms** hot module reload
- **Sub-second** production builds
- Powered by Bun's native speed

### 📁 File-Based Routing (Zero Config!)
```
src/pages/
├── index.jsx       → /
├── about.jsx       → /about
└── blog/
    ├── index.jsx   → /blog
    └── [slug].jsx  → /blog/:slug (dynamic!)
```

Just create files. **Routes happen automatically.** Magic! ✨

### 🎨 Built-in CSS Animations
15+ ready-to-use animation classes:
```jsx
<h1 className="fadein">Smooth fade in!</h1>
<p className="slideup">Slide from bottom!</p>
<div className="bouncein">Bouncy entrance!</div>
```

No dependencies, no config, just add `className`. Done! 🎭

### 🔥 Hot Module Replacement
Edit your files and see changes **instantly** without losing component state. No refresh needed!

### 📦 Production Ready
```bash
bun run build
```
Creates optimized bundles with:
- ✅ Automatic code splitting
- ✅ CSS minification
- ✅ Tree shaking
- ✅ Source maps

---

## 📖 Documentation

### Table of Contents
1. [Installation](#installation)
2. [Project Structure](#project-structure)
3. [Routing](#routing)
4. [Navigation](#navigation)
5. [CSS Animations](#css-animations)
6. [Configuration](#configuration)
7. [Deployment](#deployment)

---

## 📦 Installation

### Requirements
- [Bun](https://bun.sh) v1.0 or higher
- Node.js knowledge (we're just faster!)

### Method 1: Create New App (Recommended)
```bash
bunx create-bertui my-awesome-app
cd my-awesome-app
bun run dev
```

### Method 2: Add to Existing Project
```bash
bun add bertui react react-dom
```

Create your project structure:
```bash
mkdir -p src/pages
touch src/pages/index.jsx
touch src/main.jsx
```

**`src/main.jsx`:**
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Router, routes } from './router.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router routes={routes} />
  </React.StrictMode>
);
```

**`src/pages/index.jsx`:**
```jsx
export default function Home() {
  return <h1>Hello BertUI! ⚡</h1>;
}
```

---

## 🗂️ Project Structure

```
my-app/
├── public/              # Static assets (images, fonts, etc.)
│   └── favicon.svg
├── src/
│   ├── pages/          # Your routes (file-based routing!)
│   │   ├── index.jsx   # Home page (/)
│   │   ├── about.jsx   # About page (/about)
│   │   └── blog/
│   │       ├── index.jsx      # Blog listing (/blog)
│   │       └── [slug].jsx     # Individual post (/blog/:slug)
│   ├── components/     # Reusable components
│   ├── styles/         # Global styles
│   └── main.jsx        # App entry point
├── bertui.config.js    # Optional configuration
└── package.json
```

---

## 🧭 Routing

### Static Routes

Create a file → Get a route! It's that simple.

**File**: `src/pages/about.jsx`  
**Route**: `/about`

```jsx
// src/pages/about.jsx
export default function About() {
  return (
    <div>
      <h1>About Us</h1>
      <p>We build lightning-fast apps! ⚡</p>
    </div>
  );
}
```

### Index Routes

Files named `index.jsx` become the root of that directory:

| File | Route |
|------|-------|
| `src/pages/index.jsx` | `/` |
| `src/pages/blog/index.jsx` | `/blog` |
| `src/pages/docs/getting-started/index.jsx` | `/docs/getting-started` |

### Dynamic Routes

Use `[param]` syntax for dynamic segments:

**File**: `src/pages/user/[id].jsx`  
**Route**: `/user/:id` (matches `/user/123`, `/user/alice`, etc.)

```jsx
// src/pages/user/[id].jsx
export default function UserProfile({ params }) {
  return (
    <div>
      <h1>User Profile</h1>
      <p>Viewing user: {params.id}</p>
    </div>
  );
}
```

### Multiple Dynamic Segments

**File**: `src/pages/shop/[category]/[product].jsx`  
**Route**: `/shop/:category/:product`

```jsx
// src/pages/shop/[category]/[product].jsx
export default function Product({ params }) {
  return (
    <div>
      <h2>{params.product}</h2>
      <p>Category: {params.category}</p>
    </div>
  );
}
```

### Route Priority

Routes are matched in this order:
1. **Static routes first** (exact matches)
2. **Dynamic routes second** (pattern matches)
3. **404 fallback** (no match)

**Example:**
```
/blog          → blog.jsx (static wins!)
/blog/hello    → blog/[slug].jsx (dynamic match)
/blog/123/edit → 404 (no matching route)
```

---

## 🚀 Navigation

### Link Component (Recommended)

Use the `Link` component for client-side navigation (no page reload!):

```jsx
import { Link } from 'bertui/router';

export default function Navigation() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <Link to="/blog">Blog</Link>
      <Link to="/user/123">Profile</Link>
    </nav>
  );
}
```

**Styling Links:**
```jsx
<Link 
  to="/about" 
  style={{ 
    color: '#10b981', 
    textDecoration: 'none',
    fontWeight: 'bold'
  }}
>
  About Us
</Link>
```

### Programmatic Navigation

Navigate from JavaScript (e.g., after form submission):

```jsx
import { useRouter } from 'bertui/router';

export default function LoginForm() {
  const { navigate } = useRouter();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Do login logic...
    const success = await login();
    
    if (success) {
      navigate('/dashboard');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Login</button>
    </form>
  );
}
```

### Router Hooks

Get current route information:

```jsx
import { useRouter } from 'bertui/router';

export default function Header() {
  const { pathname, currentRoute, params } = useRouter();
  
  return (
    <header>
      <p>Current path: {pathname}</p>
      <p>Route type: {currentRoute?.type}</p>
      {params.id && <p>User ID: {params.id}</p>}
    </header>
  );
}
```

---

## 🎨 CSS Animations

BertUI includes 15+ built-in CSS animation utilities. **No imports needed!**

### Available Animations

| Class | Effect | Duration |
|-------|--------|----------|
| `.fadein` | Fade in | 0.5s |
| `.scalein` | Scale up | 0.4s |
| `.bouncein` | Bounce entrance | 0.6s |
| `.moveright` | Slide from left | 0.5s |
| `.moveleft` | Slide from right | 0.5s |
| `.slideup` | Slide from bottom | 0.5s |
| `.slidedown` | Slide from top | 0.5s |
| `.rotatein` | Rotate entrance | 0.6s |
| `.pulse` | Pulsing loop | 1.5s |
| `.shake` | Shake effect | 0.5s |
| `.split` | Split text reveal | 0.6s |

### Usage Examples

#### Basic Animation
```jsx
export default function Home() {
  return (
    <div>
      <h1 className="fadein">Welcome!</h1>
      <p className="slideup">This slides up smoothly</p>
      <button className="scalein">Click Me!</button>
    </div>
  );
}
```

#### Split Text Animation (Advanced!)
```jsx
<h1 className="split" data-text="BertUI">
  BertUI
</h1>
```
**Note**: The `split` class requires a `data-text` attribute with the same text!

#### Combining with Custom Styles
```jsx
<div 
  className="bouncein"
  style={{
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    padding: '2rem',
    borderRadius: '10px'
  }}
>
  <h2>Bouncy Card!</h2>
</div>
```

#### Stagger Animations
```jsx
export default function FeatureList() {
  const features = ['Fast', 'Simple', 'Powerful'];
  
  return (
    <div>
      {features.map((feature, i) => (
        <div 
          key={i}
          className="slideup"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          {feature}
        </div>
      ))}
    </div>
  );
}
```

---

## ⚙️ Configuration

BertUI works **zero-config** out of the box, but you can customize it!

### Create `bertui.config.js`

```javascript
// bertui.config.js (optional, in your project root)
export default {
  meta: {
    title: "My Awesome App",
    description: "Built with BertUI - Lightning fast!",
    keywords: "react, bun, fast",
    author: "Your Name",
    themeColor: "#667eea",
    lang: "en",
    
    // Open Graph for social sharing
    ogTitle: "My Awesome App",
    ogDescription: "Check out my lightning-fast app!",
    ogImage: "/og-image.png"
  },
  
  appShell: {
    loading: true,
    loadingText: "Loading...",
    backgroundColor: "#ffffff"
  }
};
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `meta.title` | string | `"BertUI App"` | Page title |
| `meta.description` | string | `""` | Meta description |
| `meta.keywords` | string | `""` | Meta keywords |
| `meta.author` | string | `""` | Author name |
| `meta.themeColor` | string | `"#f30606ff"` | Theme color |
| `meta.lang` | string | `"en"` | HTML lang attribute |
| `meta.ogTitle` | string | `""` | Open Graph title |
| `meta.ogDescription` | string | `""` | Open Graph description |
| `meta.ogImage` | string | `""` | Open Graph image URL |

---

## 🏗️ Commands

### Development

```bash
# Start dev server (default port 3000)
bun run dev

# Start on custom port
bun run dev --port 8080
```

**Features:**
- ⚡ Instant startup (<100ms)
- 🔥 Hot Module Replacement
- 📊 Route discovery logs
- 🔍 File watching

### Production Build

```bash
# Build for production
bun run build
```

**Output:**
```
dist/
├── assets/
│   ├── main-[hash].js
│   └── chunks/
├── styles/
│   └── bertui.min.css
├── public/ (your assets)
└── index.html
```

**Features:**
- ✅ Automatic code splitting
- ✅ CSS minification (-35% size!)
- ✅ Tree shaking
- ✅ Source maps

### Preview Production Build

```bash
# Serve production build locally
bun run preview
```

Opens at [http://localhost:5000](http://localhost:5000)

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel
```

**Or use `vercel.json`:**
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

### Netlify

```bash
# Install Netlify CLI
bun add -g netlify-cli

# Deploy
netlify deploy --prod
```

**Build settings:**
- Build command: `bun run build`
- Publish directory: `dist`

**Create `netlify.toml`:**
```toml
[build]
  command = "bun run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Static Hosting (Any Provider)

BertUI builds static HTML/CSS/JS. Deploy `dist/` folder to:
- **GitHub Pages**
- **Cloudflare Pages**
- **AWS S3 + CloudFront**
- **Any static host!**

**Important**: Configure SPA routing (all routes → `/index.html`)

---

## 📚 Examples

### Complete App Example

```jsx
// src/pages/index.jsx
import { Link } from 'bertui/router';

export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1 className="fadein" style={{ fontSize: '3rem', color: '#667eea' }}>
        Welcome to BertUI! ⚡
      </h1>
      
      <p className="slideup" style={{ fontSize: '1.2rem', color: '#666' }}>
        Lightning-fast React development powered by Bun
      </p>
      
      <nav style={{ marginTop: '2rem' }}>
        <Link to="/about" style={{ 
          padding: '1rem 2rem',
          background: '#667eea',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px'
        }}>
          Learn More →
        </Link>
      </nav>
    </div>
  );
}
```

### Blog Example

```jsx
// src/pages/blog/[slug].jsx
import { Link } from 'bertui/router';

const posts = {
  'hello-world': {
    title: 'Hello World',
    content: 'Welcome to my blog!',
    date: 'Dec 15, 2024'
  },
  'bertui-rocks': {
    title: 'Why BertUI Rocks',
    content: 'It\'s so fast!',
    date: 'Dec 16, 2024'
  }
};

export default function BlogPost({ params }) {
  const post = posts[params.slug];
  
  if (!post) {
    return (
      <div>
        <h1>Post not found</h1>
        <Link to="/blog">← Back to Blog</Link>
      </div>
    );
  }
  
  return (
    <article>
      <h1 className="fadein">{post.title}</h1>
      <p style={{ color: '#666' }}>{post.date}</p>
      <div className="slideup">{post.content}</div>
      <Link to="/blog">← Back to Blog</Link>
    </article>
  );
}
```

### Form with Navigation

```jsx
// src/pages/contact.jsx
import { useState } from 'react';
import { useRouter } from 'bertui/router';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const { navigate } = useRouter();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Send form data...
    await fetch('/api/contact', { 
      method: 'POST',
      body: new FormData(e.target)
    });
    
    setSubmitted(true);
    
    // Redirect after 2 seconds
    setTimeout(() => navigate('/'), 2000);
  };
  
  if (submitted) {
    return (
      <div className="scalein">
        <h2>✅ Thanks! Redirecting...</h2>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" placeholder="Email" required />
      <textarea name="message" placeholder="Message" required />
      <button type="submit">Send</button>
    </form>
  );
}
```

---

## 🎯 Best Practices

### 1. Keep Pages Simple
```jsx
// ✅ Good - Composable
export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Footer />
    </>
  );
}

// ❌ Bad - Everything in one file
export default function Home() {
  return (
    <div>
      {/* 500 lines of code... */}
    </div>
  );
}
```

### 2. Use Dynamic Imports for Heavy Components
```jsx
import { lazy, Suspense } from 'react';

const Chart = lazy(() => import('../components/Chart'));

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading chart...</div>}>
      <Chart />
    </Suspense>
  );
}
```

### 3. Organize by Feature
```
src/
├── pages/
│   └── blog/
│       ├── index.jsx
│       └── [slug].jsx
├── components/
│   └── blog/
│       ├── PostCard.jsx
│       └── PostList.jsx
```

### 4. Use Link for Internal Nav
```jsx
// ✅ Good - Client-side routing
<Link to="/about">About</Link>

// ❌ Bad - Full page reload
<a href="/about">About</a>
```

---

## 🐛 Troubleshooting

### Routes Not Discovered?
- Ensure files are in `src/pages/`
- Check file extensions: `.jsx`, `.tsx`, `.js`, `.ts`
- Restart dev server: `bun run dev`

### Dynamic Routes Not Matching?
- Use `[param]` not `{param}` or `:param`
- Check route priority (static before dynamic)

### CSS Not Loading?
- CSS is auto-injected in dev mode
- In production, verify `dist/styles/bertui.min.css` exists
- Check browser console for 404 errors

### Build Fails?
```bash
# Clean and rebuild
rm -rf .bertui .bertuibuild dist node_modules/.cache
bun install
bun run build
```

### Import Errors?
Make sure you're importing from the right place:
```jsx
// ✅ Correct
import { Link, useRouter } from 'bertui/router';

// ❌ Wrong
import { Link } from '../router';
```

---

## 🤝 Contributing

We love contributions! Here's how:

1. **Fork** the repo
2. **Create** a feature branch (`git checkout -b feature/amazing`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing`)
5. **Open** a Pull Request

### Development Setup
```bash
git clone https://github.com/BunElysiaReact/BERTUI.git
cd BERTUI
bun install
bun link
cd test-app
bun link bertui
bun run dev
```

---

## 📄 License

MIT © [Pease Ernest](https://github.com/BunElysiaReact)

---

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh) - The incredibly fast JavaScript runtime
- Inspired by [Next.js](https://nextjs.org) - File-based routing excellence
- Powered by [Elysia](https://elysiajs.com) - Fast and elegant web framework

---

## 📞 Support

- 📚 [Documentation](https://github.com/BunElysiaReact/BERTUI)
- 🐛 [Issues](https://github.com/BunElysiaReact/BERTUI/issues)
- 💬 [Discussions](https://github.com/BunElysiaReact/BERTUI/discussions)

---

<div align="center">

**Built with ⚡ by developers who love speed**

[⭐ Star us on GitHub](https://github.com/BunElysiaReact/BERTUI) • [🐦 Follow on Twitter](https://twitter.com/BERT)

</div>
```

```markdown
# BertUI Quick Reference

## Create App
```bash
bunx create-bertui my-app
cd my-app
bun run dev
```

## Commands
```bash
bun run dev          # Start dev server
bun run build        # Build for production
bun run preview      # Preview production build
```

## Routing
```
src/pages/index.jsx              → /
src/pages/about.jsx              → /about
src/pages/blog/[slug].jsx        → /blog/:slug
src/pages/user/[id]/posts.jsx   → /user/:id/posts
```

## Navigation
```jsx
import { Link, useRouter } from 'bertui/router';

// Link component
<Link to="/about">About</Link>

// Programmatic
const { navigate } = useRouter();
navigate('/dashboard');

// Get params
const { params } = useRouter();
console.log(params.id);
```

## Animations
```jsx
<div className="fadein">Fade in</div>
<div className="scalein">Scale in</div>
<div className="bouncein">Bounce in</div>
<div className="slideup">Slide up</div>
<h1 className="split" data-text="Split">Split</h1>
```

## Page Component
```jsx
// src/pages/user/[id].jsx
export default function User({ params }) {
  return <div>User: {params.id}</div>;
}
```

## Config
```javascript
// bertui.config.js
export default {
  meta: {
    title: "My App",
    description: "Lightning fast!",
    themeColor: "#667eea"
  }
};
```
