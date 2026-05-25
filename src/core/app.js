import express from 'express';
import { cfg, assertConfig, publicConfig } from './config.js';
import { createLogger } from './logger.js';
import { createStore } from './store.js';
import { createPluginManager } from './plugin-manager.js';
import { createUiEngine } from './ui-engine.js';
import { createDeliveryGuard } from './delivery-guard.js';
import { createRouter } from './router.js';
import { createDlavieBaileysAdapter } from '../adapters/dlavie-baileys/index.js';

export async function createApp() {
  assertConfig();

  const logger = createLogger('dlavie');
  const store = createStore();
  const pluginManager = createPluginManager(createLogger('plugins'));
  const ui = createUiEngine();
  const adapter = await createDlavieBaileysAdapter({ logger: createLogger('wa'), store });
  const delivery = createDeliveryGuard({ adapter, store, logger: createLogger('send') });
  const router = createRouter({ pluginManager, delivery, ui, store, logger: createLogger('router') });

  adapter.onMessage(router.handleMessage);

  const http = express();
  http.use(express.json({ limit: '1mb' }));

  http.get('/', (req, res) => {
    res.json({
      ok: true,
      name: 'Dlavie Agent OS',
      phase: 'phase1',
      config: publicConfig(),
      stats: store.stats
    });
  });

  http.get('/health', (req, res) => {
    res.json({ ok: true, uptimeMs: store.uptimeMs(), stats: store.stats });
  });

  // Local-only simulation endpoint for debugging command routing without WhatsApp.
  http.post('/simulate', async (req, res) => {
    const text = String(req.body?.text || 'menu');
    const fakeReplies = [];
    const fakeCtx = {
      rawMessage: null,
      remoteJid: 'simulate@s.whatsapp.net',
      chatId: 'simulate@s.whatsapp.net',
      senderId: 'simulate@s.whatsapp.net',
      fromMe: false,
      isOwner: true,
      isGroup: false,
      isLid: false,
      text,
      messageId: 'simulate',
      timestamp: Date.now()
    };

    const simulatedDelivery = {
      ...delivery,
      reply: async (_ctx, body) => {
        fakeReplies.push(String(body));
        return { simulated: true };
      }
    };
    const simulatedRouter = createRouter({ pluginManager, delivery: simulatedDelivery, ui, store, logger: createLogger('simulate') });
    await simulatedRouter.handleMessage(fakeCtx);
    res.json({ ok: true, text, replies: fakeReplies });
  });

  async function start() {
    http.listen(cfg.port, () => logger.info(`http listening ${cfg.port}`));
    await adapter.connect();
  }

  return { start, logger, store, adapter, pluginManager, ui, delivery, router };
}
