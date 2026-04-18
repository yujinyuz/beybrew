import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const widgetType = new URLSearchParams(window.location.search).get('widget');

async function mount() {
  if (widgetType) {
    const { default: EmbedApp } = await import('./EmbedApp.jsx');
    createRoot(document.getElementById('root')).render(
      <StrictMode><EmbedApp /></StrictMode>
    );
  } else {
    const { default: App } = await import('./App.jsx');
    const { createBrowserRouter, RouterProvider } = await import('react-router-dom');
    const router = createBrowserRouter([{ path: '/', element: <App /> }]);
    createRoot(document.getElementById('root')).render(
      <StrictMode><RouterProvider router={router} /></StrictMode>
    );
  }
}

mount();
