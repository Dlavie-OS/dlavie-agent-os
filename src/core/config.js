import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const CONFIG_FILE = path.join(ROOT, 'config.json');

const DEFAULT_CONFIG = {
  BOT_NAME: 'Dlavie Agent OS',
  WA_PHONE_NUMBER: '628xxxxxxxxxx',
  OWNER_NUMBER: '628xxxxxxxxxx',
  OWNER_JIDS: [],
  PORT: 8787,
  PRIVATE_ONLY: false,
  SESSION_DIR: './data/session',
  DATA_DIR: './data',
  PAIRING_CUSTOM_ENABLED: false,
  PAIRING_CODE: '',
  PAIRING_RETRY_MS: 45000,
  AUTO_RECONNECT: true,
  RATE_LIMIT_WINDOW_MS: 10000,
  RATE_LIMIT_MAX: 15,
  UI_MODE: 'hybrid',
  UI_FALLBACK_MODE: 'ios-safe',
  MENU_MEDIA_ENABLED: false,
  MENU_THUMBNAIL_MP4_URL: '',
  MENU_THUMBNAIL_IMAGE_URL: '',
  WATERMARK_ENABLED: true,
  WATERMARK_TEXT: '⚡ Powered by Dlavie Cloud',
  GIT_BRANCH: 'dlavie-agent-os-v1',
  DLAVIE_APP_URL: 'https://dlaviecomerce.vercel.app',
  DLAVIE_API_BASE_URL: 'https://dlaviecomerce.vercel.app/api',
  BOT_GATE_KEY: '',
  LOG_LEVEL: 'info',
  CONSOLE_ANIMATION_ENABLED: true
};

export function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback = {}) {
  try {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
  } catch (error) {
    console.warn(`[config] failed to read ${file}: ${error.message}`);
    return fallback;
  }
}

function digits(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

function list(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function bool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  return fallback;
}

const raw = { ...DEFAULT_CONFIG, ...readJson(CONFIG_FILE, {}) };
const customPairingEnabled = bool(raw.PAIRING_CUSTOM_ENABLED, false);
const normalizedPairingCode = String(raw.PAIRING_CODE || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

export const cfg = {
  ...raw,
  botName: String(raw.BOT_NAME || DEFAULT_CONFIG.BOT_NAME),
  phone: digits(raw.WA_PHONE_NUMBER),
  owner: digits(raw.OWNER_NUMBER),
  ownerJids: list(raw.OWNER_JIDS),
  port: Number(process.env.PORT || raw.PORT) || DEFAULT_CONFIG.PORT,
  privateOnly: raw.PRIVATE_ONLY === true,
  pairingCustomEnabled: customPairingEnabled,
  pairingCode: customPairingEnabled ? normalizedPairingCode : '',
  pairingRetryMs: Math.max(Number(raw.PAIRING_RETRY_MS) || DEFAULT_CONFIG.PAIRING_RETRY_MS, 15000),
  autoReconnect: raw.AUTO_RECONNECT !== false,
  dataDir: path.resolve(ROOT, raw.DATA_DIR || DEFAULT_CONFIG.DATA_DIR),
  sessionDir: path.resolve(ROOT, raw.SESSION_DIR || DEFAULT_CONFIG.SESSION_DIR),
  rateWindowMs: Number(raw.RATE_LIMIT_WINDOW_MS) || DEFAULT_CONFIG.RATE_LIMIT_WINDOW_MS,
  rateMax: Number(raw.RATE_LIMIT_MAX) || DEFAULT_CONFIG.RATE_LIMIT_MAX,
  uiMode: String(raw.UI_MODE || DEFAULT_CONFIG.UI_MODE),
  uiFallbackMode: String(raw.UI_FALLBACK_MODE || DEFAULT_CONFIG.UI_FALLBACK_MODE),
  menuMediaEnabled: raw.MENU_MEDIA_ENABLED === true,
  menuThumbnailMp4Url: String(raw.MENU_THUMBNAIL_MP4_URL || ''),
  menuThumbnailImageUrl: String(raw.MENU_THUMBNAIL_IMAGE_URL || ''),
  watermarkEnabled: raw.WATERMARK_ENABLED !== false,
  watermarkText: String(raw.WATERMARK_TEXT || DEFAULT_CONFIG.WATERMARK_TEXT),
  branch: String(raw.GIT_BRANCH || DEFAULT_CONFIG.GIT_BRANCH),
  appUrl: String(raw.DLAVIE_APP_URL || '').replace(/\/$/, ''),
  apiBase: String(raw.DLAVIE_API_BASE_URL || '').replace(/\/$/, ''),
  gateKey: String(raw.BOT_GATE_KEY || '').trim(),
  logLevel: String(raw.LOG_LEVEL || DEFAULT_CONFIG.LOG_LEVEL),
  consoleAnimationEnabled: raw.CONSOLE_ANIMATION_ENABLED !== false
};

ensureDir(cfg.dataDir);
ensureDir(cfg.sessionDir);

export function jidFromPhone(phone) {
  const d = digits(phone);
  return d ? `${d}@s.whatsapp.net` : '';
}

export function phoneFromJid(jid) {
  return digits(String(jid || '').split('@')[0]);
}

export function ownerJids() {
  return Array.from(new Set([jidFromPhone(cfg.owner), ...cfg.ownerJids].filter(Boolean)));
}

export function assertConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    throw new Error('config.json belum ada. Copy config.example.json menjadi config.json lalu isi WA_PHONE_NUMBER dan OWNER_NUMBER.');
  }
  if (!cfg.phone || cfg.phone.includes('x') || cfg.phone.length < 10) {
    throw new Error('WA_PHONE_NUMBER belum valid. Isi nomor lengkap, contoh: 6285725483343. Jangan hanya 628.');
  }
  if (!cfg.owner || cfg.owner.includes('x') || cfg.owner.length < 10) {
    throw new Error('OWNER_NUMBER belum valid. Isi nomor lengkap, contoh: 62882007437216.');
  }
  if (cfg.pairingCustomEnabled && cfg.pairingCode.length < 6) {
    throw new Error('PAIRING_CUSTOM_ENABLED aktif, tetapi PAIRING_CODE kurang dari 6 karakter. Matikan PAIRING_CUSTOM_ENABLED atau isi kode valid.');
  }
}

export function publicConfig() {
  return {
    botName: cfg.botName,
    phone: cfg.phone,
    owner: cfg.owner,
    port: cfg.port,
    privateOnly: cfg.privateOnly,
    uiMode: cfg.uiMode,
    branch: cfg.branch,
    appUrl: cfg.appUrl,
    pairingCustomEnabled: cfg.pairingCustomEnabled
  };
}
