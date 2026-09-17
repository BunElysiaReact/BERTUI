import React from 'react';

export default function Counter() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{ 
      padding: '2rem',
      border: '2px solid #667eea',
      borderRadius: '8px',
      margin: '1rem 0'
    }}>
      <h3>Interactive Counter Component</h3>
      <p>Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: '0.5rem 1rem',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '0.5rem'
        }}
      >
        Increment
      </button>
    </div>
  );
}
