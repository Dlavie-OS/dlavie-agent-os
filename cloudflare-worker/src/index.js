import { getConfig, publicConfig } from './core/config.js';
import { json, plain } from './core/http.js';
import { normalizeInboundMessage, sendMetaPayload, sendText } from './adapters/meta-cloud.js';
import { buildListPayload, buildFlowPayload } from './ui/dlavie-commerce.js';
import { routeTextCommand } from './router/commands.js';

function verifyWebhook(request, env) {
  const url = new URL(request.url);
  const cfg = getConfig(env);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === cfg.verifyToken) {
    return plain(challenge || '', 200);
  }

  return plain('Forbidden', 403);
}

async function sendDlavieReply(env, inbound) {
  const cfg = getConfig(env);
  const text = inbound.text || 'menu';
  const command = text.trim().replace(/^[!./#]/, '').toLowerCase();

  if (['commerce', 'shop', 'produk', 'product', 'paket'].includes(command)) {
    if (cfg.menuUiMode === 'flow' && cfg.flowId) {
      const flowPayload = buildFlowPayload(cfg, inbound.from);
      if (flowPayload) return sendMetaPayload(env, flowPayload);
    }

    if (['list', 'interactive', 'button'].includes(cfg.menuUiMode)) {
      const listPayload = buildListPayload(cfg, inbound.from);
      return sendMetaPayload(env, listPayload);
    }
  }

  return sendText(env, inbound.from, routeTextCommand({
    text,
    cfg,
    userName: inbound.userName,
    from: inbound.from
  }));
}

async function handleWebhook(request, env) {
  const payload = await request.json().catch(() => ({}));
  if (payload.object !== 'whatsapp_business_account') {
    return json({ ok: true, ignored: true, reason: 'object-not-whatsapp-business-account' });
  }

  let handled = 0;
  let statuses = 0;
  const errors = [];

  for (const entry of Array.isArray(payload.entry) ? payload.entry : []) {
    for (const change of Array.isArray(entry.changes) ? entry.changes : []) {
      const value = change.value || {};
      const contacts = Array.isArray(value.contacts) ? value.contacts : [];
      statuses += Array.isArray(value.statuses) ? value.statuses.length : 0;

      for (const message of Array.isArray(value.messages) ? value.messages : []) {
        const inbound = normalizeInboundMessage(message, contacts);
        if (!inbound.from || !inbound.text) continue;

        try {
          await sendDlavieReply(env, inbound);
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
  const cfg = getConfig(env);
  const input = body.text || 'menu';

  return json({
    ok: true,
    input,
    config: publicConfig(env),
    reply: routeTextCommand({ text: input, cfg, userName: 'Tester', from: 'simulate' }),
    note: 'POST /simulate only tests text fallback. Real commerce list/flow is sent from POST /webhook.'
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/') {
      return json({
        ok: true,
        ...publicConfig(env),
        endpoints: ['GET /health', 'GET /webhook', 'POST /webhook', 'POST /simulate']
      });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, status: 'online', ...publicConfig(env) });
    }

    if (request.method === 'GET' && url.pathname === '/webhook') {
      return verifyWebhook(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/webhook') {
      return handleWebhook(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/simulate') {
      return simulate(request, env);
    }

    return json({ ok: false, error: 'Not Found' }, 404);
  }
};
