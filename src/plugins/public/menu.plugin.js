export default {
  id: 'dlavie.menu',
  name: 'Dlavie Menu',
  category: 'public',
  commands: ['menu', '/menu', 'start', '/start'],
  requiredPlan: 'guest',
  requiredRole: 'any',
  tokenCost: 0,
  pulseCost: 0.1,
  cooldownSec: 2,
  guide: {
    title: 'Menu Utama',
    description: 'Menampilkan menu utama Dlavie Agent OS.',
    usage: 'menu',
    examples: ['menu', '/menu'],
    notes: ['Phase 1 memakai text/iOS-safe fallback agar stabil di semua device.']
  },
  async run(ctx, api) {
    return api.ui.menu(api.registry);
  }
};
