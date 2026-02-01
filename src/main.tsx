import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./styles/globals.css";  // ✅ FIXED: Correct path
import "./App.css";
import ErrorBoundary from "./components/common/ErrorBoundary";
// Removed test imports - unnecessary in production

// (Removed) legacy initial loader handling

// Service worker registration disabled to avoid MIME type errors.
// Also proactively unregister any previously installed SW + clear caches,
// otherwise stale PWA caches can keep serving old UI even after code updates.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister())))
    .catch(() => undefined);

  // Best-effort cache clear (safe if CacheStorage is unavailable)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).caches
    ?.keys?.()
    .then((keys: string[]) => Promise.all(keys.map((k) => (window as any).caches.delete(k))))
    .catch(() => undefined);
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
