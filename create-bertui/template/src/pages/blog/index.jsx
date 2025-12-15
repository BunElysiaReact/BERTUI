// src/pages/blog/index.jsx
import { Link } from 'bertui/router';

const posts = [
  {
    slug: 'getting-started',
    title: 'Getting Started with BertUI',
    excerpt: 'Learn how to create your first BertUI application in minutes.',
    date: 'Jan 15, 2024',
    readTime: '5 min'
  },
  {
    slug: 'routing-guide',
    title: 'Mastering File-based Routing',
    excerpt: 'Deep dive into BertUI\'s powerful routing system.',
    date: 'Jan 20, 2024',
    readTime: '8 min'
  },
  {
    slug: 'animations',
    title: 'Building Fast Apps',
    excerpt: 'Tips and tricks for maximum performance.',
    date: 'Jan 25, 2024',
    readTime: '6 min'
  }
];

export default function Blog() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
        Blog
      </h1>
      
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {posts.map((post) => (
          <article 
            key={post.slug}
            style={{ 
              padding: '2rem',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s'
            }}
          >
            <h2 style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }}>
              <Link 
                to={`/blog/${post.slug}`}
                style={{ 
                  color: '#1f2937',
                  textDecoration: 'none'
                }}
              >
                {post.title}
              </Link>
            </h2>
            
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              {post.excerpt}
            </p>
            
            <div style={{ 
              display: 'flex', 
              gap: '1rem',
              fontSize: '0.875rem',
              color: '#9ca3af'
            }}>
              <span>📅 {post.date}</span>
              <span>⏱️ {post.readTime}</span>
            </div>
          </article>
        ))}
      </div>
      
      <div style={{ marginTop: '3rem' }}>
        <Link to="/" style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          background: '#10b981',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: '500'
        }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}