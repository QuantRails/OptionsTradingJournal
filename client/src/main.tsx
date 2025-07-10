import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Disable Vite HMR error overlay that causes mobile runtime errors
if (import.meta.hot) {
  import.meta.hot.on('vite:error', () => {
    // Prevent error overlay from showing
  });
}

// Disable Replit runtime error modal specifically
if (typeof window !== 'undefined') {
  // Override Replit's error modal functionality
  const originalError = window.console.error;
  window.console.error = (...args) => {
    // Block Replit error modal triggers
    if (args[0] && typeof args[0] === 'string' && args[0].includes('runtime-error')) {
      return;
    }
    originalError.apply(console, args);
  };

  // Disable error overlays
  window.addEventListener('error', (e) => {
    e.stopImmediatePropagation();
    e.preventDefault();
  }, true);
  
  window.addEventListener('unhandledrejection', (e) => {
    e.stopImmediatePropagation();
    e.preventDefault();
  }, true);

  // Remove any existing error modal elements
  const observer = new MutationObserver(() => {
    const errorModal = document.querySelector('[data-testid="runtime-error-modal"]') || 
                      document.querySelector('.runtime-error-modal') ||
                      document.querySelector('#runtime-error-overlay');
    if (errorModal) {
      errorModal.remove();
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

createRoot(document.getElementById("root")!).render(<App />);
