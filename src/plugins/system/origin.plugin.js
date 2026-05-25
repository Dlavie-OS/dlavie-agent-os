import { originBlock } from '../../core/watermark.js';

export default {
  id: 'dlavie.origin',
  name: 'Dlavie OriginMark',
  category: 'system',
  commands: ['origin', '/origin', 'verify', '/verify'],
  requiredPlan: 'guest',
  requiredRole: 'any',
  tokenCost: 0,
  pulseCost: 0.05,
  cooldownSec: 1,
  guide: {
    title: 'OriginMark',
    description: 'Menampilkan identitas resmi awal Dlavie Agent OS.',
    usage: '/origin',
    examples: ['/origin', '/verify']
  },
  async run() {
    return originBlock();
  }
};
