// ==========================================
// docs/guides/animations.md
// ==========================================
# Built-in Animations

## ⚠️ IMPORTANT NOTICE

**The built-in CSS animation utilities have been temporarily removed from BertUI.**

### Why?
We encountered compatibility issues with `bun.build` that prevented the CSS utilities from being properly bundled in production builds. Rather than ship a broken feature, we've temporarily disabled it while we work on a proper solution.

### When will they return?
We're actively working on this and expect to have the animations back in an upcoming release. The feature will return better than ever!

### What can I use instead?

While we work on bringing back the built-in animations, here are your options:

#### 1. Use Your Own CSS Animations

```css
/* src/styles/animations.css */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}
```

```jsx
import './styles/animations.css';

export default function Home() {
  return <h1 className="fade-in">Welcome!</h1>;
}
```

#### 2. Use Inline Styles with React

```jsx
import { useState, useEffect } from 'react';

export default function FadeIn({ children }) {
  const [opacity, setOpacity] = useState(0);
  
  useEffect(() => {
    setOpacity(1);
  }, []);
  
  return (
    <div style={{
      opacity,
      transition: 'opacity 0.5s ease-out'
    }}>
      {children}
    </div>
  );
}
```

#### 3. Use External Animation Libraries

**Framer Motion** (Recommended):
```bash
bun add framer-motion
```

```jsx
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1>Welcome to BertUI!</h1>
    </motion.div>
  );
}
```

**React Spring**:
```bash
bun add @react-spring/web
```

```jsx
import { useSpring, animated } from '@react-spring/web';

export default function Home() {
  const springs = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
  });

  return <animated.div style={springs}>Hello!</animated.div>;
}
```

## Previously Available Animations

For reference, these were the animation classes that will return:

### Fade & Scale
- `.fadein` - Fade in (0.5s)
- `.scalein` - Scale up (0.4s)

### Slide
- `.slideup` - Slide from bottom (0.5s)
- `.slidedown` - Slide from top (0.5s)
- `.moveright` - Slide from left (0.5s)
- `.moveleft` - Slide from right (0.5s)

### Bounce & Rotate
- `.bouncein` - Bouncy entrance (0.6s)
- `.rotatein` - Rotate entrance (0.6s)

### Special Effects
- `.pulse` - Continuous pulse (1.5s)
- `.shake` - Shake effect (0.5s)
- `.split` - Split text reveal (0.6s)

## We Apologize

We understand this is frustrating, especially if you were relying on these utilities. We're committed to bringing them back as soon as possible with proper build tool integration.

Thank you for your patience and understanding! 🙏

## Next Steps

- [File-Based Routing](./routing.html) - Still works perfectly!
- [Build a Blog Tutorial](../tutorials/blog.html)
- [API Reference](../api/reference.html)

---

**Follow updates:** Watch our [GitHub repository](https://github.com/BunElysiaReact/BERTUI) for announcements about when animations return.