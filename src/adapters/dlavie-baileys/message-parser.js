import { isOwnerJid } from '../../core/permissions.js';

function getMessageText(message = {}) {
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage?.caption) return message.imageMessage.caption;
  if (message.videoMessage?.caption) return message.videoMessage.caption;
  if (message.buttonsResponseMessage?.selectedButtonId) return message.buttonsResponseMessage.selectedButtonId;
  if (message.listResponseMessage?.singleSelectReply?.selectedRowId) return message.listResponseMessage.singleSelectReply.selectedRowId;
  if (message.templateButtonReplyMessage?.selectedId) return message.templateButtonReplyMessage.selectedId;
  return '';
}

export function parseBaileysMessage(raw) {
  const msg = raw?.messages?.[0] || raw;
  if (!msg?.message || !msg?.key) return null;
  if (msg.key.remoteJid === 'status@broadcast') return null;

  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;
  const text = getMessageText(msg.message).trim();
  if (!text) return null;

  return {
    rawMessage: msg,
    remoteJid,
    chatId: remoteJid,
    senderId,
    fromMe: Boolean(msg.key.fromMe),
    isOwner: isOwnerJid(senderId) || isOwnerJid(remoteJid),
    isGroup: remoteJid.endsWith('@g.us'),
    isLid: remoteJid.endsWith('@lid') || senderId.endsWith('@lid'),
    text,
    messageId: msg.key.id || '',
    timestamp: Number(msg.messageTimestamp || Date.now())
  };
}
