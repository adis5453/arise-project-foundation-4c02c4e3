import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./styles/globals.css";  // ✅ FIXED: Correct path
import "./App.css";
import ErrorBoundary from "./components/common/ErrorBoundary";
// Removed test imports - unnecessary in production

// Ensure the static HTML "initial loader" never gets stuck on screen.
// (In dev/HMR scenarios the window 'load' event can be missed.)
const initialLoader = document.getElementById('initial-loader')
if (initialLoader) {
  initialLoader.remove()
}

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
