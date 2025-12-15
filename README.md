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

# BertUI Routing 🚀

BertUI now supports **file-based routing** out of the box! No configuration needed.

## How It Works

Create a `src/pages/` directory and BertUI automatically generates routes based on your file structure.

### Basic Routes

```
src/pages/
├── index.jsx       → /
├── about.jsx       → /about
├── contact.jsx     → /contact
└── blog/
    ├── index.jsx   → /blog
    └── post.jsx    → /blog/post
```

### Dynamic Routes

Use square brackets `[param]` for dynamic segments:

```
src/pages/
├── user/
│   └── [id].jsx    → /user/:id
├── blog/
│   └── [slug].jsx  → /blog/:slug
└── shop/
    └── [category]/
        └── [product].jsx → /shop/:category/:product
```

## Page Components

Each page exports a default React component:

```jsx
// src/pages/index.jsx
export default function Home() {
  return (
    <div className="fadein">
      <h1>Welcome to BertUI!</h1>
    </div>
  );
}
```

### Accessing Route Parameters

Dynamic route parameters are passed as props:

```jsx
// src/pages/user/[id].jsx
export default function UserProfile({ params }) {
  return (
    <div className="scalein">
      <h1>User Profile</h1>
      <p>User ID: {params.id}</p>
    </div>
  );
}
```

## Navigation

BertUI provides a `Link` component for client-side navigation:

```jsx
// Import from the generated router
import { Link } from '../.bertui/router';

export default function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/blog">Blog</Link>
    </nav>
  );
}
```

### Programmatic Navigation

Use the `navigate` function:

```jsx
import { navigate } from '../.bertui/router';

export default function LoginButton() {
  const handleLogin = () => {
    // Do login logic
    navigate('/dashboard');
  };
  
  return <button onClick={handleLogin}>Login</button>;
}
```

## Features

✅ **File-based routing** - Zero configuration  
✅ **Dynamic routes** - URL parameters with `[param]` syntax  
✅ **Nested routes** - Folder structure = route hierarchy  
✅ **Client-side navigation** - Fast SPA experience  
✅ **Hot Module Replacement** - Route changes reload instantly  
✅ **Code splitting** - Each route is a separate chunk  
✅ **404 handling** - Automatic 404 page for unmatched routes

## Migration from Non-Routing Setup

If you have an existing BertUI project with `src/main.jsx`, you can enable routing:

1. **Create pages directory:**
   ```bash
   mkdir -p src/pages
   ```

2. **Move your root component to index.jsx:**
   ```bash
   mv src/App.jsx src/pages/index.jsx
   ```

3. **Restart dev server:**
   ```bash
   bertui dev
   ```

That's it! BertUI will automatically detect the `pages/` directory and enable routing.

## Example Project Structure

```
my-app/
├── src/
│   └── pages/
│       ├── index.jsx           # Home page
│       ├── about.jsx           # About page
│       ├── blog/
│       │   ├── index.jsx       # Blog listing
│       │   └── [slug].jsx      # Individual post
│       └── user/
│           ├── [id].jsx        # User profile
│           └── [id]/
│               └── settings.jsx # User settings
├── package.json
└── bunfig.toml
```

## Best Practices

1. **Keep pages simple** - Pages should be lightweight components that compose smaller components
2. **Use the Link component** - Avoid `<a>` tags for internal navigation
3. **Organize by feature** - Group related pages in folders
4. **Name files descriptively** - Use clear, lowercase names (e.g., `user-settings.jsx`)

## Coming Soon

- [ ] Layouts and nested layouts
- [ ] Middleware support
- [ ] Data loading hooks
- [ ] API routes
- [ ] Static site generation (SSG)

---

**Need help?** Check out the [BertUI GitHub](https://github.com/BunElysiaReact/BERTUI) for examples and issues.

## License

MIT