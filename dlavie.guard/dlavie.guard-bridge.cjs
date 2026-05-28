function dlavieInstallGuardBridge({ sock, guard }) {
  async function safeText(jid, text, meta = {}) {
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
    return guard.beforeCommand(ctx)
  }

  return { safeText, canCommand }
}

module.exports = { dlavieInstallGuardBridge }
