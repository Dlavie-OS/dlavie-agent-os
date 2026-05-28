const { dlavieCreateQueue } = require('./dlavie.guard-queue.cjs')
const { dlavieCreateGuard } = require('./dlavie.guard-core.cjs')
const { dlavieRiskScan } = require('./dlavie.guard-risk.cjs')
const { dlavieCreateAudit } = require('./dlavie.guard-audit.cjs')

const defaultPolicy = {
  globalWindowMs: 60000,
  globalMaxOut: 18,
  chatWindowMs: 60000,
  chatMaxOut: 6,
  userWindowMs: 30000,
  userMaxCmd: 8,
  minReplyDelayMs: 900,
  maxReplyDelayMs: 2800,
  duplicateWindowMs: 120000,
  maxDuplicateText: 2,
  emergencyCommands: ['test', 'status', 'runtime']
}

function dlavieCreateGuardAdapter(policy = defaultPolicy) {
  const core = dlavieCreateGuard(policy)
  const queue = dlavieCreateQueue({
    minGapMs: policy.minReplyDelayMs,
    maxGapMs: policy.maxReplyDelayMs
  })
  const audit = dlavieCreateAudit()

  function beforeCommand(ctx) {
    const decision = core.dlavieCanCommand(ctx)
    audit.write('before_command', { cmd: ctx.cmd, sender: ctx.sender, decision })
    return decision
  }

  function beforeOutput(ctx) {
    const risk = dlavieRiskScan(ctx)
    if (!risk.safe) {
      audit.write('risk_output', { cmd: ctx.cmd, risk: risk.risk })
      return { ok: false, reason: 'risk_detected', risk: risk.risk }
    }
    const decision = core.dlavieCanReply(ctx)
    audit.write('before_output', { jid: ctx.jid, decision })
    return decision
  }

  function schedule(task) {
    return queue.push(task)
  }

  return { beforeCommand, beforeOutput, schedule, audit }
}

module.exports = { dlavieCreateGuardAdapter }
