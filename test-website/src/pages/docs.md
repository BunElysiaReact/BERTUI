# 📚 BertUI Documentation

This is a markdown file that imports and uses React components!

```import { Counter } from '../components/Counter.jsx'```

## Introduction

Welcome to the BertUI documentation. Here you can learn how to use all the amazing features of this framework.

## Interactive Demo

Below is a live React component imported directly into this markdown file:

<Counter />

## Getting Started

1. Install BertUI: `bunx create-bertui my-app`
2. Create pages in `src/pages/`
3. Run `bun run dev`

## Features

| Feature | Description |
|---------|-------------|
| File Routing | Automatic routes from files |
| Markdown | Write content in .md files |
| Components | Import JSX into MD files |
| Server Islands | Static rendering for SEO |

## Code Blocks

```tsx
// TypeScript example
interface Props {
  name: string;
}

export default function Hello({ name }: Props) {
  return <h1>Hello, {name}!</h1>;
}
```

## Links

- [Home Page](/)
- [About](/about)
- [Blog](/blog)

---

*Built with ⚡ BertUI*
