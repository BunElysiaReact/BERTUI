# Installation

Get BertUI up and running in seconds.

## Prerequisites

You need [Bun](https://bun.sh) installed on your system:

```bash
curl -fsSL https://bun.sh/install | bash
```

Verify installation:

```bash
bun --version
# Should output: 1.x.x or higher
```

## Create New Project (Recommended)

The easiest way to get started is using our scaffolding tool:

```bash
bunx create-bertui my-awesome-app
```

This creates a new BertUI project with:
- ✅ Pre-configured file structure
- ✅ Sample pages with routing
- ✅ Beautiful example components
- ✅ All dependencies installed
- ✅ Zero configuration needed

**Just run and go!** 🚀

## Manual Installation (Advanced)

If you prefer to set up everything manually:

```bash
# Create your project directory
mkdir my-app
cd my-app

# Initialize package.json
bun init -y

# Install BertUI and React
bun add bertui react react-dom
```

Then you'll need to manually create:

### 1. Project Structure

```
my-app/
├── public/
│   └── favicon.svg
├── src/
│   ├── pages/
│   │   └── index.jsx
│   └── main.jsx
├── package.json
└── bertui.config.js (optional)
```

### 2. Main Entry Point

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

### 3. First Page

**`src/pages/index.jsx`:**
```jsx
export default function Home() {
  return <h1>Hello BertUI! ⚡</h1>;
}
```

### 4. Package.json Scripts

```json
{
  "scripts": {
    "dev": "bertui dev",
    "build": "bertui build",
    "preview": "bunx serve dist -p 5000"
  }
}
```

**⚠️ Note:** Manual setup requires you to understand the router configuration. We **highly recommend** using `bunx create-bertui` instead!

## Start Development

```bash
cd my-awesome-app
bun run dev
```

Your dev server starts instantly at [http://localhost:3000](http://localhost:3000)

## What You Get

### With `bunx create-bertui` (Recommended)
✅ Complete project structure  
✅ Pre-configured routing  
✅ Example pages and components  
✅ Beautiful landing page  
✅ Blog example with dynamic routes  
✅ All best practices included  

### With Manual Install
⚠️ Basic setup only  
⚠️ You configure everything  
⚠️ Requires routing knowledge  
⚠️ More setup time  

## Project Structure Explained

```
my-awesome-app/
├── public/              # Static assets (images, fonts, etc.)
│   └── favicon.svg     # Your site favicon
│
├── src/
│   ├── pages/          # 📁 FILE-BASED ROUTES (magic happens here!)
│   │   ├── index.jsx   # Home page (/)
│   │   ├── about.jsx   # About page (/about)
│   │   └── blog/
│   │       ├── index.jsx      # Blog listing (/blog)
│   │       └── [slug].jsx     # Blog post (/blog/:slug)
│   │
│   ├── components/     # Reusable React components
│   └── main.jsx        # App entry point
│
├── package.json        # Project dependencies
└── bertui.config.js    # Optional configuration
```

## Verify Installation

Test that everything works:

```bash
# Should see the dev server start
bun run dev

# In another terminal, test the build
bun run build

# Should create dist/ folder
ls dist
```

## Troubleshooting

### Command not found: bertui

Make sure you installed BertUI:
```bash
bun add bertui
```

### Port already in use

Change the port:
```bash
bun run dev --port 8080
```

### Module not found errors

Reinstall dependencies:
```bash
rm -rf node_modules
bun install
```

## Next Steps

- [Create Your First Page](./first-page.html) - Build something!
- [Learn About Routing](../guides/routing.html) - Master file-based routing
- ~~[Add Animations](../guides/animations.html)~~ - Temporarily unavailable

---

**💡 Tip:** Always use `bunx create-bertui` for new projects. It's the fastest way to get started and includes all best practices!