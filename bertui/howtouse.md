# 📘 **BUNNY INTEGRATION GUIDE: BertUI as Headless Engine**

## 🎯 **THE VISION**

```
┌─────────────────────────────────────────────────────────────┐
│                         BUNNY                               │
│  (Meta-Framework - Your App's Brain)                       │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ File Router │  │  Compiler   │  │   Server Islands    │ │
│  │  (BertUI)   │  │  (BertUI)   │  │     (BertUI)        │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                    │            │
│         └────────────────┼────────────────────┘            │
│                          ▼                                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                     ELYSIA                          │  │
│  │  (The Server - Ultra Fast HTTP/WebSocket)          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  🚀 Result: Bun + Elysia + BertUI = Fastest React Stack   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔥 **PATTERN 1: THE "WRAP EVERYTHING" APPROACH**

```typescript
// bunny/src/core/bunny.ts
import { Elysia } from 'elysia';
import { 
  compileProject,        // BertUI compiler
  discoverRoutes,        // File-based routing
  generateRouterCode,    // Router generation
  createDevHandler,      // BertUI request handler
  minifyCSS,            // CSS processing
  copyImagesSync,       // Image handling
  extractStaticHTML,    // Server Islands
  loadConfig           // BertUI config
} from 'bertui';

export class Bunny {
  private app: Elysia;
  private bertui: any;
  private routes: any[] = [];
  
  constructor(private root: string = process.cwd()) {}
  
  // STEP 1: Initialize - Compile everything
  async init() {
    // Load BertUI config
    this.config = await loadConfig(this.root);
    
    // Compile all JSX/TSX files
    await compileProject(this.root);
    
    // Discover file-based routes
    this.routes = await discoverRoutes('./src/pages');
    
    return this;
  }
  
  // STEP 2: Mount BertUI static handlers
  mountBertUI() {
    // Create BertUI's headless handler
    this.bertui = await createDevHandler({
      root: this.root,
      port: this.config.port || 3000
    });
    
    // Mount ALL BertUI routes to Elysia
    this.app.get('*', async ({ request }) => {
      const response = await this.bertui.handleRequest(request);
      if (response) return response;
    });
    
    return this;
  }
  
  // STEP 3: Add your Elysia plugins
  mountElysiaPlugins() {
    // Elysia WebSocket
    this.app.ws('/ws', {
      message(ws, message) {
        // Your custom WebSocket logic
      }
    });
    
    // Elysia CORS
    this.app.use(cors());
    
    // Elysia JWT
    this.app.use(jwt({ secret: process.env.JWT_SECRET }));
    
    return this;
  }
  
  // STEP 4: Add your API routes
  mountAPI() {
    this.app
      .get('/api/health', () => ({ status: 'ok' }))
      .post('/api/users', async ({ body }) => {
        // Your database logic
        return { id: 1, ...body };
      });
    
    return this;
  }
  
