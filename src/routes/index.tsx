import { createRoot } from 'react-dom/client';
import React from 'react';

function App() {
  return <h1>Luarmen is working!</h1>;
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}
