import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { cfg } from '../../core/config.js';
import { parseBaileysMessage } from './message-parser.js';
import { printPairingBox } from '../../core/console-theme.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectionCode(update) {
  const error = update?.lastDisconnect?.error;
  return new Boom(error)?.output?.statusCode || error?.output?.statusCode || null;
}

export async function createDlavieBaileysAdapter({ logger, store }) {
  let sock = null;
  let saveCreds = null;
  let messageHandler = async () => {};
  let reconnecting = false;
  let pairingInFlight = false;
  let lastPairingAt = 0;

  async function requestPairingCode(reason = 'manual') {
    if (pairingInFlight) return;
    if (sock?.authState?.creds?.registered) return;
    if (!cfg.phone) return;

    pairingInFlight = true;
    lastPairingAt = Date.now();
    await sleep(1200);

    try {
      const code = cfg.pairingCustomEnabled
        ? await sock.requestPairingCode(cfg.phone, cfg.pairingCode)
        : await sock.requestPairingCode(cfg.phone);

      printPairingBox({
        phone: cfg.phone,
        custom: cfg.pairingCode || '-',
        code,
        customEnabled: cfg.pairingCustomEnabled,
        reason
      });
    } catch (error) {
      logger.warn(`pairing request failed: ${error.message}`);
    } finally {
      pairingInFlight = false;
    }
  }

  async function requestFreshPairingCode(reason = 'refresh') {
    const age = Date.now() - lastPairingAt;
    if (age < 35000) {
      logger.info(`pairing code still fresh age=${Math.round(age / 1000)}s`);
      return;
    }
    await requestPairingCode(reason);
  }

  async function connect() {
    const { state, saveCreds: saver } = await useMultiFileAuthState(cfg.sessionDir);
    saveCreds = saver;
    pairingInFlight = false;
    lastPairingAt = 0;
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info(`using WA version ${version.join('.')} latest=${isLatest}`);

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Dlavie Agent OS', 'Chrome', '1.0.0'],
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
      if (qr) {
        logger.info('QR received but ignored. Requesting fresh pairing code instead.');
        await requestFreshPairingCode('qr-cycle');
      }

      if (connection === 'connecting') {
        store.setConnection('connecting');
        logger.info('connection connecting');
        await requestFreshPairingCode('connecting');
      }

      if (connection === 'open') {
        reconnecting = false;
        pairingInFlight = false;
        lastPairingAt = 0;
        const jid = sock.user?.id || sock.user?.jid || null;
        store.setConnection('open', jid);
        logger.info('connection open');
        logger.info(`connected as ${jid || 'unknown'}`);
      }

      if (connection === 'close') {
        const code = connectionCode(update);
        store.setConnection(`close:${code || 'unknown'}`);
        logger.warn(`connection close code=${code || '-'} reason=${DisconnectReason[code] || 'unknown'}`);

        const shouldReconnect = code !== DisconnectReason.loggedOut && cfg.autoReconnect;
        if (shouldReconnect && !reconnecting) {
          reconnecting = true;
          setTimeout(() => {
            connect().catch((error) => logger.error(`reconnect failed: ${error.message}`));
          }, 3000);
        }
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

    await requestPairingCode('initial');
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
