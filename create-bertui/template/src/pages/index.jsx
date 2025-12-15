// src/pages/index.jsx
import { Link } from 'bertui/router';

export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        Welcome to BertUI!
      </h1>
      
      <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '2rem' }}>
        Lightning-fast React development powered by Bun ⚡
      </p>
      
      <nav style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/about" style={{
          padding: '0.75rem 1.5rem',
          background: '#10b981',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none'
        }}>
          About
        </Link>
        
        <Link to="/blog" style={{
          padding: '0.75rem 1.5rem',
          background: '#3b82f6',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none'
        }}>
          Blog
        </Link>
      </nav>
    </div>
  );
}