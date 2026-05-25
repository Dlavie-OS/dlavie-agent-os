export default {
  id: 'dlavie.help',
  name: 'Dlavie Help',
  category: 'public',
  commands: ['help', '/help', 'guide', '/guide'],
  requiredPlan: 'guest',
  requiredRole: 'any',
  tokenCost: 0,
  pulseCost: 0.05,
  cooldownSec: 1,
  guide: {
    title: 'Panduan Command',
    description: 'Menampilkan panduan command. Bisa dipakai untuk command tertentu.',
    usage: '/help <command>',
    examples: ['/help', '/help battery', '/help menu']
  },
  async run(ctx, api) {
    const target = ctx.parsed?.args?.[0];
    if (target) {
      const plugin = api.registry.find(target);
      if (!plugin) return `Guide untuk command ${target} belum ditemukan. Ketik menu untuk daftar command.`;
      return api.ui.guide(plugin);
    }

    const lines = [
      'Daftar command tersedia:',
      '',
      ...api.registry.list().map((plugin) => `• ${plugin.commands?.[0] || plugin.id} — ${plugin.guide?.title || plugin.name}`),
      '',
      'Contoh: /help battery'
    ];
    return api.ui.section('DLAVIE HELP', lines);
  }
};
