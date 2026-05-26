import { buildTextCommerceMenu, buildTextProductList, resolveCategoryCommand } from '../ui/dlavie-commerce.js';

function footer(cfg) {
  return `\n\n${cfg.watermark}`;
}

function normalize(value) {
  return String(value || '').trim().replace(/^[!./#]/, '').toLowerCase();
}

function mainMenu(cfg, name = '') {
  const hello = name ? `Halo, ${name}.` : 'Halo.';
  return [
    `*${cfg.botName}*`,
    hello,
    '',
    '*Menu Utama*',
    '1. commerce - katalog produk Dlavie',
    '2. help - panduan command',
    '3. about - info Dlavie',
    '4. health - status bot',
    '',
    'Ketik *commerce* untuk membuka menu paket Dlavie.',
    `Website: ${cfg.appUrl}`,
    footer(cfg)
  ].join('\n');
}

function helpMenu(cfg) {
  return [
    '*Panduan Dlavie Bot*',
    '',
    'Command tersedia:',
    '- menu',
    '- commerce',
    '- help',
    '- about',
    '- health',
    '',
    `Mode UI commerce: ${cfg.menuUiMode}`,
    'Jika list tidak muncul, bot tetap menyediakan fallback text.',
    footer(cfg)
  ].join('\n');
}

function aboutMenu(cfg) {
  return [
    '*Tentang Dlavie Agent OS*',
    '',
    'Engine WhatsApp resmi berbasis Meta Cloud API untuk commerce, CS AI, plan user, dan Dlavie Cloud.',
    '',
    `Website: ${cfg.appUrl}`,
    'Instagram: @drmacze',
    footer(cfg)
  ].join('\n');
}

function healthMenu(cfg, from = '') {
  return [
    '*Dlavie Health*',
    '',
    'Status: online',
    'Runtime: Cloudflare Workers',
    'Provider: Meta Cloud API',
    `UI Mode: ${cfg.menuUiMode}`,
    `Flow Enabled: ${cfg.flowId ? 'yes' : 'no'}`,
    `User: ${from || '-'}`,
    footer(cfg)
  ].join('\n');
}

export function routeTextCommand({ text, cfg, userName = '', from = '' }) {
  const cmd = normalize(text);
  if (!cmd || cmd === 'menu' || cmd === '0') return mainMenu(cfg, userName);
  if (cmd === 'help' || cmd === 'guide' || cmd === 'panduan') return helpMenu(cfg);
  if (cmd === 'about' || cmd === 'info' || cmd === 'tentang') return aboutMenu(cfg);
  if (cmd === 'health' || cmd === 'status') return healthMenu(cfg, from);
  if (cmd === 'commerce' || cmd === 'shop' || cmd === 'produk' || cmd === 'product' || cmd === 'paket') return buildTextCommerceMenu(cfg);

  const categoryId = resolveCategoryCommand(cmd);
  if (categoryId) return buildTextProductList(cfg, categoryId);

  return [`Command *${text}* belum tersedia.`, '', 'Ketik *menu* untuk melihat fitur Dlavie Bot.', footer(cfg)].join('\n');
}
