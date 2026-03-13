# 📥 Telegram Client — Browser-Based MTProto

A full-featured Telegram client running entirely in your browser. No server needed — connects directly to Telegram via MTProto WebSocket using [teleproto](https://github.com/sanyok12345/teleproto) (actively maintained GramJS fork with up-to-date TL layers).

**[Live Demo](https://tg-file-dl.pages.dev)** • **[Deploy Your Own](#-deploy)**

---

## ✨ Features

### 🤖 Bot Mode
- Download files from Telegram via bot token — **no file size limits**
- Parallel multi-connection downloads (up to 8 workers for faster speeds)
- Configurable chunk sizes (64 KB – 1 MB) with auto-tuning support
- Receive incoming messages and files from your bot in real-time
- Reply to messages directly from the browser (with reply-to threading)
- Paste any `t.me` link to fetch and download files
- Conversation view grouped by sender with full chat history
- Photo thumbnails with full-size lightbox viewer
- File download from chat messages (documents, photos, videos)
- IndexedDB persistence — conversations and files survive page refresh
- Reconstructs file references from stored IDs for download after refresh
- Auto-reconnect on internet loss/restore with connection health monitoring

### 👤 User Mode
- **Login with phone number** — full Telegram user session in the browser
- **2FA support** — two-factor authentication with resume-after-refresh
- **Multi-account** — up to 10 accounts with account switcher and per-account session isolation
- **Browse all chats** — private, groups, channels, bots with unread counts
- **Saved Messages** — your self-chat shows as "Saved Messages"
- **Search & filter** — find chats by name, @username, or Telegram ID; filter by type (private/bot/group/channel)
- **Send & receive messages** — real-time with new message listener
- **Reply threading** — reply to specific messages with quote preview
- **Photo thumbnails** — inline previews with full-size lightbox and download
- **Video & audio** — inline player with parallel download, video notes, voice messages
- **File downloads** — any file type with download queue system
- **Download queue** — sequential processing with progress, cancel, and retry per item
- **Parallel downloads** — multi-connection parallel chunk downloads for large files
- **Stealth mode** — read messages without sending read receipts (double ticks)
- **Auto-load photos** — configurable thumbnail auto-download in chats
- **Infinite scroll** — load older messages on scroll-up
- **Browser notifications** — optional alerts for new messages when tab is inactive
- **UI state persistence** — restores open chat, active filter on page reload

### ⚙️ Settings (separate for Bot & User mode)
- **Bot mode**: Parallel workers (1–8), chunk size (64 KB – 1 MB), stealth mode
- **User mode**: Stealth mode, auto-load photos, notifications, send with Enter/Ctrl+Enter, font size
- **Shared**: Cloudflare Proxy toggle with custom worker domain (synced across both modes)
- Reset to defaults option for each mode

---

## 🚀 Deploy

### Cloudflare Pages (Recommended)

1. Fork this repo
2. Go to [Cloudflare Pages](https://pages.cloudflare.com) → Create a project → Connect your fork
3. Build settings:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Deploy!

### Local Development

```bash
git clone https://github.com/CloudflareHackers/TGCFWorkersDLBot.git
cd TGCFWorkersDLBot
npm install
npm run dev
```

Open `http://localhost:3000`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run deploy` | Build and deploy to Cloudflare Pages via Wrangler |

---

## 🌐 Proxy Setup (Optional)

If Telegram WebSocket connections are blocked in your region, deploy the **TG-WS-API** proxy:

### One-Click Deploy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/CloudflareHackers/TG-WS-API)

> This deploys a Cloudflare Worker with Durable Objects that proxies WebSocket connections to Telegram servers. Works on the **free plan**.

### Manual Deploy

```bash
git clone https://github.com/CloudflareHackers/TG-WS-API.git
cd TG-WS-API
npm install
npx wrangler deploy
```

### Configure in the App

1. Open Settings in the web app (Bot or User mode)
2. Enable **🌐 Cloudflare Proxy**
3. Enter your worker domain: `tg-ws-api.your-account.workers.dev`
4. Save — all Telegram connections now route through your proxy

### How the Proxy Works

The app includes a **WebSocket Proxy Hook** (`src/proxy-hook.js`) that intercepts all WebSocket connections globally:

```
Without proxy:  Browser → wss://venus.web.telegram.org/apiws
With proxy:     Browser → wss://your-worker.workers.dev/venus.web.telegram.org/apiws
```

The hook is loaded before teleproto and overrides `window.WebSocket` to transparently rewrite Telegram WebSocket URLs. It reads proxy settings directly from `localStorage` to avoid circular imports.

The project also includes a **Cloudflare Pages Function** (`functions/api/[[path]].js`) that can serve as a same-origin proxy fallback. It validates Telegram domains and supports both WebSocket upgrades (via Durable Objects) and regular HTTP proxying.

### Free vs Paid Proxy Plan

The proxy works on the **free Cloudflare plan** by default (SQLite-backed Durable Objects).

For heavy usage, upgrade to the **Workers Paid plan** ($5/month).

**Paid plan benefits:** 10M+ requests/month, 1M+ DO operations, global low-latency, no daily limits, detailed analytics.

---

## 🔐 Default API Credentials

The app comes pre-filled with Telegram Web's public API credentials:
- **API ID:** `1025907`
- **API Hash:** `452b0359b988148995f22ff0f4229750`

You can use your own from [my.telegram.org](https://my.telegram.org) → API Development Tools.

---

## 🏗️ Architecture

```
Browser (teleproto MTProto)
  ↓ WebSocket (direct or via CF Proxy)
Telegram Servers (DC1–DC5)
```

- **No backend server** — everything runs client-side in the browser
- **Sessions stored in localStorage** — never leaves your device
- **IndexedDB** for conversation history and file metadata persistence
- **teleproto** for MTProto protocol (maintained fork of GramJS with latest TL layers)
- **Vite** for bundling with tree-shaking and manual chunking (teleproto in separate chunk)
- **Custom browser shims** — pure-JS AES-256 (ECB + CTR), zlib inflate, WebSocket transport, localStorage-based sessions

### Telegram DC Mapping

The WebSocket adapter (`src/shims/promised-web-sockets.js`) maps Telegram DC IPs to WebSocket hostnames:

| DC | Hostname |
|----|----------|
| DC1 | `pluto.web.telegram.org` |
| DC2 | `venus.web.telegram.org` |
| DC3 | `aurora.web.telegram.org` |
| DC4 | `vesta.web.telegram.org` |
| DC5 | `flora.web.telegram.org` |

The client overrides `getDC()` to always return WebSocket hostnames instead of raw IPs, which is critical for browser WebSocket compatibility.

---

## 📁 Project Structure

```
├── index.html                  # Entry point — loads /src/main.js
├── package.json                # Dependencies: teleproto, buffer, events, util, process
├── vite.config.js              # Vite config with Node.js shim aliases and manual chunking
├── wrangler.toml               # Cloudflare Pages deployment config
│
├── functions/
│   └── api/
│       └── [[path]].js         # CF Pages Function — WebSocket/HTTP proxy for Telegram API
│
└── src/
    ├── main.js                 # App entry — mode router, bot mode UI, event bindings, state
    ├── telegram-client.js      # TGDownloader class — bot auth, file fetch, parallel download, messaging
    ├── user-client.js          # TGUserClient class — user auth, dialogs, messages, multi-account
    ├── user-mode.js            # User mode UI — chat list, message viewer, download queue, settings
    ├── link-parser.js          # Telegram link parser (t.me, tg://) and file utility helpers
    ├── settings.js             # Settings persistence — bot/user/proxy settings in localStorage
    ├── db.js                   # IndexedDB wrapper — conversations, files, persistence
    ├── proxy-hook.js           # WebSocket proxy interceptor — rewrites Telegram WS URLs
    ├── polyfills.js            # Browser polyfills for teleproto (Buffer, process, timer stubs)
    ├── style.css               # Full UI styles — dark theme, cards, modals, media, queue
    │
    └── shims/                  # Node.js module shims for browser compatibility
        ├── browser-session.js  # localStorage-based session (replaces teleproto's StoreSession)
        ├── promised-web-sockets.js  # WebSocket transport (replaces PromisedNetSockets)
        ├── crypto.js           # Pure-JS AES-256 (ECB/CTR) + Web Crypto API (SHA, PBKDF2)
        ├── zlib.js             # Zlib inflate shim for GZIPPacked messages
        ├── stream.js           # Minimal stream shim
        ├── assert.js           # Minimal assert shim
        ├── constants.js        # Node.js constants shim
        ├── fs.js               # No-op filesystem shim
        ├── net.js              # No-op network shim
        ├── os.js               # Minimal OS shim
        ├── path.js             # Minimal path shim
        ├── node-localstorage.js # No-op (browser has native localStorage)
        └── socks.js            # No-op SOCKS proxy shim
```

---

## 🔧 Key Technical Details

### Parallel Downloads

Both Bot and User mode support parallel multi-connection downloads for large files (>1 MB):

1. The file is split into chunks (configurable: 64 KB – 1 MB, default 512 KB)
2. Multiple DC senders are created (up to 8 connections)
3. Each worker downloads a range of chunks via `upload.GetFile` with different offsets
4. Workers retry with exponential backoff on failure, with automatic DC migration on `FILE_MIGRATE_` errors
5. All chunks are merged in order into the final file

For small files (<1 MB) or when only one connection is available, it falls back to `downloadMedia` (single-connection).

### Browser Session

The `BrowserSession` class (`src/shims/browser-session.js`) extends teleproto's `MemorySession` to persist session data (auth keys, DC info, entities) in `localStorage`. This enables:

- Fast reconnection without re-authentication
- Session survival across page refreshes
- Per-account session isolation (keyed by `tg_user_0`, `tg_user_1`, etc.)

### Crypto Shims

Since Web Crypto API doesn't support AES-ECB mode (needed by teleproto's IGE encryption layer), the crypto shim (`src/shims/crypto.js`) includes a **pure JavaScript AES-256 implementation** with:

- **AES-256-ECB**: Synchronous block encryption/decryption with full S-box, ShiftRows, MixColumns
- **AES-256-CTR**: Counter mode built on top of ECB
- **SHA-1/256/512**: Delegated to Web Crypto API
- **PBKDF2**: Delegated to Web Crypto API (used for 2FA password hashing)

### Connection Recovery

The app monitors connection health and automatically reconnects:

- Listens for browser `online`/`offline` events
- Periodic health checks every 30s (via `_sender.isConnected()`)
- Auto-reconnect on internet restore (5s delay, 30s retry on failure)
- Manual disconnect prevents auto-reconnect (respects user intent)
- `ensureConnected()` with ping verification before operations

### Supported Telegram Link Formats

The link parser (`src/link-parser.js`) supports:

| Format | Example |
|--------|---------|
| Private channel | `https://t.me/c/2113604672/730` |
| Public channel/group | `https://t.me/channel_name/123` |
| Bot channel | `https://t.me/b/bot_name/456` |
| `tg://` private post | `tg://privatepost?channel=123&msg_id=456` |
| `tg://` resolve | `tg://resolve?domain=username&post=789` |

Also supports `telegram.me` and `telegram.dog` domains.

### Data Persistence

| Store | Technology | Purpose |
|-------|-----------|---------|
| Session & auth keys | `localStorage` | MTProto session, DC info, entity cache |
| Bot/User settings | `localStorage` | Per-mode preferences, shared proxy config |
| Credentials | `localStorage` | API ID, hash, bot token (for auto-reconnect) |
| Account list | `localStorage` | Multi-account metadata (phone, name, username) |
| Conversations | IndexedDB | Bot mode message history (200 msgs/conversation max) |
| Incoming files | IndexedDB | File metadata with doc/photo IDs for reconstruction |

---

## 📦 Tech Stack

| Component | Technology |
|-----------|-----------|
| MTProto Client | [teleproto](https://github.com/sanyok12345/teleproto) (maintained GramJS fork) |
| Build Tool | [Vite](https://vitejs.dev) (ES2020 target) |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com) |
| Proxy (optional) | [Cloudflare Workers + Durable Objects](https://github.com/CloudflareHackers/TG-WS-API) |
| Crypto | Pure-JS AES-256 (ECB/CTR) + Web Crypto API (SHA-256, PBKDF2) |
| Storage | localStorage + IndexedDB |
| Polyfills | buffer, events, process, util (npm) + custom Node.js shims |

---

## 🔒 Security

- All processing happens in your browser — **zero server-side logic**
- Credentials and sessions never leave your device
- MTProto encryption is end-to-end between your browser and Telegram servers
- Proxy mode only relays encrypted WebSocket frames (cannot read content)
- No analytics, no tracking, no data collection
- Open source — audit the code yourself

---

## 📄 License

MIT
