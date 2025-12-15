# Installation

Get BertUI up and running in seconds.

## Prerequisites

You need [Bun](https://bun.sh) installed on your system:

```bash
curl -fsSL https://bun.sh/install | bash
```

Verify installation:

```bash
bun --version
# Should output: 1.x.x or higher
```

## Create New Project

Use the official scaffolding tool:

```bash
bunx create-bertui my-awesome-app
```

This creates a new BertUI project with:
- Pre-configured file structure
- Sample pages with routing
- Beautiful example components
- All dependencies installed

## Project Structure

```
my-awesome-app/
├── public/              # Static assets
│   └── favicon.svg
├── src/
│   ├── pages/          # File-based routes
│   │   ├── index.jsx   # Home page
│   │   ├── about.jsx   # About page
│   │   └── blog/       # Blog section
│   ├── components/     # Reusable components
│   └── styles/         # Global styles
├── package.json
└── bertui.config.js    # Optional config
```

## Start Development

```bash
cd my-awesome-app
bun run dev
```

Your dev server starts instantly at [http://localhost:3000](http://localhost:3000)

## Next Steps

- [Create your first page](./first-page.html)
- [Learn about routing](../guides/routing.html)
- [Add animations](../guides/animations.html)
