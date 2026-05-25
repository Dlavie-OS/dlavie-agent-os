export default {
  id: 'dlavie.session',
  name: 'Dlavie Session Doctor',
  category: 'system',
  commands: ['session', '/session', 'device', '/device'],
  requiredPlan: 'guest',
  requiredRole: 'any',
  tokenCost: 0,
  pulseCost: 0.05,
  cooldownSec: 1,
  guide: {
    title: 'Session Doctor',
    description: 'Menampilkan status session dan perangkat WhatsApp.',
    usage: '/session',
    examples: ['/session', '/device']
  },
  async run(ctx, api) {
    const stats = api.store.stats;
    return api.ui.section('DLAVIE SESSION', [
      `Connection : ${stats.connection}`,
      `Device     : ${stats.connectedAs || '-'}`,
      'Mode       : Multi-device',
      'Pairing    : Code DLAVIEAI + QR fallback',
      'Doctor     : Phase 1 placeholder',
      '',
      'Jika session bermasalah, hapus data/session lalu pairing ulang. Fitur relink aman akan dibuat pada fase berikutnya.'
    ]);
  }
};
