const fs = require('node:fs')
const path = require('node:path')

function dlavieCreateAudit(file = 'dlavie.guard.audit.log') {
  const target = path.join(process.cwd(), file)

  function write(event, data = {}) {
    const row = JSON.stringify({
      at: new Date().toISOString(),
      event,
      data
    })
    fs.appendFile(target, row + '\n', () => {})
  }

  return { write }
}

module.exports = { dlavieCreateAudit }
