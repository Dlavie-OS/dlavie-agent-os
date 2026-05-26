const DEFAULTS = {
  BOT_NAME: 'Dlavie Agent OS',
  META_GRAPH_VERSION: 'v20.0',
  META_VERIFY_TOKEN: 'dlavie_cloud_verify',
  WATERMARK_TEXT: '⚡ Powered by Dlavie Cloud',
  DLAVIE_APP_URL: 'https://dlaviecomerce.vercel.app'
};

function cleanPhone(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

function settings(env) {
  return {
    botName: env.BOT_NAME || DEFAULTS.BOT_NAME,
    graphVersion: env.META_GRAPH_VERSION || DEFAULTS.META_GRAPH_VERSION,
    verifyToken: env.META_VERIFY_TOKEN || DEFAULTS.META_VERIFY_TOKEN,
    phoneNumberId: env.META_PHONE_NUMBER_ID || '',
    accessToken: env.META_ACCESS_TOKEN || '',
    ownerNumber: cleanPhone(env.OWNER_NUMBER || ''),
    watermark: env.WATERMARK_TEXT || DEFAULTS.WATERMARK_TEXT,
    appUrl: env.DLAVIE_APP_URL || DEFAULTS.DLAVIE_APP_URL
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function plain(body, status = 200) {
  return new Response(String(body || ''), {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function extractText(message = {}) {
  if (message.type === 'text') return message.text?.body || '';
  if (message.type === 'button') return message.button?.text || message.button?.payload || '';
  if (message.type === 'interactive') {
    return message.interactive?.button_reply?.title || message.interactive?.button_reply?.id || message.interactive?.list_reply?.title || message.interactive?.list_reply?.id || '';
  }
  return '';
}

function normalizeCommand(value) {
  return String(value || '').trim().replace(/^[!./#]/, '').toLowerCase();
}

function footer(cfg) {
  return `\n\n${cfg.watermark}`;
}

function menu(cfg, name = '') {
  const hello = name ? `Halo, ${name}.` : 'Halo.';
  return [
    `*${cfg.botName}*`,
    hello,
    '',
    '*Menu Utama*',
    '1. menu - tampilkan menu',
    '2. help - panduan command',
    '3. about - info Dlavie',
    '4. health - cek status bot',
    '5. commerce - fitur commerce',
    '',
    `Website: ${cfg.appUrl}`,
    footer(cfg)
  ].join('\n');
}

function replyFor(input, cfg, userName = '', from = '') {
  const cmd = normalizeCommand(input);
  if (!cmd || cmd === 'menu' || cmd === '0') return menu(cfg, userName);
  if (['1', 'help', 'guide', 'panduan'].includes(cmd)) {
    return ['*Panduan Dlavie Bot*', '', 'Command tersedia:', '- menu', '- help', '- about', '- health', '- commerce', '', 'Provider: Meta WhatsApp Cloud API resmi.', footer(cfg)].join('\n');
  }
  if (['2', 'about', 'info', 'tentang'].includes(cmd)) {
    return ['*Tentang Dlavie Agent OS*', '', 'Engine WhatsApp resmi berbasis Meta Cloud API untuk commerce, CS AI, plan user, dan Dlavie Cloud.', '', `Website: ${cfg.appUrl}`, 'Instagram: @drmacze', footer(cfg)].join('\n');
  }
  if (['3', 'health', 'status'].includes(cmd)) {
    return ['*Dlavie Health*', '', 'Status: online', 'Runtime: Cloudflare Workers', 'Provider: Meta Cloud API', `User: ${from || '-'}`, footer(cfg)].join('\n');
  }
  if (['4', 'commerce', 'shop', 'produk', 'product'].includes(cmd)) {
    return ['*Dlavie Commerce*', '', 'Fitur commerce sedang disiapkan:', '- katalog produk', '- checkout otomatis', '- order tracking', '- invoice', '- CS AI ticketing', footer(cfg)].join('\n');
  }
  return [`Command *${input}* belum tersedia.`, '', 'Ketik *menu* untuk melihat fitur Dlavie Bot.', footer(cfg)].join('\n');
}

async function sendText(env, to, body) {
  const cfg = settings(env);
  if (!cfg.accessToken) throw new Error('META_ACCESS_TOKEN belum diisi.');
  if (!cfg.phoneNumberId) throw new Error('META_PHONE_NUMBER_ID belum diisi.');
  const phone = cleanPhone(to);
  if (!phone) throw new Error('Nomor tujuan kosong.');

  const response = await fetch(`https://graph.facebook.com/${cfg.graphVersion}/${cfg.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${cfg.accessToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'text',
      text: { preview_url: false, body: String(body || '') }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || response.statusText || 'Meta send failed');
  return data;
}

function verifyWebhook(request, env) {
  const url = new URL(request.url);
  const cfg = settings(env);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === cfg.verifyToken) return plain(challenge || '', 200);
  return plain('Forbidden', 403);
}

async function handleWebhook(request, env) {
  const payload = await request.json().catch(() => ({}));
  if (payload.object !== 'whatsapp_business_account') return json({ ok: true, ignored: true });

  const cfg = settings(env);
  let handled = 0;
  let statuses = 0;
  const errors = [];

  for (const entry of Array.isArray(payload.entry) ? payload.entry : []) {
    for (const change of Array.isArray(entry.changes) ? entry.changes : []) {
      const value = change.value || {};
      const contacts = Array.isArray(value.contacts) ? value.contacts : [];
      statuses += Array.isArray(value.statuses) ? value.statuses.length : 0;

      for (const message of Array.isArray(value.messages) ? value.messages : []) {
        const from = cleanPhone(message.from);
        const msgText = extractText(message).trim();
        const contact = contacts.find((item) => cleanPhone(item.wa_id) === from) || contacts[0] || null;
        const userName = contact?.profile?.name || '';
        if (!from || !msgText) continue;
        try {
          await sendText(env, from, replyFor(msgText, cfg, userName, from));
          handled += 1;
        } catch (error) {
          errors.push(error.message);
        }
      }
    }
  }

  return json({ ok: true, handled, statuses, errors });
}

async function simulate(request, env) {
  const body = await request.json().catch(() => ({}));
  const cfg = settings(env);
  const input = body.text || 'menu';
  return json({ ok: true, input, reply: replyFor(input, cfg, 'Tester', 'simulate') });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/') return json({ ok: true, name: settings(env).botName, runtime: 'cloudflare-workers', provider: 'meta-cloud' });
    if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true, status: 'online', runtime: 'cloudflare-workers', provider: 'meta-cloud' });
    if (request.method === 'GET' && url.pathname === '/webhook') return verifyWebhook(request, env);
    if (request.method === 'POST' && url.pathname === '/webhook') return handleWebhook(request, env);
    if (request.method === 'POST' && url.pathname === '/simulate') return simulate(request, env);
    return json({ ok: false, error: 'Not Found' }, 404);
  }
};
