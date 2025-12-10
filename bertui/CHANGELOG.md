## 1.0.0 (2025-12-10) 🚀 - Initial Stable Release

This is the first stable release of BertUI (Bun Elisiya React Template User Interface), a lightning-fast, zero-configuration development and build tool for React applications. BertUI leverages the speed of the **Bun runtime** and the lightweight efficiency of the **Elysia** server framework.

### ✨ New Features

* **Zero-Configuration Tooling:** Automatically supports **JavaScript**, **JSX**, **TypeScript**, and **TSX** files without any user configuration (`tsconfig.json` or Babel).
* **Integrated Development Server:** Starts with the command `bertui dev`.
    * Powered by the **Elysia** framework running on Bun for near-instant startup.
    * Features built-in **Hot Module Replacement (HMR)** via WebSockets for rapid, live code updates.
* **Optimized Production Build:** Creates a production-ready static build using the command `bertui build`.
    * Leverages **Bun's native bundler** for incredibly fast JavaScript/React compilation and minification.
    * Includes **PostCSS** for automatically applying vendor prefixes (Autoprefixer) and minifying all CSS.
* **Built-in Animation Utilities:** Includes a set of high-quality, lightweight CSS utility classes accessible via `import 'bertui/styles'`.
    * Initial classes include: `.fadein`, `.moveright`, `.bouncein`, `.split`, `.slideup`, and others.

### ⚠️ Known Limitations

* **Static Pages Only:** This version **does not include built-in routing support**. The development server currently serves a single static HTML file (`index.html`) that mounts the React application.
    * *The upcoming version is prioritized to include full routing capabilities.*

### 🔨 Core Improvements

* **Bun Runtime Requirement:** Fully optimized for and requires the **Bun runtime** (`>=1.0.0`).
* **Module System:** The core library and template are configured for **ES Modules (ESM)** by default.
* **Custom CLI:** Provides a simple, single executable interface (`bertui`) for all development tasks.

### 📦 Installation & Setup

This release is paired with the companion scaffolding tool:

* **`create-bertui`:** Use `bunx create-bertui <app-name>` to set up a new BertUI project template instantly.
