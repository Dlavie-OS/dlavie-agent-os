const { dlavieHit, dlavieCount } = require('./dlavie.guard-window.cjs')

function dlavieCreateGuard(policy) {
  const globalOut = new Map()
  const chatOut = new Map()
  const userCmd = new Map()
  const duplicate = new Map()

  function dlavieIsEmergency(cmd) {
    return policy.emergencyCommands.includes(cmd)
  }

  function dlavieCanCommand({ sender, cmd }) {
    if (dlavieIsEmergency(cmd)) return { ok: true, reason: 'emergency' }
    const count = dlavieHit(userCmd, sender, policy.userWindowMs)
    if (count > policy.userMaxCmd) return { ok: false, reason: 'user_rate_limited' }
    return { ok: true, reason: 'ok' }
  }

  function dlavieCanReply({ jid, text }) {
    const globalCount = dlavieHit(globalOut, 'global', policy.globalWindowMs)
    if (globalCount > policy.globalMaxOut) return { ok: false, reason: 'global_out_limited' }

    const chatCount = dlavieHit(chatOut, jid, policy.chatWindowMs)
    if (chatCount > policy.chatMaxOut) return { ok: false, reason: 'chat_out_limited' }

    const key = `${jid}:${String(text).slice(0, 120)}`
    const same = dlavieHit(duplicate, key, policy.duplicateWindowMs)
    if (same > policy.maxDuplicateText) return { ok: false, reason: 'duplicate_limited' }

    return { ok: true, reason: 'ok' }
  }

  function dlavieDelayMs() {
    const min = policy.minReplyDelayMs
    const max = policy.maxReplyDelayMs
    return Math.floor(min + Math.random() * (max - min + 1))
  }

  return { dlavieCanCommand, dlavieCanReply, dlavieDelayMs, dlavieIsEmergency }
}

module.exports = { dlavieCreateGuard }
