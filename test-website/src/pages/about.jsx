import React from 'react';

export const render = "static";
export const title = 'About BertUI';

export default function About() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#667eea', fontSize: '2.5rem' }}>About BertUI</h1>
      
      <section style={{ margin: '2rem 0' }}>
        <h2>What is BertUI?</h2>
        <p>
          BertUI is a zero-config React framework powered by Bun that makes building 
          websites incredibly fast and simple. It features file-based routing, 
          Server Islands, and a build system that gets out of your way.
        </p>
      </section>

      <section style={{ margin: '2rem 0' }}>
        <h2>Key Features</h2>
        <ul style={{ lineHeight: '2' }}>
          <li>⚡ Blazing fast dev server with HMR</li>
          <li>📁 File-based routing</li>
          <li>🏝️ Server Islands for static content</li>
          <li>📝 Markdown support with component imports</li>
          <li>🎨 CSS support with LightningCSS</li>
          <li>📦 Node modules work out of the box</li>
          <li>🔍 SEO-friendly with automatic sitemap</li>
        </ul>
      </section>

      <section style={{ margin: '2rem 0', padding: '1.5rem', background: '#f9fafb', borderRadius: '8px' }}>
        <h2>Why Choose BertUI?</h2>
        <p>
          Unlike Vite or Next.js, BertUI requires zero configuration to get started. 
          Just create your pages in the src/pages directory and go! The unified 
          React bundler handles everything automatically.
        </p>
      </section>
    </div>
  );
}
