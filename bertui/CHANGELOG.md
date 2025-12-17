## 0.3.9 (Latest)
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