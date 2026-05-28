function dlavieEnv(name, fallback = '') {
  return process.env[name] || fallback
}

function dlavieList(value = '') {
  return String(value).split(',').map((x) => x.trim()).filter(Boolean)
}

function dlavieConfig() {
  return {
    name: dlavieEnv('DLAVIE_BOT_NAME', 'Dlavie OS'),
    prefix: dlavieEnv('DLAVIE_PREFIX', '.'),
    phone: dlavieEnv('DLAVIE_PHONE_NUMBER', ''),
    owners: dlavieList(dlavieEnv('DLAVIE_OWNER_NUMBERS', '')),
    session: dlavieEnv('DLAVIE_SESSION_PATH', './dlavie.session'),
    port: Number(dlavieEnv('PORT', '9000'))
  }
}

module.exports = { dlavieConfig }
