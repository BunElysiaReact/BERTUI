// ==========================================
// docs/api/reference.md
// ==========================================
# API Reference

Complete API documentation for BertUI.

## Router

### Link Component

Client-side navigation component.

```jsx
import { Link } from 'bertui/router';

<Link to="/about">About</Link>
```

**Props:**
- `to` (string, required) - Destination path
- `...props` (any) - Additional HTML anchor props

### useRouter Hook

Access router state and navigation function.

```jsx
import { useRouter } from 'bertui/router';

function MyComponent() {
  const { navigate, pathname, params, currentRoute } = useRouter();
  
  return <div>Current: {pathname}</div>;
}
```

**Returns:**
- `navigate(path: string)` - Navigate to a path
- `pathname` (string) - Current pathname
- `params` (object) - Route parameters
- `currentRoute` (object) - Current route info

## Configuration

### bertui.config.js

Optional configuration file in project root.

```javascript
export default {
  meta: {
    title: "My App",
    description: "App description",
    keywords: "react, bun",
    author: "Your Name",
    themeColor: "#667eea",
    lang: "en",
    ogTitle: "Open Graph title",
    ogDescription: "OG description",
    ogImage: "/og-image.png"
  },
  
  appShell: {
    loading: true,
    loadingText: "Loading...",
    backgroundColor: "#ffffff"
  }
};
```

## CSS Classes

All built-in animation utilities:

- `.fadein` - Fade in (0.5s)
- `.scalein` - Scale up (0.4s)
- `.bouncein` - Bounce (0.6s)
- `.moveright` - Slide from left (0.5s)
- `.moveleft` - Slide from right (0.5s)
- `.slideup` - Slide from bottom (0.5s)
- `.slidedown` - Slide from top (0.5s)
- `.rotatein` - Rotate entrance (0.6s)
- `.pulse` - Pulsing loop (1.5s)
- `.shake` - Shake effect (0.5s)
- `.split` - Split text reveal (0.6s)

## Commands

### Development

```bash
bun run dev              # Start dev server
bun run dev --port 8080  # Custom port
```

### Production

```bash
bun run build    # Build for production
bun run preview  # Preview production build
```

## Next Steps

- [See full examples](../tutorials/complete-app.html)
- [Deployment guide](../guides/deployment.html)
