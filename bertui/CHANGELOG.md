# BertUI Changelog

---
## [1.2.2] - 2026-03-09

### Import Aliases
- Added `importhow` config option for defining custom import aliases
- Aliases are resolved at compile time with zero runtime overhead
- Supports deep imports such as `import Button from 'amani/button'`

```javascript
// bertui.config.js
export default {
  importhow: {
    amani: '../components',
    ui:    '../components/ui',
  }
}
```
### CLI
- Replaced verbose line-by-line logs with a compact step-based progress display
- Added large block-letter BERTUI header with "by Pease Ernest" on every command
- Build and dev now show a clean summary at the end instead of scattered output
- All debug-level logs are written silently to `.bertui/dev.log`

### Dev Server
- New packages installed via `bun add` are now picked up automatically
- The dev server watches `package.json` for changes and rebuilds the import map
- Browser reloads automatically when new packages are detected — no server restart needed

### Node Modules
- All installed packages now work out of the box without any configuration
- Dev server maps node_modules to the local filesystem automatically
- Production builds bundle and tree-shake packages with Bun's optimizer
- Only packages you actually import are included in the output

### Build
- Added `dist/import-map.json` for browser package resolution
- Added `minify.syntax`, `minify.whitespace`, and `minify.identifiers` for full tree-shaking
- Added `splitting: true` for automatic shared chunk extraction
- Fixed bundle error caused by bare specifier rewriting conflicting with Bun's external list

---

## [1.1.1] - 2026-01-03

### SEO
- Automatic `sitemap.xml` generation from discovered routes
- Automatic `robots.txt` generation with configurable disallow rules and crawl delay
- Both require `baseUrl` in `bertui.config.js`

### TypeScript
- Full support for `.tsx` and `.ts` files
- Mix `.jsx` and `.tsx` in the same project freely
- TypeScript compiled natively via Bun

---

## [1.1.0] - 2025-12-20

### Server Islands
- Added `export const render = "server"` to opt a page into static generation at build time
- Static HTML is extracted and embedded in the HTML file for instant content and better SEO
- Pages with hooks or event handlers are rejected at build time with a clear error
- All other pages remain client-only by default

---

## [1.0.2] - 2025-12-18

### Build
- All styles now combined into a single `bertui.min.css` file
- Reduced HTTP requests on page load

---

## [1.0.1] - 2025-12-17

### Bug Fixes
- Fixed CSS files not being linked in production HTML
- Fixed flash of unstyled content on production deploys

---

## [1.0.0] - 2025-12-17

First stable release. Commits to semantic versioning from this point forward.

- File-based routing via `src/pages/`
- JSX support with automatic React import injection
- HMR under 50ms
- LightningCSS minification
- Error overlay in dev
- Environment variable support
- Static site generation for all routes

---

## Beta (v0.1.0 – v0.4.7)

<details>
<summary>View beta history</summary>

- **0.4.7** — Complete production build system, multi-route HTML generation
- **0.4.5** — Fixed static asset copying to dist
- **0.4.2** — Full-screen error overlay with stack traces
- **0.4.0** — Fixed automatic React import injection
- **0.3.9** — CSS imports, external library support, environment variables
- **0.1.1** — Client-side routing, dynamic asset serving
- **0.1.0** — Initial release: dev server, HMR, production builds

</details>