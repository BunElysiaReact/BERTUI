import { Link } from 'bertui/router';
import '../styles/home.css';

export default function Home() {
  return (
    <div className="home-container">
      <nav className="home-nav">
        <h2 className="home-logo">⚡ BertUI</h2>
        <div className="home-nav-links">
          <Link to="/" className="nav-link active">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/blog" className="nav-link">Blog</Link>
        </div>
      </nav>

      <main className="home-main">
        <h1 className="home-title">
          Build Lightning-Fast
          <br />
          React Apps
        </h1>

        <p className="home-subtitle">
          File-based routing • Zero config • Blazing fast HMR • Powered by Bun
        </p>

        <div className="home-cta">
          <Link to="/blog" className="btn btn-primary">
            Get Started →
          </Link>
          <Link to="/about" className="btn btn-secondary">
            Learn More
          </Link>
        </div>

        <div className="home-features">
          <FeatureCard 
            icon="⚡"
            title="Lightning Fast"
            description="Built on Bun for incredible speed. Instant dev server startup and blazing fast HMR."
          />
          <FeatureCard 
            icon="📁"
            title="File-Based Routing"
            description="Create pages/about.jsx and get /about route. Dynamic routes with [param] syntax."
          />
          <FeatureCard 
            icon="🎨"
            title="Zero Config"
            description="No webpack, no babel, no config files. Just write React and ship."
          />
          <FeatureCard 
            icon="🔥"
            title="Hot Module Replacement"
            description="See your changes instantly without losing component state."
          />
        </div>

        <div className="home-start">
          <h2 className="home-start-title">Ready to build something amazing?</h2>
          <p className="home-start-subtitle">Get started in seconds with a single command</p>
          <code className="home-start-code">bunx create-bertui my-app</code>
        </div>
      </main>

      <footer className="home-footer">
        <p>Built with BertUI • MIT License</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </div>
  );
}