# BertUI ⚡

Lightning-fast React development powered by Bun.

## Features

- ⚡ **Blazing Fast** - Built on Bun
- 🎨 **Built-in Animations** - 15+ CSS utility classes
- 🔥 **Hot Module Replacement** - Instant updates
- 📦 **Zero Config** - Works out of the box
- 🚀 **Production Ready** - Optimized builds

## Installation
```bash
bun add bertui react react-dom
```

## Usage
```javascript
// src/main.jsx
;
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')).render(
  <h1 className="split fadein">Hello BertUI!</h1>
);
```

## Commands
```bash
bertui dev         # Start dev server
bertui build       # Build for production
```

## CSS Classes

- `.split` - Split text animation
- `.moveright` - Slide from left
- `.moveleft` - Slide from right
- `.fadein` - Fade in
- `.scalein` - Scale in
- `.bouncein` - Bounce in
- `.slideup` - Slide up
- `.slidedown` - Slide down
- `.rotatein` - Rotate in
- `.pulse` - Pulse animation
- `.shake` - Shake animation

# 🎉 BertUI Now Has File-Based Routing!

## What We Built

I've added a **complete file-based routing system** to BertUI. Here's what's included:

### 📁 New Files to Add

1. **`src/router/router.js`** - Core routing logic
   - Scans `src/pages/` directory
   - Generates route definitions
   - Creates React Router component
   - Provides `Link` and `navigate` utilities

2. **`src/client/compiler.js`** (updated) - Enhanced compiler
   - Detects `pages/` directory
   - Auto-generates router code
   - Supports both routing and non-routing modes

3. **`src/server/dev-server.js`** (updated) - Enhanced dev server
   - Serves SPA-style HTML for all routes
   - Notifies clients of route changes
   - Better HMR integration

## 🚀 Features

### ✅ File-Based Routing
```
src/pages/index.jsx       → /
src/pages/about.jsx       → /about
src/pages/blog/index.jsx  → /blog
```

### ✅ Dynamic Routes
```
src/pages/user/[id].jsx           → /user/:id
src/pages/blog/[slug].jsx         → /blog/:slug
src/pages/shop/[cat]/[prod].jsx   → /shop/:cat/:prod
```

### ✅ Navigation Components
```jsx
import { Link, navigate } from '../.bertui/router';

// Link component
<Link href="/about">About</Link>

// Programmatic navigation
navigate('/dashboard');
```

### ✅ Route Parameters
```jsx
export default function UserProfile({ params }) {
  return <div>User ID: {params.id}</div>;
}
```

### ✅ Backward Compatible
- Still works with `src/main.jsx` if no `pages/` directory
- Automatically detects routing mode
- No breaking changes!

## 📊 How It Works

1. **Developer creates pages:**
   ```bash
   src/pages/
   ├── index.jsx
   ├── about.jsx
   └── user/[id].jsx
   ```

2. **BertUI scans and generates routes:**
   ```javascript
   [
     { path: '/', file: 'index.jsx' },
     { path: '/about', file: 'about.jsx' },
     { path: '/user/:id', file: 'user/[id].jsx', isDynamic: true }
   ]
   ```

3. **Router code is auto-generated:**
   - Creates `.bertui/router.js`
   - Imports all page components
   - Provides routing logic

4. **Dev server serves SPA:**
   - All routes serve the same HTML
   - Client-side routing handles navigation
   - HMR updates routes on file changes

## 🔧 Integration Steps

### 1. Add Router Files
Copy these files to your BertUI project:
- `src/router/router.js` (new)
- `src/client/compiler.js` (replace)
- `src/server/dev-server.js` (replace)

### 2. Update Dependencies
No new dependencies needed! Uses existing React ecosystem.

### 3. Test It
```bash
# Create example pages
mkdir -p src/pages
echo 'export default () => <h1>Home</h1>' > src/pages/index.jsx
echo 'export default () => <h1>About</h1>' > src/pages/about.jsx

# Start dev server
bertui dev
```

### 4. Watch the Magic
- Navigate to `http://localhost:3000` → Home page
- Click links → No page reload!
- Edit files → Instant HMR!
- Check console → Route discovery logs

## 🎨 Works with BertUI Animations

```jsx
export default function Home() {
  return (
    <div>
      <h1 className="split fadein" data-text="Welcome!">
        Welcome!
      </h1>
      <p className="moveright">Lightning fast! ⚡</p>
    </div>
  );
}
```

## 📈 Performance

- **Fast compilation:** Bun's speed + code splitting
- **Small bundles:** Each route is a separate chunk
- **Quick HMR:** Only recompiles changed files
- **Smart routing:** Static routes matched first

## 🐛 Error Handling

- Missing routes → Auto 404 page
- Invalid pages → Compilation error with details
- Runtime errors → Preserved in dev mode

## 🎯 Next Steps

### Recommended Enhancements:
1. **Layouts** - Wrap pages with shared layouts
2. **Middleware** - Auth, logging, etc.
3. **Data Loading** - Fetch data before rendering
4. **API Routes** - Backend API in `pages/api/`
5. **Static Generation** - Pre-render at build time

### Production Build
Update `build.js` to:
- Generate static HTML for each route
- Create optimized bundles per route
- Handle dynamic routes appropriately

## 🎓 Usage Example

```jsx
// src/pages/index.jsx
import { Link } from '../.bertui/router';

export default function Home() {
  return (
    <div className="fadein">
      <h1>Welcome to My App!</h1>
      <nav>
        <Link href="/about">About</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/user/123">My Profile</Link>
      </nav>
    </div>
  );
}

// src/pages/user/[id].jsx
export default function UserProfile({ params }) {
  return (
    <div className="scalein">
      <h1>User {params.id}</h1>
      <p>Profile page for user {params.id}</p>
    </div>
  );
}

## License

MIT