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
  let pairingRequested = false;

  async function requestPairingIfNeeded() {
    if (pairingRequested) return;
    if (!sock?.authState?.creds?.registered && cfg.phone) {
      pairingRequested = true;
      await sleep(2500);
      try {
        const code = cfg.pairingCustomEnabled
          ? await sock.requestPairingCode(cfg.phone, cfg.pairingCode)
          : await sock.requestPairingCode(cfg.phone);

        printPairingBox({
          phone: cfg.phone,
          custom: cfg.pairingCode || '-',
          code,
          customEnabled: cfg.pairingCustomEnabled
        });
      } catch (error) {
        pairingRequested = false;
        logger.warn(`pairing request failed: ${error.message}`);
      }
    }
  }

  async function connect() {
    const { state, saveCreds: saver } = await useMultiFileAuthState(cfg.sessionDir);
    saveCreds = saver;
    pairingRequested = false;
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
      generateHighQualityLinkPreview: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, qr } = update;
      if (qr) {
        logger.info('QR received but ignored. Pairing-code-only mode is active.');
        await requestPairingIfNeeded();
      }

      if (connection === 'connecting') {
        store.setConnection('connecting');
        logger.info('connection connecting');
        await requestPairingIfNeeded();
      }

      if (connection === 'open') {
        reconnecting = false;
        pairingRequested = false;
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

    await requestPairingIfNeeded();
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
