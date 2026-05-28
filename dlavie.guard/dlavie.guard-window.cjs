function dlavieNow() {
  return Date.now()
}

function dlaviePrune(list, windowMs, now = dlavieNow()) {
  while (list.length && now - list[0] > windowMs) list.shift()
  return list
}

function dlavieHit(map, key, windowMs, now = dlavieNow()) {
  const list = map.get(key) || []
  dlaviePrune(list, windowMs, now)
  list.push(now)
  map.set(key, list)
  return list.length
}

function dlavieCount(map, key, windowMs, now = dlavieNow()) {
  const list = map.get(key) || []
  dlaviePrune(list, windowMs, now)
  map.set(key, list)
  return list.length
}

module.exports = { dlavieNow, dlaviePrune, dlavieHit, dlavieCount }
