/**
 * WebSocket Proxy Hook
 * 
 * When proxy is enabled in settings, intercepts all WebSocket connections
 * to Telegram servers and rewrites them to go through our Cloudflare
 * Pages Function at /api/<host>/<path>.
 * 
 * GramJS connects to: wss://venus-1.web.telegram.org/apiws
 * We rewrite to:       wss://<our-domain>/api/venus-1.web.telegram.org/apiws
 * 
 * This must be imported BEFORE GramJS is loaded.
 */

const _OriginalWebSocket = window.WebSocket;

const TELEGRAM_WS_PATTERN = /^wss?:\/\/([a-z0-9\-]+\.(?:web\.)?telegram\.org)(\/.*)?$/i;

class ProxiedWebSocket extends _OriginalWebSocket {
  constructor(url, protocols) {
    // Check if proxy is enabled (read directly from localStorage to avoid circular imports)
    let proxyEnabled = false;
    try {
      const raw = localStorage.getItem('tgcf_settings');
      if (raw) {
        const settings = JSON.parse(raw);
        proxyEnabled = !!settings.proxyEnabled;
      }
    } catch {}

    if (proxyEnabled && typeof url === 'string') {
      const match = url.match(TELEGRAM_WS_PATTERN);
      if (match) {
        const host = match[1]; // e.g. venus-1.web.telegram.org
        const path = match[2] || ''; // e.g. /apiws
        // Rewrite to proxy URL on same origin
        const proxyUrl = `wss://${window.location.host}/api/${host}${path}`;
        console.log(`[Proxy] Rewriting WebSocket: ${url} → ${proxyUrl}`);
        super(proxyUrl, protocols);
        return;
      }
    }

    // Not a Telegram URL or proxy disabled — pass through
    super(url, protocols);
  }
}

// Override global WebSocket
window.WebSocket = ProxiedWebSocket;

// Also keep reference for debugging
window._OriginalWebSocket = _OriginalWebSocket;
