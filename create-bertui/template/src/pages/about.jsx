import { Link } from 'bertui/router';
import '../styles/about.css';

export default function About() {
  return (
    <div className="about-container">
      <h1 className="about-title">About BertUI</h1>
      
      <p className="about-text">
        BertUI is a modern React development framework that combines the blazing speed of Bun 
        with the elegance of file-based routing.
      </p>
      
      <p className="about-text">
        Built for developers who want to move fast without sacrificing code quality.
      </p>
      
      <div className="about-features">
        <h2 className="about-features-title">Why BertUI?</h2>
        
        <div className="features-grid">
          <div className="feature-item">
            <h3 className="feature-item-title feature-speed">⚡ Speed</h3>
            <p className="feature-item-text">
              Leverages Bun's native performance for faster builds and hot reloads.
            </p>
          </div>
          
          <div className="feature-item">
            <h3 className="feature-item-title feature-simplicity">🎯 Simplicity</h3>
            <p className="feature-item-text">
              File-based routing means no complex configuration - just create files and go.
            </p>
          </div>
          
          <div className="feature-item">
            <h3 className="feature-item-title feature-power">💪 Power</h3>
            <p className="feature-item-text">
              Code splitting and modern tooling out of the box.
            </p>
          </div>
        </div>
      </div>
      
      <div className="about-cta">
        <Link to="/" className="btn btn-back">← Back to Home</Link>
      </div>
    </div>
  );
}