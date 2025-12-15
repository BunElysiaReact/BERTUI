// ==========================================
// docs/guides/routing.md
// ==========================================
# File-Based Routing

BertUI uses file-based routing - your file structure becomes your URL structure.

## Basic Routes

Create a file, get a route:

| File | Route |
|------|-------|
| `src/pages/index.jsx` | `/` |
| `src/pages/about.jsx` | `/about` |
| `src/pages/contact.jsx` | `/contact` |

## Nested Routes

Use folders for nested routes:

| File | Route |
|------|-------|
| `src/pages/blog/index.jsx` | `/blog` |
| `src/pages/blog/posts.jsx` | `/blog/posts` |
| `src/pages/blog/authors.jsx` | `/blog/authors` |

## Dynamic Routes

Use `[param]` syntax for dynamic segments:

```
src/pages/blog/[slug].jsx  →  /blog/:slug
```

Access the parameter in your component:

```jsx
export default function BlogPost({ params }) {
  return (
    <div>
      <h1>Post: {params.slug}</h1>
    </div>
  );
}
```

## Multiple Parameters

Combine multiple dynamic segments:

```
src/pages/shop/[category]/[item].jsx  →  /shop/:category/:item
```

```jsx
export default function Product({ params }) {
  return (
    <div>
      <h2>Category: {params.category}</h2>
      <h3>Item: {params.item}</h3>
    </div>
  );
}
```

## Navigation

### Link Component

Use `Link` for client-side navigation (no page reload):

```jsx
import { Link } from 'bertui/router';

export default function Navigation() {
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

Navigate from JavaScript:

```jsx
import { useRouter } from 'bertui/router';

export default function LoginForm() {
  const { navigate } = useRouter();
  
  const handleSubmit = () => {
    // Do login...
    navigate('/dashboard');
  };
  
  return (
    <button onClick={handleSubmit}>Login</button>
  );
}
```

## Route Priority

Routes are matched in this order:

1. **Static routes** (exact matches)
2. **Dynamic routes** (pattern matches)

Example:
- `/blog` matches `blog.jsx` (static)
- `/blog/hello` matches `blog/[slug].jsx` (dynamic)

## Next Steps

- [Add animations](./animations.html)
- [Build a blog tutorial](../tutorials/blog.html)
- [API reference](../api/reference.html)
