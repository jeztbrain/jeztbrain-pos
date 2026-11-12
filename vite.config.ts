import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Production-only Content-Security-Policy for the built app. It is injected as a <meta> tag
 * because pages loaded from file:// inside Electron do not receive response headers.
 * - script-src 'self'  : no inline/eval scripts can run (XSS hardening).
 * - connect-src https/wss : Supabase REST + Realtime (any project, so a runtime .env override
 *   to another Supabase project keeps working) and the optional local print bridge.
 */
function productionCsp(): Plugin {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: wss: http://localhost:* http://127.0.0.1:*",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');
  return {
    name: 'production-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  // Explicitly load the project .env so VITE_SUPABASE_* are inlined into the renderer bundle
  // (Electron renderer included). Warn at build time if they are missing.
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (mode === 'production' && (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY)) {
    console.warn(
      '[vite] WARNING: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing from .env - the build will use the built-in fallback project.'
    );
  }

  return {
    // Relative asset paths so the built app also loads from file:// inside Electron.
    base: './',
    plugins: [react(), productionCsp()],
    server: {
      port: 5173,
      strictPort: true, // Electron dev waits on exactly this port
      host: true,
    },
  };
});
