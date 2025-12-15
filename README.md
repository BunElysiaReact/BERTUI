# BertUI ⚡

Lightning-fast React development powered by Bun.

## ⚠️ Important Notice - CSS Animations Temporarily Unavailable

**The built-in CSS animation utilities have been temporarily removed** due to compatibility issues with `bun.build`. We're working on a solution and they will be back in an upcoming release.

**What this means:**
- The 15+ animation classes (`.fadein`, `.scalein`, `.bouncein`, etc.) are not currently available
- You can still use your own CSS animations or external libraries
- All other BertUI features work normally

**We apologize for any inconvenience caused.** This feature will return soon! 🚀

---

## Features

- ⚡ **Blazing Fast** - Built on Bun
- 📁 **File-Based Routing** - Zero config routing
- 🔥 **Hot Module Replacement** - Instant updates
- 📦 **Zero Config** - Works out of the box
- 🚀 **Production Ready** - Optimized builds

## Quick Start

### Create New App (Recommended)
```bash
bunx create-bertui my-app
cd my-app
bun run dev
```

This creates a complete BertUI project with:
- Pre-configured file structure
- Sample pages with routing
- Beautiful example components
- All dependencies installed

### Manual Installation (Advanced)
If you want to configure everything yourself:
```bash
bun add bertui react react-dom
```

Then you'll need to manually set up:
- Project structure (`src/pages/`, `src/main.jsx`, etc.)
- Router configuration
- Build configuration

**Note:** We recommend using `bunx create-bertui` for the best experience!

## Commands
```bash
bertui dev         # Start dev server
bertui build       # Build for production
```

## File-Based Routing

BertUI now has **complete file-based routing**! Here's what's included:

### 📁 Features

#### ✅ File-Based Routing
```
src/pages/index.jsx       → /
src/pages/about.jsx       → /about
src/pages/blog/index.jsx  → /blog
```

#### ✅ Dynamic Routes
```
src/pages/user/[id].jsx           → /user/:id
src/pages/blog/[slug].jsx         → /blog/:slug
src/pages/shop/[cat]/[prod].jsx   → /shop/:cat/:prod
```

#### ✅ Navigation Components
```jsx
import { Link, navigate } from 'bertui/router';

// Link component
<Link to="/about">About</Link>

// Programmatic navigation
const { navigate } = useRouter();
navigate('/dashboard');
```

#### ✅ Route Parameters
```jsx
export default function UserProfile({ params }) {
  return <div>User ID: {params.id}</div>;
}
```

#### ✅ Backward Compatible
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

## 🎓 Usage Example

```jsx
// src/pages/index.jsx
import { Link } from 'bertui/router';

export default function Home() {
  return (
    <div>
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

## 🏁 Conclusion

BertUI now has **production-ready file-based routing** that's:
- ⚡ **Fast** - Built on Bun
- 🎯 **Simple** - Zero config
- 💪 **Powerful** - Dynamic routes, params, navigation
- 🔥 **Modern** - HMR, code splitting, SPA

## License

MIT