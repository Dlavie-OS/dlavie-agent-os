import * as baileys from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { cfg } from '../../core/config.js';
import { parseBaileysMessage } from './message-parser.js';
import { printPairingBox } from '../../core/console-theme.js';

const makeWASocket =
  (typeof baileys.default === 'function' && baileys.default) ||
  (typeof baileys.makeWASocket === 'function' && baileys.makeWASocket) ||
  (typeof baileys.default?.makeWASocket === 'function' && baileys.default.makeWASocket) ||
  (typeof baileys.default?.default === 'function' && baileys.default.default);

const DisconnectReason = baileys.DisconnectReason || baileys.default?.DisconnectReason || {};
const fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion || baileys.default?.fetchLatestBaileysVersion;
const useMultiFileAuthState = baileys.useMultiFileAuthState || baileys.default?.useMultiFileAuthState;
const makeCacheableSignalKeyStore = baileys.makeCacheableSignalKeyStore || baileys.default?.makeCacheableSignalKeyStore;

const PAIRING_RECONNECT_DELAY_MS = 60000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectionCode(update) {
  const error = update?.lastDisconnect?.error;
  return new Boom(error)?.output?.statusCode || error?.output?.statusCode || null;
}

function assertBaileysRuntime() {
  const missing = [];
  if (typeof makeWASocket !== 'function') missing.push('makeWASocket');
  if (typeof fetchLatestBaileysVersion !== 'function') missing.push('fetchLatestBaileysVersion');
  if (typeof useMultiFileAuthState !== 'function') missing.push('useMultiFileAuthState');
  if (missing.length) {
    throw new Error(`Baileys runtime tidak kompatibel. Missing: ${missing.join(', ')}. Jalankan npm install ulang.`);
  }
}

function buildAuthState(state, waLogger) {
  if (typeof makeCacheableSignalKeyStore === 'function') {
    return {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, waLogger)
    };
  }
  return state;
}

export async function createDlavieBaileysAdapter({ logger, store }) {
  assertBaileysRuntime();

  let sock = null;
  let saveCreds = null;
  let messageHandler = async () => {};
  let reconnecting = false;
  let pairingInFlight = false;
  let pairingPrinted = false;
  let pairingCodeCreatedAt = 0;

  const waLogger = pino({ level: process.env.BAILEYS_LOG_LEVEL || 'silent' });

  async function requestPairingCode(reason = 'qr-event') {
    if (pairingInFlight) return;
    if (pairingPrinted) {
      const age = Math.round((Date.now() - pairingCodeCreatedAt) / 1000);
      logger.info(`pairing code already printed age=${age}s; waiting for user input, no new code generated`);
      return;
    }
    if (sock?.authState?.creds?.registered) return;
    if (!cfg.phone) return;

    pairingInFlight = true;
    await sleep(1200);

    try {
      const code = cfg.pairingCustomEnabled
        ? await sock.requestPairingCode(cfg.phone, cfg.pairingCode)
        : await sock.requestPairingCode(cfg.phone);

      pairingPrinted = true;
      pairingCodeCreatedAt = Date.now();
      printPairingBox({
        phone: cfg.phone,
        custom: cfg.pairingCode || '-',
        code,
        customEnabled: cfg.pairingCustomEnabled,
        reason
      });
      logger.info(`pairing code printed reason=${reason}`);
      logger.info('Dlavie pairing lock active: engine will not generate another code immediately.');
    } catch (error) {
      pairingPrinted = false;
      pairingCodeCreatedAt = 0;
      logger.warn(`pairing request failed: ${error.message}`);
    } finally {
      pairingInFlight = false;
    }
  }

  function scheduleReconnect(delayMs, label) {
    if (!cfg.autoReconnect || reconnecting) return;
    reconnecting = true;
    logger.warn(`reconnect scheduled in ${Math.round(delayMs / 1000)}s reason=${label}`);
    setTimeout(() => {
      reconnecting = false;
      if (label === 'pairing-window-expired') {
        pairingPrinted = false;
        pairingCodeCreatedAt = 0;
      }
      connect().catch((error) => logger.error(`reconnect failed: ${error.message}`));
    }, delayMs);
  }

  async function connect() {
    const { state, saveCreds: saver } = await useMultiFileAuthState(cfg.sessionDir);
    saveCreds = saver;
    pairingInFlight = false;

    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info(`using WA version ${version.join('.')} latest=${isLatest}`);

    sock = makeWASocket({
      version,
      auth: buildAuthState(state, waLogger),
      printQRInTerminal: false,
      logger: waLogger,
      browser: ['Ubuntu', 'Chrome', '20.0.00'],
      markOnlineOnConnect: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, qr } = update;

      if (qr && !sock.authState?.creds?.registered) {
        logger.info('QR event received; requesting pairing code instead of showing QR.');
        await requestPairingCode('qr-event');
      }

      if (connection === 'connecting') {
        store.setConnection('connecting');
        logger.info('connection connecting');
      }

      if (connection === 'open') {
        reconnecting = false;
        pairingInFlight = false;
        pairingPrinted = true;
        const jid = sock.user?.id || sock.user?.jid || null;
        store.setConnection('open', jid);
        logger.info('connection open');
        logger.info(`connected as ${jid || 'unknown'}`);
      }

      if (connection === 'close') {
        const code = connectionCode(update);
        const reason = DisconnectReason?.[code] || 'unknown';
        const registered = Boolean(sock?.authState?.creds?.registered);
        store.setConnection(`close:${code || 'unknown'}`);
        logger.warn(`connection close code=${code || '-'} reason=${reason} registered=${registered}`);

        if (code === DisconnectReason?.loggedOut || code === 401) {
          logger.warn('WhatsApp rejected/logged out this session. Delete data/session before pairing again.');
          return;
        }

        if (!registered && pairingPrinted) {
          logger.warn('pairing window closed before login. Dlavie will wait before creating a new code to avoid invalidating codes repeatedly.');
          scheduleReconnect(PAIRING_RECONNECT_DELAY_MS, 'pairing-window-expired');
          return;
        }

        scheduleReconnect(5000, 'normal-disconnect');
      }
    });

    sock.ev.on('messages.upsert', async (event) => {
      const ctx = parseBaileysMessage(event);
      if (!ctx) return;
      try {
        await messageHandler(ctx);
      } catch (error) {
        store.markError(error);
        logger.error(`message handler failed: ${error.stack || error.message}`);
      }
    });

    return sock;
  }

  async function sendText(jid, text, options = {}) {
    if (!sock) throw new Error('WhatsApp socket not connected yet.');
    const payload = { text: String(text || '') };

    if (options.quoted && !options.forcePlain) {
      try {
        return await sock.sendMessage(jid, payload, { quoted: options.quoted });
      } catch (error) {
        logger.warn(`quoted send failed, fallback plain: ${error.message}`);
      }
    }

    return sock.sendMessage(jid, payload);
  }

  function onMessage(handler) {
    messageHandler = handler;
  }

  return {
    connect,
    sendText,
    onMessage,
    getSocket: () => sock
  };
}
