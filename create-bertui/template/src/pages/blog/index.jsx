import { Link } from 'bertui/router';
import '../styles/blog.css';

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
    slug: 'performance',
    title: 'Building Fast Apps',
    excerpt: 'Tips and tricks for maximum performance.',
    date: 'Jan 25, 2024',
    readTime: '6 min'
  }
];

export default function Blog() {
  return (
    <div className="blog-container">
      <h1 className="blog-title">Blog</h1>
      
      <div className="blog-posts">
        {posts.map((post) => (
          <article key={post.slug} className="blog-post">
            <h2 className="blog-post-title">
              <Link to={`/blog/${post.slug}`} className="blog-post-link">
                {post.title}
              </Link>
            </h2>
            
            <p className="blog-post-excerpt">{post.excerpt}</p>
            
            <div className="blog-post-meta">
              <span>📅 {post.date}</span>
              <span>⏱️ {post.readTime}</span>
            </div>
          </article>
        ))}
      </div>
      
      <div className="blog-back">
        <Link to="/" className="btn btn-back">← Back to Home</Link>
      </div>
    </div>
  );
}