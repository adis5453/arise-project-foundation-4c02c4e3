import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./styles/globals.css";  // ✅ FIXED: Correct path
import "./App.css";
import ErrorBoundary from "./components/common/ErrorBoundary";
// Removed test imports - unnecessary in production

// Ensure the static HTML "initial loader" never gets stuck on screen.
// (In dev/HMR or error-boundary scenarios the window 'load' event can be missed.)
function removeInitialLoader() {
  const loader = document.getElementById('initial-loader')
  if (!loader) return

  // Hide immediately (avoids flashes / stuck overlay) then remove.
  ;(loader as HTMLElement).style.opacity = '0'
  ;(loader as HTMLElement).style.pointerEvents = 'none'

  // Remove now and also on next frames (some browsers reflow late).
  try {
    loader.remove()
  } catch {
    // ignore
  }

  requestAnimationFrame(() => {
    const again = document.getElementById('initial-loader')
    if (again) {
      try {
        again.remove()
      } catch {
        // ignore
      }
    }
  })

  setTimeout(() => {
    const again = document.getElementById('initial-loader')
    if (again) {
      try {
        again.remove()
      } catch {
        // ignore
      }
    }
  }, 500)
}

removeInitialLoader()
document.addEventListener('DOMContentLoaded', removeInitialLoader)

// Service worker registration disabled to avoid MIME type errors
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/service-worker.js')
//       .then((registration) => {
//       })
//       .catch((registrationError) => {
//       })
//   });
// }

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>,
);
