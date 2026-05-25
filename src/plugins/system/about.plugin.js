import { cfg } from '../../core/config.js';

export default {
  id: 'dlavie.about',
  name: 'About Dlavie Agent OS',
  category: 'system',
  commands: ['about', '/about'],
  requiredPlan: 'guest',
  requiredRole: 'any',
  tokenCost: 0,
  pulseCost: 0.05,
  cooldownSec: 1,
  guide: {
    title: 'Tentang Bot',
    description: 'Menampilkan informasi engine bot.',
    usage: '/about',
    examples: ['/about']
  },
  async run(ctx, api) {
    return api.ui.section('ABOUT DLAVIE', [
      `Bot    : ${cfg.botName}`,
      'Engine : Dlavie Agent OS',
      'Layer  : Dlavie WA-MD Engine',
      'Adapter: DlavieBaileysAdapter',
      'Status : Phase 1 Foundation',
      '',
      'Bot ini adalah instance resmi yang dirancang untuk Dlavie Cloud.'
    ]);
  }
};
