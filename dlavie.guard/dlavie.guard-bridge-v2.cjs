const { dlavieTrustedRole } = require('./dlavie.guard-trusted.cjs')

function dlavieInstallGuardBridgeV2({ sock, guard }) {
  async function safeText(jid, text, meta = {}) {
    if (dlavieTrustedRole(meta)) {
      guard.audit.write('trusted_output_bypass', { jid, cmd: meta.cmd || '', role: meta.role || '' })
      await sock.sendMessage(jid, { text: String(text) })
      return true
    }

    const output = guard.beforeOutput({
      jid,
      text,
      cmd: meta.cmd || '',
      targetCount: meta.targetCount || 1
    })

    if (!output.ok) {
      guard.audit.write('blocked_output', { jid, reason: output.reason, risk: output.risk || [] })
      return false
    }

    await guard.schedule(async () => {
      await sock.sendMessage(jid, { text: String(text) })
    })

    return true
  }

  function canCommand(ctx) {
    if (dlavieTrustedRole(ctx)) {
      guard.audit.write('trusted_command_bypass', { cmd: ctx.cmd || '', sender: ctx.sender || '', role: ctx.role || '' })
      return { ok: true, reason: 'trusted_role', trusted: true }
    }
    return guard.beforeCommand(ctx)
  }

  return { safeText, canCommand }
}

module.exports = { dlavieInstallGuardBridgeV2 }
