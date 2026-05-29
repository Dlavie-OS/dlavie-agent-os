const fs = require('node:fs')
const path = require('node:path')

const dlavieGuardDefaultPolicy = Object.freeze({
  version: 'dlavie-guard-system-v2-owner-resolver',
  enabled: true,
  globalWindowMs: 60000,
  globalMaxOutput: 18,
  chatWindowMs: 60000,
  chatMaxOutput: 6,
  userWindowMs: 30000,
  userMaxCommand: 8,
  duplicateWindowMs: 120000,
  duplicateMaxSameText: 2,
  minDelayMs: 900,
  maxDelayMs: 2800,
  maxTextLength: 3500,
  maxTargetsPerBatch: 20,
  broadcastGapMs: 5000,
  emergencyCommands: ['test', 'status', 'runtime', 'whoami'],
  sensitiveCommands: ['broadcast', 'tagall', 'hidetag'],
  trustedRoles: ['owner', 'admin']
})

function dlavieGuardNumber(value = '') {
  return String(value).split('@')[0].replace(/[^0-9]/g, '')
}

function dlavieGuardToken(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/:\d+@/g, '@')
}

function dlavieGuardList(value = '') {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function dlavieGuardOwnerRecords(values = []) {
  return Array.from(new Set(values.filter(Boolean))).map((raw) => ({
    raw: String(raw),
    token: dlavieGuardToken(raw),
    number: dlavieGuardNumber(raw)
  }))
}

function dlavieGuardCandidates(ctx = {}) {
  if (typeof ctx === 'string') return [ctx]
  const key = ctx.key || {}
  return [
    ctx.jid,
    ctx.sender,
    ctx.participant,
    ctx.remoteJid,
    ctx.from,
    key.remoteJid,
    key.participant,
    ctx.author,
    ctx.ownerAlias,
    ctx.ownerJid
  ].filter(Boolean)
}

function dlavieGuardWait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function dlavieGuardRandom(min, max) {
  return Math.floor(Number(min) + Math.random() * (Number(max) - Number(min) + 1))
}

function dlavieGuardPrune(list, windowMs, now = Date.now()) {
  while (list.length && now - list[0] > windowMs) list.shift()
  return list
}

function dlavieGuardHit(map, key, windowMs, now = Date.now()) {
  const list = map.get(key) || []
  dlavieGuardPrune(list, windowMs, now)
  list.push(now)
  map.set(key, list)
  return list.length
}

function dlavieCreateAuditLogger(fileName = 'dlavie.guard.audit.log') {
  const target = path.join(process.cwd(), fileName)
  return {
    write(event, data = {}) {
      const payload = JSON.stringify({ at: new Date().toISOString(), event, data })
      fs.appendFile(target, payload + '\n', () => {})
    }
  }
}

function dlavieCreateQueue(policy) {
  const queue = []
  let busy = false

  async function drain() {
    if (busy) return
    busy = true
    while (queue.length) {
      const job = queue.shift()
      try {
        await dlavieGuardWait(dlavieGuardRandom(policy.minDelayMs, policy.maxDelayMs))
        const result = await job.task()
        job.resolve(result)
      } catch (error) {
        job.reject(error)
      }
    }
    busy = false
  }

  return {
    push(task) {
      return new Promise((resolve, reject) => {
        queue.push({ task, resolve, reject })
        drain()
      })
    },
    size() {
      return queue.length
    }
  }
}

function dlavieCreateRoleResolver(config = {}) {
  const configuredOwners = Array.isArray(config.owners) ? config.owners : []
  const configuredAliases = Array.isArray(config.ownerAliases) ? config.ownerAliases : []
  const envOwners = dlavieGuardList(process.env.DLAVIE_OWNER_NUMBERS || '')
  const envAliases = dlavieGuardList(process.env.DLAVIE_OWNER_ALIASES || '')
  const owners = dlavieGuardOwnerRecords([
    ...configuredOwners,
    ...configuredAliases,
    ...envOwners,
    ...envAliases
  ])

  function isOwner(ctx = '') {
    const candidates = dlavieGuardCandidates(ctx)

    return candidates.some((candidate) => {
      const candidateToken = dlavieGuardToken(candidate)
      const candidateNumber = dlavieGuardNumber(candidate)

      return owners.some((owner) => {
        if (!owner.raw) return false
        if (owner.token && candidateToken && owner.token === candidateToken) return true
        if (owner.number && candidateNumber && owner.number === candidateNumber) return true
        if (owner.number && candidateNumber && candidateNumber.endsWith(owner.number)) return true
        if (owner.number && candidateNumber && owner.number.endsWith(candidateNumber)) return true
        return false
      })
    })
  }

  async function isGroupAdmin(sock, groupJid, senderJid) {
    if (!String(groupJid).endsWith('@g.us')) return false
    try {
      const meta = await sock.groupMetadata(groupJid)
      const senderNumber = dlavieGuardNumber(senderJid)
      const senderToken = dlavieGuardToken(senderJid)
      return meta.participants.some((p) => {
        const idNumber = dlavieGuardNumber(p.id)
        const idToken = dlavieGuardToken(p.id)
        const sameSender = (senderNumber && idNumber === senderNumber) || (senderToken && idToken === senderToken)
        return sameSender && (p.admin === 'admin' || p.admin === 'superadmin')
      })
    } catch (error) {
      return false
    }
  }

  async function resolve(sock, ctx = {}) {
    if (ctx.isOwner === true) return { role: 'owner', isOwner: true, isAdmin: true }
    if (ctx.isAdmin === true) return { role: 'admin', isOwner: false, isAdmin: true }
    if (isOwner(ctx)) return { role: 'owner', isOwner: true, isAdmin: true }
    const admin = await isGroupAdmin(sock, ctx.jid || ctx.remoteJid || '', ctx.sender || ctx.participant || '')
    if (admin) return { role: 'admin', isOwner: false, isAdmin: true }
    return { role: 'user', isOwner: false, isAdmin: false }
  }

  function debug(ctx = {}) {
    const candidates = dlavieGuardCandidates(ctx)
    return {
      owners: owners.map((owner) => ({ raw: owner.raw, token: owner.token, number: owner.number })),
      candidates: candidates.map((candidate) => ({
        raw: String(candidate),
        token: dlavieGuardToken(candidate),
        number: dlavieGuardNumber(candidate)
      })),
      matched: isOwner(ctx)
    }
  }

  return { isOwner, isGroupAdmin, resolve, debug }
}

function dlavieRiskScan(policy, ctx = {}) {
  const cmd = String(ctx.cmd || '').toLowerCase()
  const text = String(ctx.text || '')
  const targetCount = Number(ctx.targetCount || 1)
  const risk = []

  if (policy.sensitiveCommands.includes(cmd)) risk.push('sensitive_command')
  if (targetCount > policy.maxTargetsPerBatch) risk.push('too_many_targets')
  if (text.length > policy.maxTextLength) risk.push('text_too_long')
  if (/https?:\/\//i.test(text) && targetCount > 5) risk.push('mass_link')
  if (/(gratis|claim|hadiah|bonus|promo|diskon|voucher)/i.test(text) && targetCount > 5) risk.push('promo_like_mass_text')

  return { safe: risk.length === 0, risk }
}

function dlavieCreateGuardSystem(options = {}) {
  const policy = { ...dlavieGuardDefaultPolicy, ...(options.policy || {}) }
  const audit = dlavieCreateAuditLogger(options.auditFile || 'dlavie.guard.audit.log')
  const queue = dlavieCreateQueue(policy)
  const roleResolver = dlavieCreateRoleResolver({
    owners: options.owners || [],
    ownerAliases: options.ownerAliases || []
  })

  const globalOut = new Map()
  const chatOut = new Map()
  const userCmd = new Map()
  const duplicateOut = new Map()

  function isTrusted(role = '') {
    return policy.trustedRoles.includes(String(role).toLowerCase())
  }

  function trustedDecision(ctx = {}) {
    return { ok: true, trusted: true, reason: 'trusted_role', role: ctx.role || 'trusted' }
  }

  function emergencyDecision(cmd = '') {
    return policy.emergencyCommands.includes(String(cmd).toLowerCase())
  }

  function beforeCommand(ctx = {}) {
    if (!policy.enabled) return { ok: true, reason: 'guard_disabled' }
    if (isTrusted(ctx.role) || ctx.isOwner === true || ctx.isAdmin === true) {
      const decision = trustedDecision(ctx)
      audit.write('command_trusted_bypass', { cmd: ctx.cmd, sender: ctx.sender, decision })
      return decision
    }
    if (emergencyDecision(ctx.cmd)) return { ok: true, reason: 'emergency_command' }

    const key = dlavieGuardNumber(ctx.sender || ctx.jid || 'unknown') || dlavieGuardToken(ctx.sender || ctx.jid || 'unknown') || 'unknown'
    const count = dlavieGuardHit(userCmd, key, policy.userWindowMs)
    if (count > policy.userMaxCommand) {
      const decision = { ok: false, reason: 'user_command_rate_limited', count }
      audit.write('command_blocked', { cmd: ctx.cmd, sender: ctx.sender, decision })
      return decision
    }

    return { ok: true, reason: 'ok', count }
  }

  function beforeOutput(ctx = {}) {
    if (!policy.enabled) return { ok: true, reason: 'guard_disabled' }
    if (isTrusted(ctx.role) || ctx.isOwner === true || ctx.isAdmin === true) {
      const decision = trustedDecision(ctx)
      audit.write('output_trusted_bypass', { cmd: ctx.cmd, jid: ctx.jid, decision })
      return decision
    }

    const scan = dlavieRiskScan(policy, ctx)
    if (!scan.safe) {
      const decision = { ok: false, reason: 'risk_detected', risk: scan.risk }
      audit.write('output_blocked_risk', { cmd: ctx.cmd, jid: ctx.jid, decision })
      return decision
    }

    const globalCount = dlavieGuardHit(globalOut, 'global', policy.globalWindowMs)
    if (globalCount > policy.globalMaxOutput) {
      const decision = { ok: false, reason: 'global_output_rate_limited', count: globalCount }
      audit.write('output_blocked_global', { jid: ctx.jid, decision })
      return decision
    }

    const chatKey = String(ctx.jid || 'unknown')
    const chatCount = dlavieGuardHit(chatOut, chatKey, policy.chatWindowMs)
    if (chatCount > policy.chatMaxOutput) {
      const decision = { ok: false, reason: 'chat_output_rate_limited', count: chatCount }
      audit.write('output_blocked_chat', { jid: ctx.jid, decision })
      return decision
    }

    const textKey = `${chatKey}:${String(ctx.text || '').slice(0, 160)}`
    const duplicateCount = dlavieGuardHit(duplicateOut, textKey, policy.duplicateWindowMs)
    if (duplicateCount > policy.duplicateMaxSameText) {
      const decision = { ok: false, reason: 'duplicate_output_limited', count: duplicateCount }
      audit.write('output_blocked_duplicate', { jid: ctx.jid, decision })
      return decision
    }

    return { ok: true, reason: 'ok', globalCount, chatCount, duplicateCount }
  }

  async function safeSendText(sock, jid, text, ctx = {}) {
    const meta = { ...ctx, jid, text }
    const outputDecision = beforeOutput(meta)
    if (!outputDecision.ok) return false

    if (outputDecision.trusted) {
      await sock.sendMessage(jid, { text: String(text) })
      return true
    }

    await queue.push(async () => sock.sendMessage(jid, { text: String(text) }))
    return true
  }

  async function safeBroadcast(sock, targets = [], text = '', ctx = {}) {
    const uniqueTargets = Array.from(new Set(targets)).slice(0, policy.maxTargetsPerBatch)
    const scan = dlavieRiskScan(policy, { ...ctx, text, targetCount: uniqueTargets.length, cmd: ctx.cmd || 'broadcast' })
    if (!isTrusted(ctx.role) && !scan.safe) {
      audit.write('broadcast_blocked_risk', { risk: scan.risk, targetCount: uniqueTargets.length })
      return { sent: 0, blocked: true, reason: 'risk_detected', risk: scan.risk }
    }

    let sent = 0
    for (const target of uniqueTargets) {
      const ok = await safeSendText(sock, target, text, { ...ctx, cmd: ctx.cmd || 'broadcast', targetCount: uniqueTargets.length })
      if (ok) sent++
      if (!isTrusted(ctx.role)) await dlavieGuardWait(policy.broadcastGapMs)
    }
    return { sent, blocked: false }
  }

  function stats() {
    return {
      queue: queue.size(),
      policy: policy.version,
      globalBuckets: globalOut.size,
      chatBuckets: chatOut.size,
      userBuckets: userCmd.size,
      duplicateBuckets: duplicateOut.size
    }
  }

  return {
    policy,
    audit,
    queue,
    roleResolver,
    beforeCommand,
    beforeOutput,
    safeSendText,
    safeBroadcast,
    riskScan: (ctx) => dlavieRiskScan(policy, ctx),
    isTrusted,
    stats
  }
}

module.exports = {
  dlavieGuardDefaultPolicy,
  dlavieCreateGuardSystem,
  dlavieCreateRoleResolver,
  dlavieGuardNumber,
  dlavieGuardToken,
  dlavieGuardCandidates
}
