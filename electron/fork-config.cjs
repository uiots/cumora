/* eslint-env node */
/**
 * Local-fork identity for Cumora.
 *
 * Goal: build a side-by-side "Cumora Dev" that coexists with the official
 * /Applications/Cumora.app on the same machine — separate name, icon, bundle
 * id, userData (so tokens/session/cache never mix), OAuth loopback port and
 * OS deep-link scheme, and with auto-update disabled so the fork never
 * self-replaces or talks to the official updates feed.
 *
 * Why loopback port + scheme must differ (and why that forces a local
 * backend for sign-in):
 *   - The renderer's sign-in hits <API>/auth/start/<provider>?return=
 *     http://127.0.0.1:<PORT>/auth/done. The server validates `return`
 *     against AUTH_RETURN_ALLOWLIST (server/src/oauth.ts) and 302s there.
 *   - Against the OFFICIAL cloud (api.cumora.ai) that allowlist only admits
 *     127.0.0.1:47823, so a different port is rejected with 400 BEFORE the
 *     OAuth round-trip even starts.
 *   - main.cjs starts the loopback listener unconditionally at boot, so two
 *     copies both try to hold their port; if the official app already holds
 *     47823 this fork gets EADDRINUSE (only a console.warn) and its sign-in
 *     POST /auth/token never receives the token.
 *   => Running two copies with working sign-in requires the fork to point at
 *      its OWN backend, whose AUTH_RETURN_ALLOWLIST we control. The app still
 *      runs (rendered, isolated) without that; only the OAuth round-trip is
 *      gated. See docs/LOCAL-FORK.md.
 *
 * This file is the single source of truth for identity so main.cjs,
 * autoUpdater.cjs and the renderer (via vite define) cannot drift.
 */

// Identity / packaging (mirrors the `build` block in package.json).
const PRODUCT_NAME = 'Cumora Dev'
const APP_ID = 'io.cumora.app.dev'
const DEEP_LINK_SCHEME = 'cumoradev'
const LOOPBACK_PORT = 47899

// Namespace the Electron profile so nothing is shared with the official app:
// window state, single-instance lock, cookies, localStorage (auth tokens).
const USER_DATA_DIR_NAME = 'CumoraDev'

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