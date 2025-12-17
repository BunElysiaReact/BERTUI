# BertUI Changelog
# Changelog
## 1.0.2 we will make all minified css to 1 universal css file and am done 
## 1.0.1 - Production Build Fix (2025-12-17)

### 🐛 Critical Bug Fixes
- **Fixed Production HTML Generation:** CSS files are now properly linked in all generated HTML files
- **Fixed Build Reliability:** Production builds now correctly include all stylesheets
- **Improved Error Handling:** Better logging and error messages during build process

### ✅ What Works Now
- ✅ All CSS files from `dist/styles/` are linked in every HTML page
- ✅ Production builds work locally and on Vercel/Netlify
- ✅ No more "Flash of Unstyled Content" (FOUC)
- ✅ Stable v1.0.0 foundation with this critical patch

### 🔧 Technical Details
- Fixed `generateProductionHTML` function to read CSS from correct location
- Ensured all `.min.css` files are included in every page
- Improved build logging for debugging
## 1.0.0 - "Foundation" (2025-12-17)

### 🏁 The Beta Journey Culminates
This release marks BertUI's transition from **public beta to stable production-ready software**. The previous 35 beta versions (v0.1.0 through v0.4.6) represented an intense, user-driven sprint to harden every core feature. That phase is now complete.

With v1.0.0, BertUI commits to Semantic Versioning. The core API is stable, and future changes will be carefully managed for compatibility.

### ✨ What's New & Stable
All the speed, zero-config philosophy, and features from the beta are now solidified:

*   **Blazing Performance:** Compilation in milliseconds, HMR updates under 50ms, and a dev server start under 100ms.
*   **Zero-Config React:** Full JSX/TSX support with automatic React injection. Just write components.
*   **File-Based Routing:** Intuitive routing via the `src/pages/` directory.
*   **Complete Static Site Generation:** Production builds create optimized, SEO-ready static HTML for every route.
*   **Robust Asset Pipeline:** Reliable copying of images from `src/images/` and `public/`.
*   **Built-in CSS Pipeline:** Global and component-scoped CSS with LightningCSS minification.
*   **Professional DX:** Full-screen error overlay, environment variable support, and clear logging.

### ✅ Resolved from Beta
The critical issues reported during the beta are now closed:
*   Fixed automatic React import injection.
*   Fixed static asset copying for production builds.
*   Fixed HTML file generation for all routes.
*   Added comprehensive error overlay.

### 🚀 Getting Started
New users should start here. The foundational API is stable for production use.

**Previous Beta Versions:** The changelog for the rapid iteration phase (v0.1.0 - v0.4.6) is preserved below for transparency.
<hr>

## 0.4.7 (Latest Beta) - Build System Overhaul
### ✨ New Features
- **Complete Production Build:** Full static site generation with SEO-optimized HTML for all routes
- **Multi-Route HTML Generation:** Automatic HTML file creation for discovered routes with proper meta tags
- **Reliable Asset Pipeline:** Robust static file copying from both `/src/images/` and `/public/` directories
- **Build Logging:** Enhanced build progress and debugging information

### 🐛 Bug Fixes
- Fixed production build hanging on WASM image optimization
- Resolved missing HTML file generation in dist folder
- Fixed recursive directory structure for production builds
- Improved build reliability and error handling
- Fixed asset copying for nested image directories

### 🔧 Internal Improvements
- Simplified image optimization (switched to reliable file copying)
- Enhanced build configuration with better defaults
- Improved error reporting during compilation

## 0.4.5 - Asset Pipeline Fix
### 🐛 Bug Fixes
- **Critical Fix:** Static assets now correctly copy to dist folder during build
- Fixed recursive directory copying for images and other assets
- Improved logging for asset copying process
- Resolved empty `dist/images/` directory issue

## 0.4.2 - Developer Experience
### ✨ New Features
- **Error Overlay:** Full-screen error overlay for compilation and runtime errors
- **Better Stack Traces:** Improved error message formatting and file references
- **Enhanced HMR:** More reliable hot module replacement with visual feedback

## 0.4.0 - Core Stability
### 🐛 Bug Fixes
- **Critical Fix:** Automatic React import injection now works correctly
- Fixed JSX transpilation without manual React imports
- Restored "Zero Config" promise for React development
- Resolved `ReferenceError: React is not defined` errors

## 0.3.9
### ✨ New Features
- **CSS Import Support:** Templates now properly support external CSS imports
- **External Library Support:** Full support for importing external libraries (loggers, utilities, etc.)
- **Environment Variables:** Complete `.env` file support with `BERTUI_` and `PUBLIC_` prefixes
- **Build Improvements:** Enhanced production build process with better optimization

### 🐛 Bug Fixes
- Fixed CSS import handling in compilation process
- Resolved CSS file serving in dev server
- Fixed environment variable injection
- Improved error handling across the board

### 📝 Notes
Versions 0.1.5 - 0.3.8 involved numerous bug fixes and stability improvements as we worked through:
- CSS compilation edge cases
- Router import resolution
- Build process optimization
- Dev server stability
- HMR reliability

## 0.1.4
Attempted fix for router compilation errors. Fixed in later versions.

## 0.1.3
Fixed export 'Link' not found error in router.js

## 0.1.2
Fixed missing client-exports.js module error

## 0.1.1 (2025-12-10) 🗺️ - Page Routing Implemented
### ✨ New Features
* **Integrated Page Routing:** Full support for client-side routing with React Router DOM
* **Dynamic Asset Serving:** Dev server handles deep links and dynamic paths

### 🐛 Bug Fixes & Improvements
- Added file-based routing support

## 0.1.0 (2025-12-10) 🚀 - Initial Release (Static)
### ✨ New Features
* **Zero-Configuration Tooling:** Native JSX/TSX support via Bun
* **Integrated Development Server:** HMR via WebSockets
* **Optimized Production Build:** Static builds with PostCSS optimization
* **Built-in Animation Utilities:** CSS animation classes (temporarily unavailable in current version)

### 📦 Installation & Setup
* **`create-bertui`:** Use `bunx create-bertui <app-name>` for instant setup

---

**Note:** Version 0.4.7 represents a significant milestone where all critical bugs from the beta phase have been resolved. The framework is now stable and production-ready for static site generation with React.

**Status:** Beta - Ready for production use