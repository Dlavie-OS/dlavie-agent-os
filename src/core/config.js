import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const CONFIG_FILE = path.join(ROOT, 'config.json');

const DEFAULT_CONFIG = {
  BOT_NAME: 'Dlavie Agent OS',
  WA_PROVIDER: 'meta-cloud',
  WA_PHONE_NUMBER: '628xxxxxxxxxx',
  OWNER_NUMBER: '628xxxxxxxxxx',
  OWNER_JIDS: [],
  PORT: 8787,
  PRIVATE_ONLY: false,
  SESSION_DIR: './data/session',
  DATA_DIR: './data',
  AUTO_RECONNECT: true,
  RATE_LIMIT_WINDOW_MS: 10000,
  RATE_LIMIT_MAX: 15,
  UI_MODE: 'text',
  UI_FALLBACK_MODE: 'meta-safe',
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
  CONSOLE_ANIMATION_ENABLED: true,
  META_GRAPH_VERSION: 'v20.0',
  META_PHONE_NUMBER_ID: '',
  META_BUSINESS_ACCOUNT_ID: '',
  META_ACCESS_TOKEN: '',
  META_VERIFY_TOKEN: 'dlavie_cloud_verify',
  META_APP_SECRET: '',
  META_PUBLIC_WEBHOOK_URL: ''
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

const raw = { ...DEFAULT_CONFIG, ...readJson(CONFIG_FILE, {}) };
const provider = String(raw.WA_PROVIDER || 'meta-cloud').trim().toLowerCase();

export const cfg = {
  ...raw,
  provider,
  botName: String(raw.BOT_NAME || DEFAULT_CONFIG.BOT_NAME),
  phone: digits(raw.WA_PHONE_NUMBER),
  owner: digits(raw.OWNER_NUMBER),
  ownerJids: list(raw.OWNER_JIDS),
  port: Number(process.env.PORT || raw.PORT) || DEFAULT_CONFIG.PORT,
  privateOnly: raw.PRIVATE_ONLY === true,
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
  consoleAnimationEnabled: raw.CONSOLE_ANIMATION_ENABLED !== false,
  metaGraphVersion: String(raw.META_GRAPH_VERSION || DEFAULT_CONFIG.META_GRAPH_VERSION).trim(),
  metaPhoneNumberId: String(raw.META_PHONE_NUMBER_ID || '').trim(),
  metaBusinessAccountId: String(raw.META_BUSINESS_ACCOUNT_ID || '').trim(),
  metaAccessToken: String(raw.META_ACCESS_TOKEN || '').trim(),
  metaVerifyToken: String(raw.META_VERIFY_TOKEN || DEFAULT_CONFIG.META_VERIFY_TOKEN).trim(),
  metaAppSecret: String(raw.META_APP_SECRET || '').trim(),
  publicWebhookUrl: String(raw.META_PUBLIC_WEBHOOK_URL || '').trim()
};

ensureDir(cfg.dataDir);
if (cfg.provider !== 'meta-cloud') ensureDir(cfg.sessionDir);

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
    throw new Error('config.json belum ada. Copy config.example.json menjadi config.json lalu isi konfigurasi Dlavie.');
  }

  if (!['meta-cloud', 'baileys'].includes(cfg.provider)) {
    throw new Error('WA_PROVIDER tidak valid. Gunakan meta-cloud atau baileys.');
  }

  if (!cfg.owner || cfg.owner.includes('x') || cfg.owner.length < 10) {
    throw new Error('OWNER_NUMBER belum valid. Isi nomor lengkap, contoh: 62882007437216.');
  }

  if (cfg.provider === 'meta-cloud') {
    if (!cfg.metaPhoneNumberId) throw new Error('META_PHONE_NUMBER_ID belum diisi. Ambil dari WhatsApp > API Setup di Meta Developers.');
    if (!cfg.metaAccessToken) throw new Error('META_ACCESS_TOKEN belum diisi. Buat token dari Meta Developers/System User.');
    if (!cfg.metaVerifyToken) throw new Error('META_VERIFY_TOKEN belum diisi. Buat bebas, lalu samakan di Webhook Meta.');
    return;
  }

  if (!cfg.phone || cfg.phone.includes('x') || cfg.phone.length < 10) {
    throw new Error('WA_PHONE_NUMBER belum valid. Isi nomor lengkap, contoh: 6285725483343. Jangan hanya 628.');
  }
}

export function publicConfig() {
  return {
    botName: cfg.botName,
    provider: cfg.provider,
    phone: cfg.phone,
    owner: cfg.owner,
    port: cfg.port,
    privateOnly: cfg.privateOnly,
    uiMode: cfg.uiMode,
    branch: cfg.branch,
    appUrl: cfg.appUrl,
    metaPhoneNumberId: cfg.provider === 'meta-cloud' ? cfg.metaPhoneNumberId : undefined,
    publicWebhookUrl: cfg.publicWebhookUrl || undefined
  };
}
