export function createStore() {
  const startedAt = Date.now();
  const stats = {
    messagesIn: 0,
    messagesOut: 0,
    messagesSkipped: 0,
    sendErrors: 0,
    pluginErrors: 0,
    lastMessageAt: null,
    lastSendAt: null,
    lastError: null,
    connection: 'booting',
    connectedAs: null
  };

  const cooldown = new Map();
  const lidMap = new Map();

  return {
    startedAt,
    stats,
    cooldown,
    lidMap,
    uptimeMs: () => Date.now() - startedAt,
    setConnection(state, jid = null) {
      stats.connection = state;
      if (jid) stats.connectedAs = jid;
    },
    rememberLid(lid, jid) {
      if (lid && jid) lidMap.set(lid, jid);
    },
    resolveLid(lid) {
      return lidMap.get(lid) || null;
    },
    markError(error) {
      stats.lastError = error?.message || String(error || 'unknown error');
    }
  };
}
