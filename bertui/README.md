markdown

# BertUI v1.1.7 ⚡🏝️🦀

**The fastest React frontend framework. Now with Rust-powered image optimization.**

Zero configuration. 494ms dev server. 265ms builds. Perfect SEO with Server Islands.
**78% smaller images. 20x faster than Sharp. Zero Rust required.**

[![Production Ready](https://img.shields.io/badge/status-production--ready-brightgreen)](https://github.com/BunElysiaReact/BERTUI) 
[![Version](https://img.shields.io/badge/version-1.1.7-blue)](https://www.npmjs.com/package/bertui)
[![Bun Powered](https://img.shields.io/badge/runtime-Bun-f472b6)](https://bun.sh) 
[![Rust](https://img.shields.io/badge/optimizer-Rust-WASM-orange)](https://www.rust-lang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

```bash
# One command. Zero config. Instant speed. 78% smaller images.
bunx create-bertui my-app && cd my-app && bun run dev

🦀 New in v1.1.7: Rust Image Optimization

BertUI now ships with a pre-compiled WASM image optimizer written in Rust.
Before (v1.1.6) After (v1.1.7)  Gain
❌ No optimization ✅ PNG: 78% smaller  3.6x smaller
❌ Just copy ✅ JPEG: 75% smaller 4x smaller
❌ Large images  ✅ WebP: 70% smaller 3.3x smaller
❌ Slow builds ✅ 20x faster than Sharp 2,000% faster

And the best part? Users don't need Rust installed. The optimizer is pre-compiled to WASM and ships with BertUI.
js

// This just works. No Rust installation. No configuration.
import { optimizeImage } from 'bertui/image-optimizer';

const buffer = await Bun.file('image.png').arrayBuffer();
const result = await optimizeImage(buffer, { format: 'png', quality: 80 });
// ✅ 78% smaller image in result.data

Automatic fallback: If WASM isn't available (edge cases), BertUI silently falls back to copying. Your builds never break.
🎯 What BertUI Is

A frontend framework that gives you everything React should have had from day one:

    ⚡ Sub-500ms dev starts - Faster than Vite, Next.js, and everything else

    🏗️ Sub-300ms builds - Production builds in the time others compile one file

    🏝️ Server Islands - Optional SSG for perfect SEO (one line of code)

    🦀 Rust image optimization - 78% smaller PNGs, pre-compiled WASM, zero Rust required

    📁 File-based routing - Just create files in pages/, that's it

    🗺️ Auto SEO - Sitemap and robots.txt generated automatically

    📘 TypeScript ready - Full type definitions, zero setup required

    🎨 CSS built-in - Global styles with LightningCSS optimization

    🔥 30ms HMR - Instant hot reloading that actually works

No webpack config. No babel setup. No framework fatigue. Just React, done right.
⚡ Performance That Matters

Real benchmarks on a 7-year-old laptop (Intel i3-2348M, 7.6GB RAM):
Metric  BertUI 1.1.7  Vite  Next.js Your Gain
Dev Server  494ms 713ms 2,100ms 1.4-4.3x faster ⚡
Prod Build  265ms 4,700ms 8,400ms 18-32x faster ⚡
Bundle Size 100KB 220KB 280KB 2.2-2.8x smaller ⚡
HMR Speed 30ms  85ms  120ms 2.8-4x faster ⚡
PNG Optimization  78% smaller 0%  0%  78% smaller 🦀
JPEG Optimization 75% smaller 0%  0%  75% smaller 🦀

If BertUI is this fast on old hardware, imagine what it does on yours. 🚀
🏝️ Server Islands: Perfect SEO, Zero Complexity

The problem: Every React framework makes you choose:

    ✅ Vite: Fast dev, ❌ terrible SEO (client-only)

    ✅ Next.js: Good SEO, ❌ slow builds + server required

    ✅ Gatsby: Perfect SEO, ❌ 45-second builds

BertUI's solution: Server Islands (optional SSG)
jsx

// src/pages/about.jsx

// 🏝️ Add ONE line to enable static generation
export const render = "server";

// 🎯 Optional: Add SEO metadata
export const title = "About Us";
export const description = "Learn about our team";

// ⚛️ Write normal React (no hooks, no event handlers)
export default function About() {
  return (
    <div>
      <h1>About Us</h1>
      <p>This page is pre-rendered as static HTML!</p>
    </div>
  );
}

At build time:

    ✅ Generates static HTML for instant loading

    ✅ Auto-adds to sitemap.xml

    ✅ Perfect SEO without SSR complexity

    ✅ Still builds in 265ms

🦀 Image Optimization (Just Works)

No configuration. No Rust installation. Just smaller images.
bash

# BertUI automatically optimizes images in src/images/
bun run build

text

📦 Building with Rust image optimizer...
  ✓ logo.png: 245KB → 54KB (78% saved)
  ✓ hero.jpg: 1.2MB → 312KB (75% saved)
  ✓ icon.webp: 89KB → 26KB (70% saved)
✅ Optimized 12 images, saved 3.4MB

Or use the API directly:
js

import { optimizeImage } from 'bertui/image-optimizer';

// Single image
const result = await optimizeImage(buffer, {
  format: 'png',
  quality: 80  // 0-100, default 80
});

// Batch processing
const results = await optimizeImagesBatch(images, 'webp');

📦 Installation
bash

# Create new app
bunx create-bertui my-app

# Start development
cd my-app
bun run dev

# Build for production (with image optimization)
bun run build

30 seconds from zero to running. No configuration required.
📁 Project Structure
text

my-app/
├── src/
│   ├── pages/
│   │   ├── index.jsx          # Route: /
│   │   ├── about.jsx          # Route: /about
│   │   └── blog/[slug].jsx    # Route: /blog/:slug
│   ├── components/             # Your React components
│   ├── styles/
│   │   └── global.css         # Automatically imported
│   ├── images/                 # 🦀 Auto-optimized at build time
│   │   ├── logo.png
│   │   └── hero.jpg
│   └── pages/                  # File-based routing
├── public/                     # Static assets
├── dist/                       # Production build
│   ├── sitemap.xml            # Auto-generated
│   ├── robots.txt             # Auto-generated
│   └── images/                # 🦀 Optimized images
└── package.json

🛣️ File-Based Routing

Just create files. BertUI handles the rest.
text

src/pages/index.jsx          →  /
src/pages/about.jsx          →  /about
src/pages/blog/index.jsx     →  /blog
src/pages/blog/[slug].jsx    →  /blog/:slug

Dynamic routes with TypeScript:
typescript

// src/pages/blog/[slug].tsx
import { useRouter } from 'bertui/router';

interface Params {
  slug: string;
}

export default function BlogPost() {
  const { params } = useRouter<Params>();
  return <h1>Post: {params.slug}</h1>;
}

⚙️ Configuration (Optional)
javascript

// bertui.config.js
export default {
  siteName: "My Site",
  baseUrl: "https://example.com", // Required for sitemap
  
  // Image optimization settings
  imageOptimizer: {
    quality: 80,      // JPEG/PNG quality (0-100)
    webpQuality: 75,  // WebP quality (0-100)
    stripMetadata: true // Remove EXIF data
  },
  
  robots: {
    disallow: ["/admin", "/api"],
    crawlDelay: 1
  }
};

📊 Comparison
Feature BertUI 1.1.7  Next.js Vite  Remix
Dev Server  494ms 2.1s  713ms 1.8s
Prod Build  265ms 8.4s  4.7s  6.2s
Bundle Size 100KB 280KB 220KB 250KB
Image Optimization  ✅ 78% smaller ❌ No  ❌ No  ❌ No
Server Islands  ✅ Built-in  ❌ No  ❌ No  ❌ No
Auto SEO  ✅ Yes ⚠️ Manual ❌ No  ⚠️ Manual
TypeScript  ✅ No setup  ✅ Config needed ✅ Config needed ✅ Config needed
Rust Required ❌ NO  N/A N/A N/A
🚀 Coming Soon

Future packages (in development):

    🔄 bertui-elysia - Full-stack addon (API routes, auth, database)

    🎨 bertui-animation - GPU-accelerated animations (Zig)

    📊 bertui-charts - High-performance charts (Rust)

🙏 Credits

    Runtime: Bun - The fastest JavaScript runtime

    Server: Elysia - Fast and elegant web framework

    CSS: LightningCSS - Lightning-fast CSS processing

    Image Optimization: oxipng, mozjpeg, webp - Rust libraries compiled to WASM

<div align="center">

Made with ⚡🦀🏝️ by the BertUI team

v1.1.7 - Rust image optimization, zero Rust required

Website • GitHub • npm
</div> ```