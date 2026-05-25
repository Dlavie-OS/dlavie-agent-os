import fs from 'node:fs';
import { cfg } from './config.js';

let installed = false;

export function installResilienceCore(logger) {
  if (installed) return;
  installed = true;

  process.on('uncaughtException', (error) => {
    logger?.error?.(`[resilience] uncaught exception: ${error.stack || error.message}`);
  });

  process.on('unhandledRejection', (reason) => {
    const msg = reason?.stack || reason?.message || String(reason);
    logger?.error?.(`[resilience] unhandled rejection: ${msg}`);
  });

  process.on('warning', (warning) => {
    logger?.warn?.(`[resilience] runtime warning: ${warning.name} ${warning.message}`);
  });
}

export function clearSessionFolder(logger, reason = 'manual repair') {
  try {
    fs.rmSync(cfg.sessionDir, { recursive: true, force: true });
    logger?.warn?.(`[resilience] session folder cleared: ${reason}`);
    return true;
  } catch (error) {
    logger?.error?.(`[resilience] failed to clear session folder: ${error.message}`);
    return false;
  }
}

export function createBackoff({ baseMs = 3000, maxMs = 60000, factor = 1.8 } = {}) {
  let attempt = 0;
  return {
    next() {
      attempt += 1;
      const jitter = Math.floor(Math.random() * 800);
      return Math.min(Math.floor(baseMs * Math.pow(factor, attempt - 1)) + jitter, maxMs);
    },
    reset() {
      attempt = 0;
    },
    attempt() {
      return attempt;
    }
  };
}

export function healthSnapshot(store) {
  const stats = store?.stats || {};
  return {
    connection: stats.connection || 'unknown',
    connectedAs: stats.connectedAs || null,
    messagesIn: stats.messagesIn || 0,
    messagesOut: stats.messagesOut || 0,
    sendErrors: stats.sendErrors || 0,
    pluginErrors: stats.pluginErrors || 0,
    lastError: stats.lastError || null
  };
}
