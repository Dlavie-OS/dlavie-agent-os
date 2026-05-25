import { cfg, phoneFromJid } from '../../core/config.js';

function cleanPhone(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

function extractText(message = {}) {
  if (message.type === 'text') return message.text?.body || '';
  if (message.type === 'button') return message.button?.text || message.button?.payload || '';
  if (message.type === 'interactive') {
    return (
      message.interactive?.button_reply?.title ||
      message.interactive?.button_reply?.id ||
      message.interactive?.list_reply?.title ||
      message.interactive?.list_reply?.id ||
      ''
    );
  }
  return '';
}

function normalizeMetaMessage({ message, contact, metadata }) {
  const from = cleanPhone(message?.from || contact?.wa_id || '');
  const text = extractText(message).trim();
  const ownerPhone = cleanPhone(cfg.owner);

  return {
    rawMessage: message,
    remoteJid: from,
    chatId: from,
    senderId: from,
    fromMe: false,
    isOwner: Boolean(ownerPhone && from === ownerPhone),
    isGroup: false,
    isLid: false,
    text,
    messageId: message?.id || '',
    timestamp: Number(message?.timestamp || Date.now()),
    provider: 'meta-cloud',
    contactName: contact?.profile?.name || '',
    metadata: metadata || null
  };
}

export async function createMetaCloudAdapter({ logger, store }) {
  let messageHandler = async () => {};

  function onMessage(handler) {
    messageHandler = handler;
  }

  async function connect() {
    store.setConnection('open', cfg.metaPhoneNumberId);
    logger.info('Meta Cloud API adapter active. No QR/pairing code is needed.');
    logger.info(`Webhook verify URL: ${cfg.publicWebhookUrl || '/webhook'}`);
    logger.info(`Graph API version: ${cfg.metaGraphVersion}`);
    return { provider: 'meta-cloud', phoneNumberId: cfg.metaPhoneNumberId };
  }

  function verifyWebhook(query = {}) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === cfg.metaVerifyToken) {
      logger.info('Meta webhook verification accepted.');
      return { ok: true, challenge };
    }

    logger.warn('Meta webhook verification rejected. Check META_VERIFY_TOKEN.');
    return { ok: false, challenge: null };
  }

  async function handleWebhook(body = {}) {
    if (body.object !== 'whatsapp_business_account') {
      logger.warn(`ignored webhook object=${body.object || 'unknown'}`);
      return { ok: true, ignored: true };
    }

    const entries = Array.isArray(body.entry) ? body.entry : [];
    let handled = 0;

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];

      for (const change of changes) {
        const value = change.value || {};
        const messages = Array.isArray(value.messages) ? value.messages : [];
        const contacts = Array.isArray(value.contacts) ? value.contacts : [];
        const metadata = value.metadata || null;

        for (const message of messages) {
          const contact = contacts.find((item) => cleanPhone(item.wa_id) === cleanPhone(message.from)) || contacts[0] || null;
          const ctx = normalizeMetaMessage({ message, contact, metadata });

          if (!ctx.text) {
            logger.info(`ignored non-text message id=${ctx.messageId} type=${message.type}`);
            continue;
          }

          handled += 1;
          await messageHandler(ctx);
        }
      }
    }

    return { ok: true, handled };
  }

  async function sendText(to, text) {
    const phone = cleanPhone(phoneFromJid(to) || to);
    if (!phone) throw new Error('Meta Cloud API target phone is empty.');
    if (!cfg.metaAccessToken) throw new Error('META_ACCESS_TOKEN belum diisi.');
    if (!cfg.metaPhoneNumberId) throw new Error('META_PHONE_NUMBER_ID belum diisi.');

    const url = `https://graph.facebook.com/${cfg.metaGraphVersion}/${cfg.metaPhoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'text',
      text: {
        preview_url: false,
        body: String(text || '')
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.metaAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = data?.error?.message || response.statusText || 'Meta Cloud API send failed';
      const code = data?.error?.code ? ` code=${data.error.code}` : '';
      throw new Error(`${msg}${code}`);
    }

    return {
      provider: 'meta-cloud',
      id: data?.messages?.[0]?.id || null,
      raw: data,
      key: { id: data?.messages?.[0]?.id || 'meta-cloud' }
    };
  }

  return {
    connect,
    sendText,
    onMessage,
    verifyWebhook,
    handleWebhook,
    getSocket: () => null
  };
}
