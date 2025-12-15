## 0.1.4
attempt 1 of fixing 
``[16:20:57] [BertUI] ℹ️  INFO  Generated router.js
[16:20:57] [BertUI] ❌  ERROR  Compilation error: Bundle failed
[16:20:57] [BertUI] ❌  ERROR  Dev server failed: Bundle failed
error: script "dev" exited with code 1```

failed but i have hope for the next version 

## 0.1.3
fixed the 
``$ bertui dev
1 | })
2 | {
    ^
SyntaxError: export 'Link' not found in './src/router/router.js'
      at loadAndEvaluateModule (2:1)

Bun v1.3.4 (Windows x64)
error: script "dev" exited with code 1
``
error
## 0.1.2
fixed the known error of 
``$ bertui dev
error: Cannot find module './src/router/client-exports.js' from 'C:\Users\Pease Ernest\Desktop\amani stuff\my-new-app\node_modules\bertui\index.js'

Bun v1.3.4 (Windows x64)
error: script "dev" exited with code 1 ``
it should now work 

## 0.1.1 (2025-12-10) 🗺️ - Page Routing Implemented

This version delivers a major functional upgrade by integrating front-end routing, moving the library beyond static page serving.

### ✨ New Features

* **Integrated Page Routing:** The development server and build process now fully support client-side routing.
    * The template now uses **React Router DOM**  to manage navigation between pages.
    * Developers can now create multiple pages (`/src/pages/`) and define routes within the main application file.
* **Dynamic Asset Serving:** The dev server has been updated to correctly handle deep links and dynamic paths, ensuring the application loads correctly regardless of the URL.

### 🐛 Bug Fixes & Improvements
 - added routing 

## 0.1.0 (2025-12-10) 🚀 - Initial Release (Static)

This is the very first release of BertUI (Bun Elisiya React Template User Interface), providing the core tooling for a lightning-fast, zero-configuration React experience.

### ✨ New Features

* **Zero-Configuration Tooling:** Automatically supports **JavaScript/JSX** and **TypeScript/TSX** files natively via Bun.
* **Integrated Development Server:** Starts with the command `bertui dev`, powered by **Elysia** for near-instant startup, featuring built-in **Hot Module Replacement (HMR)** via WebSockets.
* **Optimized Production Build:** Creates a production-ready static build using the command `bertui build`, leveraging **Bun's native bundler** and **PostCSS** for CSS optimization (autoprefixer/minification).
* **Built-in Animation Utilities:** Includes high-quality, lightweight CSS utilities accessible via ``.
    * Classes include: `.fadein`, `.moveright`, `.bouncein`, `.split`, `.slideup`, and others.

### ⚠️ Known Limitations

* **Static Pages Only:** This version was limited to serving a single static HTML file and did not support front-end routing (addressed in v0.1.1).

### 📦 Installation & Setup

* **`create-bertui`:** Use `bunx create-bertui <app-name>` to set up a new BertUI project template instantly.

