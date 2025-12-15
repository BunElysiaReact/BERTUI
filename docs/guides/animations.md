// ==========================================
// docs/guides/animations.md
// ==========================================
# Built-in Animations

BertUI includes 15+ CSS animation utilities ready to use.

## Available Animations

### Fade & Scale

```jsx
<div className="fadein">Smooth fade in</div>
<div className="scalein">Scale up entrance</div>
```

### Slide

```jsx
<div className="slideup">Slide from bottom</div>
<div className="slidedown">Slide from top</div>
<div className="moveright">Slide from left</div>
<div className="moveleft">Slide from right</div>
```

### Bounce & Rotate

```jsx
<div className="bouncein">Bouncy entrance</div>
<div className="rotatein">Rotate in</div>
```

### Special Effects

```jsx
<div className="pulse">Continuous pulse</div>
<div className="shake">Shake effect</div>
```

### Split Text

```jsx
<h1 className="split" data-text="BertUI">
  BertUI
</h1>
```

**Note:** The split animation requires a `data-text` attribute with the same text.

## Combining Animations

You can combine animations with your own styles:

```jsx
<div 
  className="fadein"
  style={{
    padding: '2rem',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    borderRadius: '12px'
  }}
>
  <h2>Beautiful Card</h2>
</div>
```

## Staggered Animations

Create staggered effects with inline delays:

```jsx
export default function Features() {
  const features = ['Fast', 'Simple', 'Powerful'];
  
  return (
    <div>
      {features.map((feature, i) => (
        <div
          key={i}
          className="slideup"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          {feature}
        </div>
      ))}
    </div>
  );
}
```

## Custom Timing

Override animation duration:

```jsx
<div 
  className="fadein"
  style={{ animationDuration: '1s' }}
>
  Slow fade in
</div>
```

## Next Steps

- [See examples](../tutorials/animations-demo.html)
- [Build a landing page](../tutorials/landing-page.html)
