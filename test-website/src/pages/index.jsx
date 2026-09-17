import React from 'react';

export const title = 'Welcome to BertUI';

export default function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '3rem', color: '#667eea' }}>⚡ BertUI</h1>
      <p style={{ fontSize: '1.5rem', margin: '1rem 0' }}>
        Lightning-fast React framework powered by Bun
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
        <a 
          href="/about" 
          style={{
            padding: '0.75rem 1.5rem',
            background: '#667eea',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}
        >
          About Page
        </a>
        <a 
          href="/blog" 
          style={{
            padding: '0.75rem 1.5rem',
            background: '#f472b6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}
        >
          Blog (Markdown)
        </a>
        <a 
          href="/docs" 
          style={{
            padding: '0.75rem 1.5rem',
            background: '#34d399',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}
        >
          Docs (MDX-style)
        </a>
      </div>
    </div>
  );
}
