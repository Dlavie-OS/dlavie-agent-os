import { cfg } from './config.js';

export function createUiEngine() {
  function section(title, lines = []) {
    const body = lines.map((line) => `│ ${line}`).join('\n');
    return [`╭─「 ${title} 」`, body, '╰──────────────'].filter(Boolean).join('\n');
  }

  function menu(registry) {
    const plugins = registry.list();
    const grouped = new Map();
    for (const plugin of plugins) {
      const category = plugin.category || 'general';
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category).push(plugin);
    }

    const lines = [
      `${cfg.botName}`,
      `Mode UI: ${cfg.uiMode} + ${cfg.uiFallbackMode} fallback`,
      '',
      'Command utama:'
    ];

    for (const [category, items] of grouped) {
      lines.push('', `# ${category.toUpperCase()}`);
      for (const plugin of items) {
        const first = plugin.commands?.[0] || plugin.id;
        lines.push(`• ${first} — ${plugin.guide?.title || plugin.name}`);
      }
    }

    lines.push('', 'Ketik /help <command> untuk panduan detail.');
    return section('DLAVIE AGENT OS', lines);
  }

  function guide(plugin) {
    const g = plugin.guide || {};
    return section(`GUIDE: ${g.title || plugin.name}`, [
      g.description || 'Belum ada deskripsi.',
      '',
      `Usage: ${g.usage || plugin.commands?.[0] || plugin.id}`,
      ...(g.examples?.length ? ['', 'Contoh:', ...g.examples.map((x) => `- ${x}`)] : []),
      ...(g.notes?.length ? ['', 'Catatan:', ...g.notes.map((x) => `- ${x}`)] : [])
    ]);
  }

  return { section, menu, guide };
}
