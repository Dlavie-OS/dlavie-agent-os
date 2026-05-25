function formatUptime(ms) {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
}

export default {
  id: 'dlavie.health',
  name: 'Dlavie Health',
  category: 'system',
  commands: ['health', '/health', 'status', '/status'],
  requiredPlan: 'guest',
  requiredRole: 'any',
  tokenCost: 0,
  pulseCost: 0.05,
  cooldownSec: 1,
  guide: {
    title: 'Bot Health',
    description: 'Menampilkan status runtime bot dan health dasar.',
    usage: '/health',
    examples: ['/health', '/status']
  },
  async run(ctx, api) {
    const stats = api.store.stats;
    const score = Math.max(0, 100 - stats.sendErrors * 4 - stats.pluginErrors * 8);
    return api.ui.section('DLAVIE HEALTH', [
      `Score       : ${score}/100`,
      `Connection  : ${stats.connection}`,
      `ConnectedAs : ${stats.connectedAs || '-'}`,
      `Uptime      : ${formatUptime(api.store.uptimeMs())}`,
      `Messages In : ${stats.messagesIn}`,
      `Messages Out: ${stats.messagesOut}`,
      `Send Errors : ${stats.sendErrors}`,
      `Plugin Err  : ${stats.pluginErrors}`,
      `Last Error  : ${stats.lastError || '-'}`,
      '',
      'Phase 1 health aktif. Full Bot Health akan ditingkatkan di Dlavie Cloud.'
    ]);
  }
};
