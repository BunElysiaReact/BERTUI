// ==========================================
// docs/tutorials/blog.md
// ==========================================
# Build a Blog

Let's build a simple blog with BertUI.

## Step 1: Create Pages

Create these files:

```
src/pages/blog/
├── index.jsx      # Blog list
└── [slug].jsx     # Individual post
```

## Step 2: Blog List Page

```jsx
// src/pages/blog/index.jsx
import { Link } from 'bertui/router';

const posts = [
  { slug: 'first-post', title: 'My First Post', date: '2024-01-01' },
  { slug: 'second-post', title: 'Second Post', date: '2024-01-02' },
];

export default function Blog() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 className="fadein">Blog</h1>
      
      <div>
        {posts.map(post => (
          <article 
            key={post.slug}
            className="slideup"
            style={{
              padding: '1.5rem',
              margin: '1rem 0',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          >
            <h2>
              <Link to={`/blog/${post.slug}`}>
                {post.title}
              </Link>
            </h2>
            <p style={{ color: '#666' }}>{post.date}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
```

## Step 3: Individual Post Page

```jsx
// src/pages/blog/[slug].jsx
import { Link } from 'bertui/router';

const posts = {
  'first-post': {
    title: 'My First Post',
    content: 'This is my first blog post!',
    date: '2024-01-01'
  },
  'second-post': {
    title: 'Second Post',
    content: 'Another great post.',
    date: '2024-01-02'
  }
};

export default function BlogPost({ params }) {
  const post = posts[params.slug];
  
  if (!post) {
    return <div>Post not found</div>;
  }
  
  return (
    <article style={{ padding: '2rem' }}>
      <h1 className="fadein">{post.title}</h1>
      <p style={{ color: '#666' }}>{post.date}</p>
      
      <div className="slideup" style={{ marginTop: '2rem' }}>
        {post.content}
      </div>
      
      <Link to="/blog" style={{ marginTop: '2rem', display: 'block' }}>
        ← Back to Blog
      </Link>
    </article>
  );
}
```

## Step 4: Test It

1. Navigate to `/blog` - see all posts
2. Click a post - see individual post
3. Click back - return to list

Done! You've built a blog with file-based routing.

## Next Steps

- [Add more features](./advanced-blog.html)
- [Deploy your blog](../guides/deployment.html)
