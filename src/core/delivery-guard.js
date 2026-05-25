import { appendWatermark } from './watermark.js';
import { ownerJids } from './config.js';

export function createDeliveryGuard({ adapter, store, logger }) {
  async function sendText(ctx, text, options = {}) {
    const message = appendWatermark(text);
    const targets = [];
    const primary = options.to || ctx?.chatId || ctx?.remoteJid;
    if (primary) targets.push(primary);

    // Owner mirror is diagnostic only. It helps when WA LID delivery accepts a send but the chat does not render.
    if (options.mirrorOwner) {
      for (const owner of ownerJids()) {
        if (owner && !targets.includes(owner)) targets.push(owner);
      }
    }

    let lastError = null;
    for (const to of targets) {
      try {
        const sent = await adapter.sendText(to, message, {
          quoted: options.quoted === false ? null : ctx?.rawMessage,
          forcePlain: options.forcePlain === true
        });
        store.stats.messagesOut += 1;
        store.stats.lastSendAt = Date.now();
        logger.info(`sent text to ${to} id=${sent?.key?.id || 'unknown'}`);
        return sent;
      } catch (error) {
        lastError = error;
        store.stats.sendErrors += 1;
        store.markError(error);
        logger.warn(`send failed to ${to}: ${error.message}`);
      }
    }

    throw lastError || new Error('No delivery target available.');
  }

  async function reply(ctx, text, options = {}) {
    return sendText(ctx, text, { ...options, mirrorOwner: options.mirrorOwner ?? false });
  }

  return { sendText, reply };
}
