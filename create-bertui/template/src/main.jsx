// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Router, routes } from '/compiled/router.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router routes={routes} />
  </React.StrictMode>
);