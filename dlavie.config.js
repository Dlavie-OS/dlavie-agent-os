import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dlavieDirname = path.dirname(fileURLToPath(import.meta.url))

function dlavieCsv(value = '') {
  return value
    .split(',')
    .map((dlavieItem) => dlavieItem.trim())
    .filter(Boolean)
}

function dlavieBool(value, fallback = false) {
  if (value === undefined) return fallback
  return ['true', '1', 'yes', 'y', 'on'].includes(String(value).toLowerCase())
}

export function dlavieConfig() {
  return {
    dlavieBotName: process.env.DLAVIE_BOT_NAME || 'Dlavie OS',
    dlaviePrefix: process.env.DLAVIE_PREFIX || '.',
    dlaviePhoneNumber: process.env.DLAVIE_PHONE_NUMBER || '',
    dlavieUsePairingCode: dlavieBool(process.env.DLAVIE_USE_PAIRING_CODE, true),
    dlavieOwnerNumbers: dlavieCsv(process.env.DLAVIE_OWNER_NUMBERS),
    dlavieMode: process.env.DLAVIE_MODE || 'public',
    dlavieSessionPath: process.env.DLAVIE_SESSION_PATH || './dlavie.session',
    dlavieCooldownMs: Number(process.env.DLAVIE_COOLDOWN_MS || 1500),
    dlavieProjectRoot: dlavieDirname,
    dlavieCommandDir: path.join(dlavieDirname, 'dlavie.commands')
  }
}
