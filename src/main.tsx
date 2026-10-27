import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

document.addEventListener('keydown',e=>{if(!['Shift','Control','Alt','Meta'].includes(e.key))document.documentElement.dataset.input='keyboard';},true);
document.addEventListener('pointerdown',()=>{document.documentElement.dataset.input='pointer';},true);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
