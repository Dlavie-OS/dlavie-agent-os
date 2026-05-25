import { cfg } from './config.js';

export function appendWatermark(text = '') {
  const body = String(text || '').trimEnd();
  if (!cfg.watermarkEnabled) return body;
  if (!cfg.watermarkText) return body;
  if (body.includes(cfg.watermarkText)) return body;
  return `${body}\n\n${cfg.watermarkText}`;
}

export function originBlock() {
  return [
    '╭─「 DLAVIE ORIGIN 」',
    `│ Bot      : ${cfg.botName}`,
    '│ Engine   : Dlavie Agent OS',
    '│ Status   : Phase 1 Foundation',
    '│ Origin   : DLV-ORIGIN-LOCAL-PHASE1',
    '│ License  : Placeholder',
    '╰──────────────'
  ].join('\n');
}
