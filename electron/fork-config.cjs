/* eslint-env node */
/**
 * Local-fork identity for Cumora.
 *
 * Goal: build a side-by-side "Cumora Fork" that coexists with the official
 * /Applications/Cumora.app on the same machine — separate name, icon, bundle
 * id, userData (so tokens/session/cache never mix), OS deep-link scheme, and
 * auto-update disabled so the fork never self-replaces or talks to the
 * official updates feed.
 *
 * Loopback port policy for THIS variant (DSH's fork/local-app): keep 47823.
 *   - The renderer's sign-in hits <API>/auth/start/<provider>?return=
 *     http://127.0.0.1:<PORT>/auth/done. The official cloud validates `return`
 *     against its AUTH_RETURN_ALLOWLIST, which only admits 127.0.0.1:47823 —
 *     any other port is rejected with 400 before the OAuth round-trip starts.
 *   - Cost: if the official app is RUNNING while this fork signs in, the
 *     official app already holds the port; the fork's listener gets EADDRINUSE
 *     (warn-only) and the token handoff POST lands on the official app's
 *     listener, which drops it (no armed nonce). Practical rule: sign in from
 *     one app at a time, quit the other first — everything after sign-in
 *     (session, windows, data) is fully isolated and can run concurrently.
 *   - The sibling variant (mavis's "Cumora Dev", port 47899) trades official
 *     sign-in for full concurrency; point CUMORA_FORK_API_BASE at a self-hosted
 *     backend whose allowlist you control to get both. See docs/FORK_BUILD.md.
 *
 * This file is the single source of truth for identity so main.cjs,
 * autoUpdater.cjs and the renderer (via vite define) cannot drift.
 */

// Identity / packaging (mirrors the `build` block in package.json).
const PRODUCT_NAME = 'Cumora Fork'
const APP_ID = 'io.cumora.fork'
const DEEP_LINK_SCHEME = 'cumorafork'
// Kept at the stock port ON PURPOSE — see the header for the trade-off.
const LOOPBACK_PORT = 47823

// Namespace the Electron profile so nothing is shared with the official app:
// window state, single-instance lock, cookies, localStorage (auth tokens).
const USER_DATA_DIR_NAME = 'Cumora Fork'

// A side-by-side build must never pull the official release channel.
const DISABLE_AUTO_UPDATE = true

// API the built renderer talks to. Empty => use VITE_CUMORA_API_BASE.
// Point at a local backend (http://localhost:5181) for a self-contained fork.
const API_BASE_OVERRIDE = process.env.CUMORA_FORK_API_BASE || ''

module.exports = {
  IS_FORK: true,
  PRODUCT_NAME,
  APP_ID,
  DEEP_LINK_SCHEME,
  LOOPBACK_PORT,
  USER_DATA_DIR_NAME,
  DISABLE_AUTO_UPDATE,
  API_BASE_OVERRIDE,
}