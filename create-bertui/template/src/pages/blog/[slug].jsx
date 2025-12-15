// src/pages/blog/[slug].jsx
import { Link } from 'bertui/router';

const posts = {
  'getting-started': {
    title: 'Getting Started with BertUI',
    date: 'Jan 15, 2024',
    readTime: '5 min',
    content: `BertUI makes it incredibly easy to build fast React applications. Simply run bunx create-bertui my-app and you're ready to go! The file-based routing system means you can start building pages immediately without any configuration.`
  },
  'routing-guide': {
    title: 'Mastering File-based Routing',
    date: 'Jan 20, 2024',
    readTime: '8 min',
    content: `BertUI's routing system is inspired by Next.js but optimized for Bun's speed. Create dynamic routes using [param] syntax. Access params in your component via props. Every route is automatically code-split for optimal performance.`
  },
  'animations': {
    title: 'Building Fast Apps',
    date: 'Jan 25, 2024',
    readTime: '6 min',
    content: `BertUI is built for speed. With Bun's native performance, hot module replacement, and automatic code splitting, your apps will be lightning fast. Focus on building features, not configuring tools.`
  }
};

export default function BlogPost({ params }) {
  const post = posts[params.slug];
  
  if (!post) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Post Not Found
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          The blog post you're looking for doesn't exist.
        </p>
        <Link to="/blog" style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          background: '#10b981',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: '500'
        }}>
          ← Back to Blog
        </Link>
      </div>
    );
  }
  
  return (
    <article style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        {post.title}
      </h1>
      
      <div style={{ 
        display: 'flex',
        gap: '1rem',
        color: '#6b7280',
        marginBottom: '2rem',
        fontSize: '0.875rem'
      }}>
        <span>📅 {post.date}</span>
        <span>⏱️ {post.readTime}</span>
      </div>
      
      <div style={{ 
        fontSize: '1.125rem',
        lineHeight: '1.8',
        color: '#374151'
      }}>
        {post.content}
      </div>
      
      <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
        <Link to="/blog" style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          background: '#10b981',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: '500'
        }}>
          ← Back to Blog
        </Link>
      </div>
    </article>
  );
}