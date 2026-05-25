const ESC = String.fromCharCode(27);
const ENABLE_COLOR = process.env.NO_COLOR !== '1';

export function c(code, value) {
  if (!ENABLE_COLOR) return String(value);
  return `${ESC}[${code}m${value}${ESC}[0m`;
}

export const theme = {
  reset: (v) => c('0', v),
  bold: (v) => c('1', v),
  dim: (v) => c('2', v),
  cyan: (v) => c('36', v),
  magenta: (v) => c('35', v),
  green: (v) => c('32', v),
  yellow: (v) => c('33', v),
  red: (v) => c('31', v),
  white: (v) => c('97', v),
  gray: (v) => c('90', v)
};

export function printDlavieBanner(cfg = {}) {
  const site = cfg.appUrl || cfg.DLAVIE_APP_URL || 'https://dlaviecomerce.vercel.app';
  const instagram = cfg.instagram || cfg.SOCIAL_INSTAGRAM || '@drmacze';
  const border = '============================================================';

  console.log('');
  console.log(theme.cyan(border));
  console.log(theme.bold(theme.magenta('DLAVIE')));
  console.log(theme.cyan('Dlavie Agent OS / WA-MD Engine'));
  console.log(theme.cyan(border));
  console.log(theme.green('Created by Dlavie engine'));
  console.log(`${theme.yellow('Follow Instagram')} : ${theme.white(instagram)}`);
  console.log(`${theme.yellow('Visit Site')}       : ${theme.white(site)}`);
  console.log(theme.gray('Mode: WhatsApp multi-device runtime'));
  console.log(theme.cyan(border));
  console.log('');
}

export async function bootPulse(enabled = true) {
  if (!enabled) return;
  const frames = ['[    ]', '[=   ]', '[==  ]', '[=== ]', '[====]'];
  for (const frame of frames) {
    process.stdout.write(`${theme.cyan(frame)} ${theme.gray('Booting Dlavie engine...')}\r`);
    await new Promise((resolve) => setTimeout(resolve, 140));
  }
  process.stdout.write(`${theme.green('[ OK ]')} ${theme.green('Dlavie engine ready.')}          \n`);
}

export function printPairingBox({ phone, custom, code, customEnabled = false }) {
  const border = '============================================================';
  console.log('');
  console.log(theme.cyan(border));
  console.log(theme.bold(theme.magenta('DLAVIE WA-MD PAIRING CODE ONLY')));
  console.log(theme.cyan(border));
  console.log(`${theme.yellow('Phone')}        : ${theme.white(phone)}`);
  console.log(`${theme.yellow('Custom Code')}  : ${theme.white(customEnabled ? custom : 'disabled for stability')}`);
  console.log(`${theme.green('Pairing Code')} : ${theme.bold(theme.white(code))}`);
  console.log(theme.cyan(border));
  console.log(`${theme.yellow('Guide')}        : WhatsApp > Linked Devices > Link with phone number`);
  console.log(`${theme.yellow('Important')}    : Pakai kode terbaru. Jangan pakai QR. Jangan pakai kode lama.`);
  console.log(theme.cyan(border));
  console.log('');
}
