import express from 'express';
import { cfg, assertConfig, publicConfig } from './config.js';
import { createLogger } from './logger.js';
import { createStore } from './store.js';
import { createPluginManager } from './plugin-manager.js';
import { createUiEngine } from './ui-engine.js';
import { createDeliveryGuard } from './delivery-guard.js';
import { createRouter } from './router.js';
import { printDlavieBanner, bootPulse } from './console-theme.js';
import { createMetaCloudAdapter } from '../adapters/meta-cloud/index.js';
import { createDlavieBaileysAdapter } from '../adapters/dlavie-baileys/index.js';

async function createWhatsAppAdapter({ logger, store }) {
  if (cfg.provider === 'meta-cloud') {
    return createMetaCloudAdapter({ logger, store });
  }

  return createDlavieBaileysAdapter({ logger, store });
}

export async function createApp() {
  assertConfig();
  printDlavieBanner(cfg);
  await bootPulse(cfg.consoleAnimationEnabled);

  const logger = createLogger('dlavie');
  const store = createStore();
  const pluginManager = createPluginManager(createLogger('plugins'));
  const ui = createUiEngine();
  const adapter = await createWhatsAppAdapter({ logger: createLogger('wa'), store });
  const delivery = createDeliveryGuard({ adapter, store, logger: createLogger('send') });
  const router = createRouter({ pluginManager, delivery, ui, store, logger: createLogger('router') });

  adapter.onMessage(router.handleMessage);

  const http = express();
  http.use(express.json({ limit: '2mb' }));

  http.get('/', (req, res) => {
    res.json({
      ok: true,
      name: 'Dlavie Agent OS',
      phase: 'phase1-meta-cloud',
      config: publicConfig(),
      stats: store.stats
    });
  });

  http.get('/health', (req, res) => {
    res.json({ ok: true, uptimeMs: store.uptimeMs(), stats: store.stats });
  });

  http.get('/webhook', (req, res) => {
    if (typeof adapter.verifyWebhook !== 'function') {
      res.status(404).send('Webhook provider is not active.');
      return;
    }

    const result = adapter.verifyWebhook(req.query || {});
    if (!result.ok) {
      res.sendStatus(403);
      return;
    }

    res.status(200).send(String(result.challenge || ''));
  });

  http.post('/webhook', async (req, res) => {
    if (typeof adapter.handleWebhook !== 'function') {
      res.status(404).json({ ok: false, error: 'Webhook provider is not active.' });
      return;
    }

    try {
      const result = await adapter.handleWebhook(req.body || {});
      res.status(200).json(result);
    } catch (error) {
      store.markError(error);
      logger.error(`webhook failed: ${error.stack || error.message}`);
      res.status(200).json({ ok: false, error: error.message });
    }
  });

  // Local-only simulation endpoint for debugging command routing without WhatsApp.
  http.post('/simulate', async (req, res) => {
    const text = String(req.body?.text || 'menu');
    const fakeReplies = [];
    const fakeCtx = {
      rawMessage: null,
      remoteJid: 'simulate',
      chatId: 'simulate',
      senderId: 'simulate',
      fromMe: false,
      isOwner: true,
      isGroup: false,
      isLid: false,
      text,
      messageId: 'simulate',
      timestamp: Date.now(),
      provider: cfg.provider
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
