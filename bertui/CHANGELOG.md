# BertUI Changelog
# BertUI Changelog

## [1.1.7] - 2026-02-12

### 🦀 Rust-Powered Image Optimization
**78% smaller images. 20x faster than Sharp. Zero Rust required for users.**

#### ✨ New Features
- **WASM Image Optimizer:** Pre-compiled Rust optimizer ships with BertUI
  - PNG: 78% smaller via oxipng
  - JPEG: 75% smaller via mozjpeg  
  - WebP: 70% smaller via webp encoder
  - **No Rust installation needed** - WASM binaries included in
## [1.1.1] - 2026-01-03

### 🗺️ SEO Automation & TypeScript Support
**Complete production toolkit with automatic SEO and full TypeScript support**

#### ✨ New Features
- **Smart Sitemap Generation:** Automatic `sitemap.xml` generation from discovered routes
  - Extracts meta tags from page files for accurate descriptions
  - Intelligent priority calculation (homepage = 1.0, nested pages = 0.6-0.8)
  - Supports only static routes (dynamic routes excluded from sitemap)
  - Standards-compliant XML format with changefreq and lastmod

- **Configurable robots.txt:** Automated robots.txt creation with custom rules
  - Custom disallow paths for admin, API, or private pages
  - Crawl delay configuration for search engine rate limiting
  - Automatic sitemap reference inclusion
  - Simple configuration via `bertui.config.js`

- **Full TypeScript Support:** `.tsx` and `.ts` files now fully supported
  - Complete type definitions for BertUI API
  - Config type safety with IntelliSense
  - Router and component type safety
  - Gradual adoption - mix `.jsx` and `.tsx` in same project
  - Build system automatically handles TypeScript compilation

#### 🔧 Technical Improvements
- **Config System Upgrade:** Fixed config merging to preserve all user settings
- **Build Pipeline Integration:** Added sitemap and robots.txt generation steps
- **TypeScript Compilation:** Bun's native TypeScript support fully integrated
- **Better Error Handling:** Clear error messages for missing configuration

#### 📝 Configuration Example
```javascript
// bertui.config.js - Now with TypeScript autocomplete!
export default {
  siteName: "My Site",
  baseUrl: "https://example.com", // Required for sitemap
  
  robots: {
    disallow: ["/admin", "/api", "/dashboard"],
    crawlDelay: 1 // 1 second delay between requests
  }
};
```

#### 🚀 TypeScript Example
```typescript
// src/pages/blog/[slug].tsx - Full TypeScript support!
import { useRouter } from 'bertui/router';

interface BlogParams {
  slug: string;
}

export default function BlogPost() {
  const { params } = useRouter<BlogParams>();
  return <h1>Post: {params.slug}</h1>;
}
```

### 🎯 What This Enables
- ✅ **Zero-config SEO:** Sitemap and robots.txt generated automatically
- ✅ **Type Safety:** Full TypeScript support for production applications
- ✅ **Search Engine Optimization:** Proper indexing for all static pages
- ✅ **Production Readiness:** Complete toolkit for serious projects
- ✅ **Fast Builds:** All features with minimal build overhead (~116ms total)

---

## [1.1.0] - 2025-12-20

### 🏝️ Server Islands: Hybrid Architecture

#### ✨ Game-Changing Feature
- **Server Islands:** Optional static generation with `export const render = "server"`
- **Static HTML Extraction:** Build-time HTML generation for perfect SEO
- **Per-Page Control:** Mix server-rendered and client-only pages
- **Zero JavaScript Pages:** Static content pages with no client-side JS

#### 🔧 Technical Details
- Automatic detection of Server Island pages
- Static HTML extraction at build time
- Validation against React hooks and interactive features
- Fallback to client-only rendering when needed

---

## [1.0.2] - 2025-12-18

### 🎨 CSS Consolidation
- **Single CSS File:** All styles now combined into one `bertui.min.css` file
- **Simplified Asset Pipeline:** Single CSS reference in all HTML files
- **Performance:** Reduced HTTP requests for better loading performance

#### 📝 Note
Multiple CSS file support will return in a future release with enhanced bundling.

---

## [1.0.1] - 2025-12-17

### 🐛 Production Build Fix

#### Critical Bug Fixes
- **Fixed Production HTML Generation:** CSS files now properly linked in all generated HTML
- **Fixed Build Reliability:** Production builds correctly include all stylesheets
- **Improved Error Handling:** Better logging and error messages during build

#### ✅ What Works Now
- ✅ All CSS files from `dist/styles/` are linked in every HTML page
- ✅ Production builds work locally and on Vercel/Netlify
- ✅ No more "Flash of Unstyled Content" (FOUC)
- ✅ Stable v1.0.0 foundation with this critical patch

---

## [1.0.0] - 2025-12-17

### 🏁 The Stable Foundation

#### From Beta to Production
This release marks BertUI's transition from **public beta to stable production-ready software**. The previous 35 beta versions (v0.1.0 through v0.4.6) represented an intense, user-driven sprint to harden every core feature.

With v1.0.0, BertUI commits to Semantic Versioning. The core API is stable, and future changes will be carefully managed for compatibility.

#### ✨ What's Stable
- **Blazing Performance:** Compilation in milliseconds, HMR updates under 50ms
- **Zero-Config React:** Full JSX support with automatic React injection
- **File-Based Routing:** Intuitive routing via `src/pages/` directory
- **Complete Static Site Generation:** SEO-ready static HTML for every route
- **Robust Asset Pipeline:** Reliable image and static file handling
- **Built-in CSS Pipeline:** Global CSS with LightningCSS minification
- **Professional DX:** Error overlay, env vars, and clear logging

---

## Beta History (v0.1.0 - v0.4.7)

<details>
<summary>View Beta Phase Development</summary>

### [0.4.7] - Build System Overhaul
- Complete production build system
- Multi-route HTML generation
- Reliable asset pipeline

### [0.4.5] - Asset Pipeline Fix
- Fixed static asset copying to dist folder
- Improved recursive directory handling

### [0.4.2] - Developer Experience
- Full-screen error overlay
- Better stack traces and formatting

### [0.4.0] - Core Stability
- Fixed automatic React import injection
- Restored "Zero Config" promise

### [0.3.9] - External Support
- CSS import support
- External library compatibility
- Environment variable system

### [0.1.1] - Page Routing
- Integrated client-side routing
- Dynamic asset serving

### [0.1.0] - Initial Release
- Zero-configuration tooling
- Integrated dev server with HMR
- Optimized production builds
