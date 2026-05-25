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

    // Normalize first so entries like "menu" and "/menu" become one command.
    // This prevents same-plugin aliases from crashing the engine while still
    // protecting against two different plugins owning the same command.
    const entries = [...(plugin.commands || []), ...(plugin.aliases || [])];
    const normalizedKeys = new Set(entries.map(normalizeCommand).filter(Boolean));

    for (const key of normalizedKeys) {
      const existing = this.commands.get(key);
      if (existing && existing.id !== plugin.id) {
        throw new Error(`Duplicate command registration: ${key} used by ${existing.id} and ${plugin.id}`);
      }
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
