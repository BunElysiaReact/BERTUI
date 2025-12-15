# BertUI Routing Guide

BertUI supports file-based routing similar to Next.js, where your file structure automatically generates routes.

## Quick Start

### 1. Create Pages Directory

```
src/
├── pages/
│   ├── index.jsx       → /
│   ├── about.jsx       → /about
│   └── blog/
│       ├── index.jsx   → /blog
│       └── [slug].jsx  → /blog/:slug (dynamic)
└── main.jsx
```

### 2. Set Up Router in main.jsx

```javascript
// src/main.jsx
;
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Router } from 'bertui/router';

// Auto-generated routes from .bertui/compiled/router.js
import { routes } from '../.bertui/compiled/router.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router routes={routes} />
  </React.StrictMode>
);
```

## File-Based Routing

### Static Routes

**File**: `src/pages/about.jsx`
**Route**: `/about`

```javascript
// src/pages/about.jsx
export default function About() {
  return (
    <div>
      <h1>About Page</h1>
      <p>This is the about page.</p>
    </div>
  );
}
```

### Index Routes

**File**: `src/pages/index.jsx`
**Route**: `/`

**File**: `src/pages/blog/index.jsx`
**Route**: `/blog`

```javascript
// src/pages/blog/index.jsx
export default function Blog() {
  return (
    <div>
      <h1>Blog</h1>
      <ul>
        <li><a href="/blog/hello-world">Hello World</a></li>
        <li><a href="/blog/second-post">Second Post</a></li>
      </ul>
    </div>
  );
}
```

### Dynamic Routes

**File**: `src/pages/blog/[slug].jsx`
**Route**: `/blog/:slug` (matches any slug)

```javascript
// src/pages/blog/[slug].jsx
import { useParams } from 'bertui/router';

export default function BlogPost() {
  const { slug } = useParams();
  
  return (
    <div>
      <h1>Blog Post: {slug}</h1>
      <p>You're viewing the post with slug: {slug}</p>
    </div>
  );
}
```

### Nested Dynamic Routes

**File**: `src/pages/products/[category]/[id].jsx`
**Route**: `/products/:category/:id`

```javascript
// src/pages/products/[category]/[id].jsx
import { useParams } from 'bertui/router';

export default function Product() {
  const { category, id } = useParams();
  
  return (
    <div>
      <h1>Product {id}</h1>
      <p>Category: {category}</p>
    </div>
  );
}
```

## Router API

### Router Component

```javascript
import { Router } from 'bertui/router';

<Router routes={routes}>
  {/* Optional: Custom 404 component */}
  <NotFoundPage />
</Router>
```

### Navigation with Link

```javascript
import { Link } from 'bertui/router';

function Navigation() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <Link to="/blog">Blog</Link>
    </nav>
  );
}
```

### Programmatic Navigation

```javascript
import { useRouter } from 'bertui/router';

function LoginButton() {
  const { navigate } = useRouter();
  
  const handleLogin = async () => {
    // Perform login...
    navigate('/dashboard');
  };
  
  return <button onClick={handleLogin}>Login</button>;
}
```

### Access Route Parameters

```javascript
import { useParams } from 'bertui/router';

function BlogPost() {
  const params = useParams();
  // params = { slug: 'hello-world' }
  
  return <h1>{params.slug}</h1>;
}
```

### Get Current Route Info

```javascript
import { useRouter } from 'bertui/router';

function Header() {
  const { pathname, currentRoute } = useRouter();
  
  return (
    <header>
      <p>Current path: {pathname}</p>
      <p>Route type: {currentRoute?.type}</p>
    </header>
  );
}
```

## Route Priority

Routes are matched in this order:

1. **Static routes first** (exact matches)
2. **Dynamic routes second** (pattern matches)
3. **404 fallback** (no match)

### Example

Given these files:
```
src/pages/
├── blog.jsx           → /blog (static)
├── [page].jsx         → /:page (dynamic)
└── blog/[slug].jsx    → /blog/:slug (dynamic)
```

URL `/blog` matches `blog.jsx` (static), not `[page].jsx`

## Complete Example

### Project Structure

```
my-app/
├── src/
│   ├── pages/
│   │   ├── index.jsx
│   │   ├── about.jsx
│   │   ├── contact.jsx
│   │   └── blog/
│   │       ├── index.jsx
│   │       └── [slug].jsx
│   ├── components/
│   │   ├── Layout.jsx
│   │   └── Navigation.jsx
│   └── main.jsx
└── package.json
```

