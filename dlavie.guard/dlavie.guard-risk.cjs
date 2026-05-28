function dlavieRiskScan({ cmd = '', text = '', targetCount = 1 }) {
  const risk = []
  const body = String(text || '')
  const name = String(cmd || '').toLowerCase()

  if (['broadcast', 'tagall', 'hidetag'].includes(name)) risk.push('mass_action')
  if (targetCount > 20) risk.push('too_many_targets')
  if (body.length > 3500) risk.push('text_too_long')
  if (/https?:\/\//i.test(body) && targetCount > 5) risk.push('mass_link')
  if (/(gratis|claim|hadiah|bonus|promo)/i.test(body) && targetCount > 5) risk.push('promo_like_text')

  return {
    safe: risk.length === 0,
    risk
  }
}

module.exports = { dlavieRiskScan }
