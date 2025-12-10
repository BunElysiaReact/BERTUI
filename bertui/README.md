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
import 'bertui/styles';
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

## License

MIT