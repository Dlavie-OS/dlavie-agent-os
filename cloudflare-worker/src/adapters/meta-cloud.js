import { cleanPhone, getConfig } from '../core/config.js';

export function extractInboundText(message = {}) {
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

export function normalizeInboundMessage(message, contacts = []) {
  const from = cleanPhone(message?.from);
  const contact = contacts.find((item) => cleanPhone(item.wa_id) === from) || contacts[0] || null;

  return {
    from,
    text: extractInboundText(message).trim(),
    type: message?.type || 'unknown',
    id: message?.id || '',
    userName: contact?.profile?.name || ''
  };
}

export async function sendMetaPayload(env, payload) {
  const cfg = getConfig(env);
  if (!cfg.accessToken) throw new Error('META_ACCESS_TOKEN belum diisi.');
  if (!cfg.phoneNumberId) throw new Error('META_PHONE_NUMBER_ID belum diisi.');

  const response = await fetch(`https://graph.facebook.com/${cfg.graphVersion}/${cfg.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${cfg.accessToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const metaMessage = data?.error?.message || response.statusText || 'Meta send failed';
    const metaCode = data?.error?.code ? ` code=${data.error.code}` : '';
    throw new Error(`${metaMessage}${metaCode}`);
  }

  return data;
}

export async function sendText(env, to, body) {
  return sendMetaPayload(env, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone(to),
    type: 'text',
    text: {
      preview_url: false,
      body: String(body || '')
    }
  });
}
