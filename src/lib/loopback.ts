/**
 * The Electron OAuth loopback listener's port.
 *
 * Sign-in sends `?return=http://127.0.0.1:<port>/auth/done` to the API,
 * which validates it against its AUTH_RETURN_ALLOWLIST and 302s the browser
 * here once the provider round-trips. main.cjs opens the listener on the
 * same port (electron/fork-config.cjs), so the two must agree — a mismatch
 * means the 302 lands on nothing.
 *
 * The value is injected at build time from electron/fork-config.cjs via the
 * `import.meta.env.VITE_CUMORA_LOOPBACK_PORT` define in vite.config.ts, so a
 * side-by-side fork build and the official app can never drift apart.
 */
export const LOOPBACK_PORT: number =
  Number(import.meta.env.VITE_CUMORA_LOOPBACK_PORT || 47823)

export const LOOPBACK_DONE_URL = `http://127.0.0.1:${LOOPBACK_PORT}/auth/done`