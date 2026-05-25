import { parseCommand } from './command-registry.js';
import { canUsePlugin } from './permissions.js';

export function createRouter({ pluginManager, delivery, ui, store, logger }) {
  async function handleMessage(ctx) {
    store.stats.messagesIn += 1;
    store.stats.lastMessageAt = Date.now();

    if (ctx.fromMe) {
      store.stats.messagesSkipped += 1;
      logger.info(`skip fromMe remote=${ctx.remoteJid}`);
      return;
    }

    const parsed = parseCommand(ctx.text);
    logger.info(`msg-in remote=${ctx.remoteJid} sender=${ctx.senderId} owner=${ctx.isOwner} lid=${ctx.isLid} text=${ctx.text}`);

    if (!parsed.command) return;

    const plugin = pluginManager.find(parsed.command);
    if (!plugin) {
      await delivery.reply(ctx, [
        'Command tidak dikenal.',
        '',
        'Ketik menu untuk melihat daftar command.',
        'Ketik /help <command> untuk panduan.'
      ].join('\n'));
      return;
    }

    const permission = canUsePlugin(ctx, plugin);
    if (!permission.ok) {
      await delivery.reply(ctx, permission.reason);
      return;
    }

    try {
      const api = {
        ui,
        delivery,
        registry: pluginManager.registry,
        store,
        logger,
        reply: (text, options = {}) => delivery.reply(ctx, text, options)
      };
      const result = await plugin.run({ ...ctx, parsed }, api);
      if (typeof result === 'string' && result.trim()) {
        await delivery.reply(ctx, result);
      }
    } catch (error) {
      store.stats.pluginErrors += 1;
      store.markError(error);
      logger.error(`plugin error ${plugin.id}: ${error.stack || error.message}`);
      await delivery.reply(ctx, 'Terjadi error pada plugin, tapi engine tetap aktif. Ketik /health untuk cek status.');
    }
  }

  return { handleMessage };
}
