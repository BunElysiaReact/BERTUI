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
