function dlavieTrustedRole(ctx = {}) {
  if (ctx.isOwner === true) return true
  if (ctx.isAdmin === true) return true
  const role = String(ctx.role || '').toLowerCase()
  return role === 'owner' || role === 'admin'
}

function dlavieTrustedDecision() {
  return { ok: true, reason: 'trusted_role', trusted: true }
}

module.exports = { dlavieTrustedRole, dlavieTrustedDecision }
