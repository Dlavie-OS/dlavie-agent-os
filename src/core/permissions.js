import { cfg, ownerJids, phoneFromJid } from './config.js';

export function isOwnerJid(jid = '') {
  if (!jid) return false;
  const normalized = String(jid);
  if (ownerJids().includes(normalized)) return true;
  const phone = phoneFromJid(normalized);
  return Boolean(phone && phone === cfg.owner);
}

export function isOwnerContext(ctx) {
  return Boolean(
    ctx?.isOwner ||
    isOwnerJid(ctx?.senderId) ||
    isOwnerJid(ctx?.chatId) ||
    isOwnerJid(ctx?.remoteJid)
  );
}

export function canUsePlugin(ctx, plugin) {
  if (cfg.privateOnly && !isOwnerContext(ctx)) {
    return {
      ok: false,
      reason: 'Bot sedang dalam private mode. Hanya owner yang bisa memakai command.'
    };
  }

  if (plugin.requiredRole === 'owner' && !isOwnerContext(ctx)) {
    return {
      ok: false,
      reason: 'Command ini hanya untuk owner.'
    };
  }

  return { ok: true, reason: '' };
}
