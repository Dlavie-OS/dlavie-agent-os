export const DEFAULTS = {
  BOT_NAME: 'Dlavie Agent OS',
  META_GRAPH_VERSION: 'v20.0',
  META_VERIFY_TOKEN: 'dlavie_cloud_verify',
  WATERMARK_TEXT: '⚡ Powered by Dlavie Cloud',
  DLAVIE_APP_URL: 'https://dlaviecomerce.vercel.app',
  MENU_UI_MODE: 'list',
  DLAVIE_FLOW_ID: '',
  DLAVIE_FLOW_CTA: 'Buka Menu Dlavie'
};

export function cleanPhone(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

export function getConfig(env = {}) {
  return {
    botName: env.BOT_NAME || DEFAULTS.BOT_NAME,
    graphVersion: env.META_GRAPH_VERSION || DEFAULTS.META_GRAPH_VERSION,
    verifyToken: env.META_VERIFY_TOKEN || DEFAULTS.META_VERIFY_TOKEN,
    phoneNumberId: env.META_PHONE_NUMBER_ID || '',
    accessToken: env.META_ACCESS_TOKEN || '',
    ownerNumber: cleanPhone(env.OWNER_NUMBER || ''),
    watermark: env.WATERMARK_TEXT || DEFAULTS.WATERMARK_TEXT,
    appUrl: env.DLAVIE_APP_URL || DEFAULTS.DLAVIE_APP_URL,
    menuUiMode: String(env.MENU_UI_MODE || DEFAULTS.MENU_UI_MODE).toLowerCase(),
    flowId: env.DLAVIE_FLOW_ID || DEFAULTS.DLAVIE_FLOW_ID,
    flowCta: env.DLAVIE_FLOW_CTA || DEFAULTS.DLAVIE_FLOW_CTA
  };
}

export function publicConfig(env = {}) {
  const cfg = getConfig(env);
  return {
    botName: cfg.botName,
    runtime: 'cloudflare-workers',
    provider: 'meta-cloud',
    menuUiMode: cfg.menuUiMode,
    flowEnabled: Boolean(cfg.flowId),
    appUrl: cfg.appUrl
  };
}
