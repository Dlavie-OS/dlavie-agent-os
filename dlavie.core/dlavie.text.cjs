function dlavieNumber(value = '') {
  return String(value).split('@')[0].replace(/[^0-9]/g, '')
}

function dlavieText(message) {
  const msg = message?.message || {}
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    ''
  ).trim()
}

function dlavieCommandOf(text = '', prefix = '.') {
  if (!String(text).startsWith(prefix)) return null
  const parts = String(text).slice(prefix.length).trim().split(/\s+/)
  return {
    name: String(parts[0] || '').toLowerCase(),
    args: parts.slice(1)
  }
}

module.exports = { dlavieNumber, dlavieText, dlavieCommandOf }
