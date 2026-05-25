export default {
  id: 'dlavie.license',
  name: 'Dlavie LicenseGuard',
  category: 'system',
  commands: ['license', '/license'],
  requiredPlan: 'guest',
  requiredRole: 'any',
  tokenCost: 0,
  pulseCost: 0.05,
  cooldownSec: 1,
  guide: {
    title: 'LicenseGuard',
    description: 'Menampilkan status lisensi awal Dlavie Agent OS.',
    usage: '/license',
    examples: ['/license']
  },
  async run(ctx, api) {
    return api.ui.section('DLAVIE LICENSE', [
      'Status   : Local Phase 1',
      'License  : DLV-LIC-LOCAL-PHASE1',
      'Guard    : Placeholder active',
      'Mode     : Development',
      '',
      'LicenseGuard penuh akan terhubung ke Dlavie Cloud setelah core stabil.'
    ]);
  }
};
