import { CommandRegistry } from './command-registry.js';
import menuPlugin from '../plugins/public/menu.plugin.js';
import helpPlugin from '../plugins/public/help.plugin.js';
import aboutPlugin from '../plugins/system/about.plugin.js';
import originPlugin from '../plugins/system/origin.plugin.js';
import licensePlugin from '../plugins/system/license.plugin.js';
import healthPlugin from '../plugins/system/health.plugin.js';
import batteryPlugin from '../plugins/system/battery.plugin.js';
import sessionPlugin from '../plugins/system/session.plugin.js';

const BUILTIN_PLUGINS = [
  menuPlugin,
  helpPlugin,
  aboutPlugin,
  originPlugin,
  licensePlugin,
  healthPlugin,
  batteryPlugin,
  sessionPlugin
];

export function createPluginManager(logger) {
  const registry = new CommandRegistry();

  for (const plugin of BUILTIN_PLUGINS) {
    registry.register(plugin);
    logger?.info?.(`plugin loaded: ${plugin.id}`);
  }

  return {
    registry,
    list: () => registry.list(),
    find: (command) => registry.find(command)
  };
}
