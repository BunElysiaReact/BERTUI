// ==========================================
// docs/getting-started/first-page.md
// ==========================================
# Your First Page

Let's create a simple page in BertUI.

## Create the File

Create a new file at `src/pages/hello.jsx`:

```jsx
export default function Hello() {
  return (
    <div>
      <h1>Hello, BertUI!</h1>
      <p>This is my first page.</p>
    </div>
  );
}
```

That's it! Navigate to [http://localhost:3000/hello](http://localhost:3000/hello)

## Add Some Style

Let's make it prettier with inline styles:

```jsx
export default function Hello() {
  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'system-ui',
      textAlign: 'center'
    }}>
      <h1 style={{ 
        fontSize: '3rem', 
        color: '#667eea' 
      }}>
        Hello, BertUI!
      </h1>
      <p style={{ 
        fontSize: '1.25rem', 
        color: '#666' 
      }}>
        This is my first page.
      </p>
    </div>
  );
}
```

## Add Navigation

Import the Link component to navigate between pages:

```jsx
import { Link } from 'bertui/router';

export default function Hello() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Hello, BertUI!</h1>
      
      <nav style={{ marginTop: '2rem' }}>
        <Link to="/">Home</Link>
        {' | '}
        <Link to="/about">About</Link>
      </nav>
    </div>
  );
}
```

## Use Built-in Animations

Add the `fadein` class for a smooth entrance:

```jsx
export default function Hello() {
  return (
    <div className="fadein" style={{ padding: '2rem' }}>
      <h1 className="scalein">Hello, BertUI!</h1>
      <p className="slideup">This is my first page.</p>
    </div>
  );
}
```

Available animations: `fadein`, `scalein`, `bouncein`, `slideup`, `moveright`

## Next Steps

- [Learn more about routing](../guides/routing.html)
- [Explore all animations](../guides/animations.html)
- [Build a blog](../tutorials/blog.html)
