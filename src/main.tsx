// Ensure window.fetch has a setter if an extension or test harness attempts to wrap it
try {
  const _rawFetch = window.fetch;
  let _activeFetch: typeof fetch = (...args) => _rawFetch ? _rawFetch.apply(window, args) : Promise.reject(new Error('Fetch not ready'));
  let curr: any = window;
  while (curr) {
    try {
      const d = Object.getOwnPropertyDescriptor(curr, 'fetch');
      if (d && (!d.set || d.writable === false)) {
        Object.defineProperty(curr, 'fetch', {
          configurable: true,
          enumerable: true,
          get() { return _activeFetch; },
          set(fn: typeof fetch) { _activeFetch = fn; }
        });
      }
    } catch (_) {}
    curr = Object.getPrototypeOf(curr);
  }
} catch (_) {}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
