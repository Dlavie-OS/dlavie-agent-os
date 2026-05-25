function normalizeCommand(command) {
  return String(command || '').trim().toLowerCase().replace(/^\/+/, '');
}

export class CommandRegistry {
  constructor() {
    this.commands = new Map();
    this.plugins = new Map();
  }

  register(plugin) {
    if (!plugin?.id) throw new Error('Plugin id is required.');
    if (!plugin?.run || typeof plugin.run !== 'function') throw new Error(`Plugin ${plugin.id} must expose run(ctx, api).`);

    this.plugins.set(plugin.id, plugin);
    const entries = [...(plugin.commands || []), ...(plugin.aliases || [])];
    for (const entry of entries) {
      const key = normalizeCommand(entry);
      if (!key) continue;
      if (this.commands.has(key)) throw new Error(`Duplicate command registration: ${key}`);
      this.commands.set(key, plugin);
    }
  }

  find(input) {
    const key = normalizeCommand(String(input || '').split(/\s+/)[0]);
    return this.commands.get(key) || null;
  }

  list() {
    return [...this.plugins.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  guideFor(command) {
    const plugin = this.find(command);
    return plugin?.guide || null;
  }
}

export function parseCommand(text = '') {
  const clean = String(text || '').trim();
  if (!clean) return { command: '', args: [], rawArgs: '', text: '' };
  const [head, ...rest] = clean.split(/\s+/);
  return {
    command: normalizeCommand(head),
    args: rest,
    rawArgs: rest.join(' '),
    text: clean
  };
}