### Layout Component

```javascript
// src/components/Layout.jsx
import { Link } from 'bertui/router';

export default function Layout({ children }) {
  return (
    <div>
      <nav style={{ padding: '1rem', background: '#f0f0f0' }}>
        <Link to="/">Home</Link>
        {' | '}
        <Link to="/about">About</Link>
        {' | '}
        <Link to="/blog">Blog</Link>
        {' | '}
        <Link to="/contact">Contact</Link>
      </nav>
      
      <main style={{ padding: '2rem' }}>
        {children}
      </main>
      
      <footer style={{ padding: '1rem', textAlign: 'center', background: '#f0f0f0' }}>
        <p>© 2025 My BertUI App</p>
      </footer>
    </div>
  );
}
```

### Home Page with Layout

```javascript
// src/pages/index.jsx
import Layout from '../components/Layout';

export default function Home() {
  return (
    <Layout>
      <h1 className="fadein">Welcome to BertUI!</h1>
      <p className="moveright">
        This is a file-based routing example.
      </p>
    </Layout>
  );
}
```

### Blog List Page

```javascript
// src/pages/blog/index.jsx
import Layout from '../../components/Layout';
import { Link } from 'bertui/router';

const posts = [
  { slug: 'getting-started', title: 'Getting Started with BertUI' },
  { slug: 'routing-guide', title: 'File-Based Routing' },
  { slug: 'animations', title: 'Built-in Animations' }
];

export default function Blog() {
  return (
    <Layout>
      <h1>Blog</h1>
      <ul>
        {posts.map(post => (
          <li key={post.slug}>
            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
```

### Dynamic Blog Post Page

```javascript
// src/pages/blog/[slug].jsx
import { useParams, useRouter } from 'bertui/router';
import Layout from '../../components/Layout';

const posts = {
  'getting-started': {
    title: 'Getting Started with BertUI',
    content: 'BertUI is a lightning-fast React framework...'
  },
  'routing-guide': {
    title: 'File-Based Routing',
    content: 'BertUI uses file-based routing similar to Next.js...'
  },
  'animations': {
    title: 'Built-in Animations',
    content: 'BertUI includes 15+ CSS animation utilities...'
  }
};

export default function BlogPost() {
  const { slug } = useParams();
  const { navigate } = useRouter();
  const post = posts[slug];
  
  if (!post) {
    return (
      <Layout>
        <h1>Post not found</h1>
        <button onClick={() => navigate('/blog')}>Back to Blog</button>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <article>
        <h1 className="fadein">{post.title}</h1>
        <p className="moveright">{post.content}</p>
        <button onClick={() => navigate('/blog')}>← Back to Blog</button>
      </article>
    </Layout>
  );
}
```

## Best Practices

1. **Always use Link for internal navigation** - Uses client-side routing, no page reload
2. **Use regular `<a>` tags for external links**
3. **Keep page components pure** - Data fetching in useEffect
4. **Use layouts for shared UI** - Navigation, footers, etc.
5. **Handle 404s gracefully** - Provide custom fallback component

## Troubleshooting

### Routes not discovered?
- Ensure files are in `src/pages/` directory
- Check file extensions: `.jsx`, `.tsx`, `.js`, `.ts`
- Run `bertui dev` to regenerate routes

### Dynamic routes not matching?
- Check bracket syntax: `[slug].jsx` not `{slug}.jsx`
- Ensure parameter names don't conflict
- Static routes always match before dynamic

### Navigation not working?
- Use `<Link>` from `bertui/router`, not plain `<a>`
- Check that Router component wraps your app
- Verify routes array is imported correctly

## What Gets Generated

When you run `bertui dev`, BertUI automatically generates:

```javascript
// .bertui/compiled/router.js
import Page0 from './pages/index.jsx';
import Page1 from './pages/about.jsx';
import Page2 from './pages/blog/index.jsx';
import Page3 from './pages/blog/[slug].jsx';

export const routes = [
  { path: '/', component: Page0, type: 'static' },
  { path: '/about', component: Page1, type: 'static' },
  { path: '/blog', component: Page2, type: 'static' },
  { path: '/blog/[slug]', component: Page3, type: 'dynamic' }
];
```

This file is auto-updated on every file change during development!