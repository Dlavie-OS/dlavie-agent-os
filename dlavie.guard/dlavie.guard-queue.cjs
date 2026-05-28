function dlavieCreateQueue(options = {}) {
  const minGapMs = Number(options.minGapMs || 1200)
  const maxGapMs = Number(options.maxGapMs || 3500)
  const queue = []
  let busy = false

  function delayMs() {
    return Math.floor(minGapMs + Math.random() * (maxGapMs - minGapMs + 1))
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function drain() {
    if (busy) return
    busy = true
    while (queue.length) {
      const job = queue.shift()
      try {
        await wait(delayMs())
        await job.run()
        job.resolve(true)
      } catch (error) {
        job.reject(error)
      }
    }
    busy = false
  }

  function push(run) {
    return new Promise((resolve, reject) => {
      queue.push({ run, resolve, reject })
      drain()
    })
  }

  return { push, size: () => queue.length }
}

module.exports = { dlavieCreateQueue }