  // STEP 5: Server Islands with Elysia SSR
  mountServerIslands() {
    for (const route of this.routes) {
      if (route.isServerIsland) {
        const sourceCode = await Bun.file(route.path).text();
        const staticHTML = extractStaticHTML(sourceCode, route.path);
        
        if (staticHTML) {
          // Pre-render at build time
          this.app.get(route.route, () => {
            return new Response(
              `<!DOCTYPE html>
               <html>
                 <body>
                   <div id="root">${staticHTML}</div>
                   <script type="module" src="/compiled/main.js"></script>
                 </body>
               </html>`,
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
        }
      }
    }
    
    return this;
  }
  
  // STEP 6: Start the server
  start(port: number = 3000) {
    this.app.listen(port, () => {
      console.log(`🐰 Bunny running on http://localhost:${port}`);
      console.log(`   🔧 BertUI engine: ${this.routes.length} routes`);
      console.log(`   ⚡ Elysia server: ${Bun.version}`);
    });
    
    return this.app;
  }
}

// Export for users
export const createBunny = async () => {
  const bunny = new Bunny();
  await bunny.init();
  return bunny;
};
```

---

## 🔥 **PATTERN 2: THE "MIDDLEWARE CHAIN" APPROACH**

```typescript
// bunny/src/middleware/bertui.ts
// Pure Elysia middleware that uses BertUI

import { Elysia } from 'elysia';
import { 
  handleRequest, 
  compileProject,
  discoverRoutes 
} from 'bertui';

let isCompiled = false;
let routes: any[] = [];

export const bertui = (options: { root?: string } = {}) => {
  const root = options.root || process.cwd();
  
  return new Elysia({ name: 'bertui' })
    .state('bertui', {
      root,
      compiled: false,
      routes: []
    })
    .derive(async ({ store }) => {
      // One-time compilation
      if (!isCompiled) {
        await compileProject(root);
        routes = await discoverRoutes('./src/pages');
        isCompiled = true;
        store.bertui.compiled = true;
        store.bertui.routes = routes;
      }
      
      return {
        bertuiRoutes: routes,
        isBertuiCompiled: true
      };
    })
    .get('*', async ({ request, store }) => {
      // Let BertUI handle the request
      const response = await handleRequest(request, { root });
      if (response) return response;
    });
};

// Usage in user's Elysia app:
// app.use(bertui({ root: './my-app' }))
```

---

## 🔥 **PATTERN 3: THE "BUILD PIPELINE" APPROACH**

```typescript
// bunny/src/build/pipeline.ts
// Production build system using BertUI as engine

import { 
  buildProduction,        // Full BertUI build
  minifyCSS,             // Individual CSS minification
  copyImagesSync,        // Individual image copying
  generateRouterCode,    // Generate router only
  transformJSX          // Transform single file
} from 'bertui';

export class BunnyBuildPipeline {
  // OPTION A: Use BertUI's full build system
  async fullBuild() {
    // This does EVERYTHING BertUI does
    // - Compiles all files
    // - Processes CSS
    // - Copies images
    // - Generates HTML with Server Islands
    // - Creates sitemap/robots.txt
    return await buildProduction({ root: process.cwd() });
  }
  
  // OPTION B: Use BertUI as one part of your custom build
  async customBuild() {
    // 1. BertUI compiles React to JS
    await compileProject(process.cwd());
    
    // 2. Your custom CSS framework
    const tailwindCSS = await this.runTailwind();
    const minified = await minifyCSS(tailwindCSS);
    
    // 3. Your custom image CDN upload
    const images = copyImagesSync('./src/images', './.cache/images');
    await this.uploadToCDN(images);
    
    // 4. BertUI generates the router
    const routes = await discoverRoutes('./src/pages');
    const routerCode = generateRouterCode(routes);
    
    // 5. Your custom deployment
    return await this.deploy();
  }
}

// Usage in bunny build command:
// const pipeline = new BunnyBuildPipeline();
// await pipeline.customBuild();
```

---

## 🔥 **PATTERN 4: THE "HYBRID SSR" APPROACH (Server Islands + Elysia)**

```typescript
// bunny/src/ssr/hybrid.ts
// The magic: Server Islands at build time + Elysia SSR at runtime

import { Elysia } from 'elysia';
import { 
  extractStaticHTML,
  isServerIsland,
  discoverRoutes,
  compileProject
} from 'bertui';
import { renderToString } from 'react-dom/server';
import React from 'react';

export class HybridSSR {
  private staticPages: Map<string, string> = new Map();
  private dynamicPages: Map<string, any> = new Map();
  
  async build() {
    // 1. Compile everything
    await compileProject(process.cwd());
    
    // 2. Discover routes
    const routes = await discoverRoutes('./src/pages');
    
    // 3. Split into static vs dynamic
    for (const route of routes) {
      const sourceCode = await Bun.file(route.path).text();
      
      if (isServerIsland(sourceCode)) {
        // BertUI extracts pure static HTML
        const staticHTML = extractStaticHTML(sourceCode, route.path);
        this.staticPages.set(route.route, staticHTML);
      } else {
        // Elysia does runtime SSR
        this.dynamicPages.set(route.route, route);
      }
    }
    
    return this;
  }
  
  mount(app: Elysia) {
    // Serve static pages (blazing fast - no React runtime)
    for (const [path, html] of this.staticPages) {
      app.get(path, () => {
        return new Response(
          `<!DOCTYPE html>
           <html>
             <body>
               <div id="root">${html}</div>
               <script type="module" src="/compiled/main.js"></script>
             </body>
           </html>`,
          { headers: { 'Content-Type': 'text/html' } }
        );
      });
    }
    
    // Serve dynamic pages (Elysia SSR)
    for (const [path, route] of this.dynamicPages) {
      app.get(path, async () => {
        // Import the component
        const module = await import(route.path);
        const Component = module.default;
        
        // Render to string at REQUEST TIME
        const html = renderToString(React.createElement(Component));
        
        return new Response(
          `<!DOCTYPE html>
           <html>
             <body>
               <div id="root">${html}</div>
               <script type="module" src="/compiled/main.js"></script>
             </body>
           </html>`,
          { headers: { 'Content-Type': 'text/html' } }
        );
      });
    }
    
    return app;
  }
}

// 🏝️ STATIC: BertUI Server Islands
// ⚡ DYNAMIC: Elysia runtime SSR
// 🔥 BEST OF BOTH WORLDS
```

---

## 🔥 **PATTERN 5: THE "PLUGIN ECOSYSTEM" APPROACH**

```typescript
// bunny/plugins/bertui-icons.ts
// BertUI plugin system - use BertUI packages with Elysia

import { Elysia } from 'elysia';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

export const bertuiIcons = (options: { prefix?: string } = {}) => {
  const prefix = options.prefix || '/icons';
  
  return new Elysia({ name: 'bertui-icons' })
    .get(`${prefix}/:name`, async ({ params }) => {
      // Serve BertUI icons directly from node_modules
      const iconPath = join(
        process.cwd(),
        'node_modules/bertui-icons/generated',
        `${params.name}.svg`
      );
      
      const icon = Bun.file(iconPath);
      if (await icon.exists()) {
        return new Response(icon, {
          headers: { 'Content-Type': 'image/svg+xml' }
        });
      }
      
      return new Response('Icon not found', { status: 404 });
    });
};

// bunny/plugins/bertui-animate.ts
export const bertuiAnimate = () => {
  return new Elysia({ name: 'bertui-animate' })
    .get('/css/bertui-animate.css', async () => {
      const cssPath = join(
        process.cwd(),
        'node_modules/bertui-animate/dist/bertui-animate.min.css'
      );
      
      const css = Bun.file(cssPath);
      return new Response(css, {
        headers: { 'Content-Type': 'text/css' }
      });
    });
};

// Usage in Bunny:
// app.use(bertuiIcons({ prefix: '/assets/icons' }))
// app.use(bertuiAnimate())
```

---

## 🎯 **THE DREAM: ONE LINE SETUP**

```typescript
// bunny/index.ts
import { Elysia } from 'elysia';
import { bertui } from '@bunnyjs/plugin-bertui';

const app = new Elysia()
  .use(bertui())                    // BertUI file-based routing
  .use(cors())                      // Elysia CORS
  .use(jwt({ secret: 'secret' }))   // Elysia JWT
  .ws('/ws', {                      // Elysia WebSocket
    message(ws, message) {
      ws.send(message);
    }
  })
  .get('/api/health', () => ({ status: 'ok' }))
  .listen(3000);

console.log('🚀 Bunny + BertUI + Elysia');
```

---

## 📦 **WHAT BUNNY EXPORTS TO USERS**

```typescript
// bunny/src/index.ts
export { createBunny } from './core/bunny';
export { bertui } from './middleware/bertui';
export { HybridSSR } from './ssr/hybrid';

// Re-export BertUI for convenience
export { 
  transformJSX,
  minifyCSS,
  copyImagesSync,
  extractStaticHTML,
  validateServerIsland,
  generateRouterCode,
  discoverRoutes
} from 'bertui';

// Re-export Elysia
export { Elysia, t } from 'elysia';
```

---

## 💎 **THE VALUE PROPOSITION**

| **Without Bunny** | **With Bunny** |
|-------------------|----------------|
| `bertui dev` - Bun.serve | `bunny dev` - Elysia + WebSocket + JWT + DB |
| Manual Elysia integration | Zero-config Elysia + BertUI |
| CSS = Lightning CSS only | CSS = Tailwind + Lightning CSS |
| Images = Copy only | Images = Sharp + CDN upload |
| Server Islands = Static only | Server Islands + Elysia SSR hybrid |
| No API routes | Built-in API routes with Elysia |
| No database | Prisma/Drizzle integration |
| No auth | JWT/Clerk/Auth0 plugins |

---

## 🚀 **BUNNY'S MESSAGE TO BERTUI TEAM:**

> *"We're not replacing you. We're **amplifying** you.*
>
> *BertUI is the best React compiler + file router on Bun.*
> *Elysia is the fastest web framework on Bun.*
>
> *Bunny is the bridge that makes them fall in love.*
>
> *With these headless exports, we can:*
> - *Use BertUI's compiler pipeline inside Elysia*
> - *Add database, auth, WebSockets, and APIs*
> - *Keep your Server Islands + add hybrid SSR*
> - *Let users keep their `bertui dev` if they want*
>
> *This isn't a fork. This isn't a replacement.*
> *This is BertUI + Elysia = **The Ultimate Bun Stack**.*
>
> *Thank you for making BertUI modular. Now let's build the future."*

---

**Ready to ship Bunny v0.0.1-beta.** 🐰
