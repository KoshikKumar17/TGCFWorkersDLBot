/**
 * Settings module — persists user preferences in localStorage.
 * 
 * Supports separate settings for Bot Mode and User Mode:
 * - tgcf_settings_bot: Bot mode settings (parallel workers, chunk size, proxy, etc.)
 * - tgcf_settings_user: User mode settings (stealth, proxy, auto-download, etc.)
 * 
 * Legacy key `tgcf_settings` is migrated to `tgcf_settings_bot` on first access.
 */

const SETTINGS_KEY_BOT = 'tgcf_settings_bot';
const SETTINGS_KEY_USER = 'tgcf_settings_user';
const LEGACY_KEY = 'tgcf_settings';

const CHUNK_SIZES = [
  { value: 65536,   label: '64 KB' },
  { value: 131072,  label: '128 KB' },
  { value: 262144,  label: '256 KB' },
  { value: 524288,  label: '512 KB' },
  { value: 1048576, label: '1 MB' },
];

const BOT_DEFAULTS = {
  parallelWorkers: 4,
  chunkSize: 524288,       // 512KB — MTProto standard max
  proxyEnabled: false,
  proxyDomain: '',         // User's own CF Worker proxy domain
  stealthMode: false,      // Avoid sending read receipts
  autoChunkSize: false,
  bestChunkSize: null,     // Auto-detected best chunk size
};

const USER_DEFAULTS = {
  stealthMode: false,      // Don't send read receipts (double tick)
  proxyEnabled: false,
  proxyDomain: '',         // CF Worker proxy domain for user mode
  autoDownloadPhotos: true, // Auto-load photo thumbnails in chat
  autoDownloadLimit: 5,    // Max auto-download size in MB (0 = disabled)
  notifyNewMessages: true, // Browser notification for new messages
  sendWithEnter: true,     // Send message on Enter (vs Ctrl+Enter)
  fontSize: 'normal',      // 'small', 'normal', 'large'
};

/**
 * Migrate legacy `tgcf_settings` → `tgcf_settings_bot` if needed.
 */
function migrateLegacy() {
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy && !localStorage.getItem(SETTINGS_KEY_BOT)) {
    localStorage.setItem(SETTINGS_KEY_BOT, legacy);
    localStorage.removeItem(LEGACY_KEY);
  }
}

// ===== Bot Settings =====

export function getSettings() {
  migrateLegacy();
  return getBotSettings();
}

export function getBotSettings() {
  migrateLegacy();
  try {
    const raw = localStorage.getItem(SETTINGS_KEY_BOT);
    if (!raw) return { ...BOT_DEFAULTS };
    const saved = JSON.parse(raw);
    return { ...BOT_DEFAULTS, ...saved };
  } catch {
    return { ...BOT_DEFAULTS };
  }
}

export function saveBotSettings(settings) {
  localStorage.setItem(SETTINGS_KEY_BOT, JSON.stringify(settings));
}

export function saveSettings(settings) {
  saveBotSettings(settings);
}

// ===== User Settings =====

export function getUserSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY_USER);
    if (!raw) return { ...USER_DEFAULTS };
    const saved = JSON.parse(raw);
    return { ...USER_DEFAULTS, ...saved };
  } catch {
    return { ...USER_DEFAULTS };
  }
}

export function saveUserSettings(settings) {
  localStorage.setItem(SETTINGS_KEY_USER, JSON.stringify(settings));
}

// ===== Shared Exports =====

export function getChunkSizeOptions() {
  return CHUNK_SIZES;
}

export function getDefaults() {
  return { ...BOT_DEFAULTS };
}

export function getUserDefaults() {
  return { ...USER_DEFAULTS };
}

/**
 * Auto-tune chunk size by trying different sizes and measuring throughput.
 * @param {Function} downloadTestChunk - async function(chunkSize) that downloads a test chunk and returns { bytes, ms }
 * @returns {number} The best performing chunk size
 */
export async function autoTuneChunkSize(downloadTestChunk) {
  const settings = getBotSettings();
  const sizesToTry = [524288, 262144, 131072]; // Try 512K, 256K, 128K
  let bestSize = 524288;
  let bestSpeed = 0;

  for (const size of sizesToTry) {
    try {
      const result = await downloadTestChunk(size);
      const speed = result.bytes / (result.ms / 1000); // bytes/sec
      if (speed > bestSpeed) {
        bestSpeed = speed;
        bestSize = size;
      }
    } catch {
      continue;
    }
  }

  settings.bestChunkSize = bestSize;
  settings.autoChunkSize = true;
  saveBotSettings(settings);
  return bestSize;
}
