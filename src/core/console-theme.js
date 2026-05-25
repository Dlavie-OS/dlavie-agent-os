export function printDlavieBanner(cfg = {}) {
  const site = cfg.appUrl || cfg.DLAVIE_APP_URL || 'https://dlaviecomerce.vercel.app';
  const instagram = cfg.instagram || cfg.SOCIAL_INSTAGRAM || '@drmacze';
  const border = '============================================================';

  console.log('');
  console.log(border);
  console.log('DLAVIE');
  console.log('Dlavie Agent OS / WA-MD Engine');
  console.log(border);
  console.log('Created by Dlavie engine');
  console.log(`Follow Instagram : ${instagram}`);
  console.log(`Visit Site       : ${site}`);
  console.log(border);
  console.log('');
}

export async function bootPulse(enabled = true) {
  if (!enabled) return;
  const frames = ['.', '..', '...'];
  for (const frame of frames) {
    process.stdout.write(`Booting Dlavie engine${frame}\r`);
    await new Promise((resolve) => setTimeout(resolve, 160));
  }
  process.stdout.write('Dlavie engine ready.        \n');
}

export function printPairingBox({ phone, custom, code }) {
  const border = '============================================================';
  console.log('');
  console.log(border);
  console.log('DLAVIE WA-MD PAIRING CODE ONLY');
  console.log(border);
  console.log(`Phone  : ${phone}`);
  console.log(`Custom : ${custom}`);
  console.log(`Code   : ${code}`);
  console.log(border);
  console.log('Guide  : WhatsApp > Linked Devices > Link with phone number');
  console.log('Note   : Gunakan code terbaru paling bawah. QR dinonaktifkan.');
  console.log(border);
  console.log('');
}
