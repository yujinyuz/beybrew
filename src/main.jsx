import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import LZString from 'lz-string';
import './index.css';

const params = new URLSearchParams(window.location.search);
const isEmbed = params.has('widget') || (() => {
  const token = params.get('d');
  if (!token) return false;
  try {
    const raw = LZString.decompressFromEncodedURIComponent(token);
    if (!raw) return false;
    const payload = JSON.parse(raw);
    return payload?.widget != null || payload?.scope != null;
  } catch {
    return false;
  }
})();

async function mount() {
  if (isEmbed) {
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
