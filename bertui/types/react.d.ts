// bertui/types/react.d.ts
import React from 'react';

// Export everything from React
export = React;
export as namespace React;

declare global {
  // Re-export React types for global access
  namespace JSX {
    interface IntrinsicElements {
      // All HTML elements with proper typing
      [key: string]: any;
    }
  }
}