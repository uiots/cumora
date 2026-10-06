# Cumora Dev — a side-by-side local fork build

This fork packages the local Cumora checkout as a **separate desktop app**
(`Cumora Dev`) that installs and runs **next to** the official
`/Applications/Cumora.app` without the two colliding.

Everything that makes two Electron apps collide is namespaced in one place,
[`electron/fork-config.cjs`](../electron/fork-config.cjs), which both the main
process and the renderer read (via a Vite `define`), so the packaged app can't
drift out of sync.

## What is isolated

| Concern | Official app | Cumora Dev |
|---|---|---|
| Bundle id | `io.cumora.app` | `io.cumora.app.dev` |
| Product name | Cumora | Cumora Dev |
| URL scheme | `cumora://` | `cumoradev://` |
| OAuth loopback port | `127.0.0.1:47823` | `127.0.0.1:47899` |
| Electron profile (`userData`) | `…/Application Support/Cumora` | `…/Application Support/CumoraDev` |
| Auto-update | official release channel | disabled |
| App icon | official | official + blue tint + **DEV** badge |

Namespacing `userData` is what actually lets both apps **run at the same
time**: Electron's single-instance lock is keyed by the userData directory, so
without it the fork that boots second sees "second instance" and quits
immediately. It also keeps cookies / localStorage (auth tokens) and
`window-state.json` from being shared.

## Build & run

```bash
# 1. build the renderer bundle
npm run build

# 2. package the mac app (unsigned, local only)
npx electron-builder --mac --dir --arm64

# 3. install next to the official app and launch
cp -R release/mac-arm64/Cumora\ Dev.app /Applications/
open -a "Cumora Dev"
```

A helper that does all of it: `./scripts-build-fork.sh`.

## Signing

The fork is packaged **unsigned** (`identity: null`, `notarize: false`,
`hardenedRuntime: false`). macOS will quarantine-gate the first launch:

```bash
xattr -dr com.apple.quarantine "/Applications/Cumora Dev.app"
```

It is a local development build — do not distribute it.

## Sign-in: the one thing that needs a backend

This is the non-obvious part, and it is a **server-side** constraint, not an
Electron one.

Sign-in opens the browser at:

```
<API>/api/auth/start/<provider>?return=http://127.0.0.1:<PORT>/auth/done
```

The server validates `return` against its `AUTH_RETURN_ALLOWLIST`
(`server/src/oauth.ts`) and 302s the browser to it once the provider
round-trips. The Electron main process listens on that port and receives the
token (see `startAuthLoopback` in `electron/main.cjs`).

The port therefore has to be in the API server's allowlist. Against the
**official** cloud (`https://api.cumora.ai`) that allowlist only accepts
`127.0.0.1:47823`, so:

- keeping `47823` → both copies race for the port; `main.cjs` starts the
  loopback listener unconditionally at boot, so the second one silently loses
  (`EADDRINUSE` is only a `console.warn`) and its sign-in POST never lands;
- changing the port (this fork) → the official server answers
  `400 return URL not allowed` before the OAuth round-trip even starts.

**⇒ For the fork to sign in, it must point at its own backend**, whose
allowlist we control:

```bash
export CUMORA_API_BASE=http://localhost:5181
# server/src/env.ts reads AUTH_RETURN_ALLOWLIST from
# CUMORA_AUTH_RETURN_ALLOWLIST — allow the fork's port + scheme:
#   http://127.0.0.1:47899/auth/done
#   cumoradev://auth
```

The app launches and is fully usable as a UI without a backend; only the
OAuth round-trip is gated by the above. Everything else (local agent work,
rendering, the `ChatPane` scroll fix this fork carries) works offline.

## Why the fork exists

The local `main` carries an unreleased desktop fix in
`src/desktop/ChatPane.tsx`: the operator's own outgoing message could render
below the fold ("sent but invisible") because a burst of HELD agent replies
drifts Virtuoso's `atBottom` estimate false. The fix follows the operator's own
send unconditionally. This build exists to run that fix side-by-side with the
shipped official app.