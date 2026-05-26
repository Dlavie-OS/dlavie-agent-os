const CATEGORIES = [
  { id: 'rekomendasi', title: 'Rekomendasi', description: 'Paket pilihan terbaik Dlavie' },
  { id: 'favorit', title: 'Paket Favorit', description: 'Produk yang paling sering dipilih' },
  { id: 'harian', title: 'Happy Harian', description: 'Paket singkat untuk kebutuhan harian' },
  { id: 'bulanan', title: 'Happy Bulanan', description: 'Paket bulanan lebih hemat' },
  { id: 'roam', title: 'CounTri Roam', description: 'Paket roaming dan perjalanan' },
  { id: 'alwayson', title: 'AlwaysOn', description: 'Paket aktif panjang' },
  { id: '5g', title: 'Happy 5G', description: 'Paket cepat untuk jaringan 5G' },
  { id: 'spesial', title: 'Happy Spesial', description: 'Promo khusus Dlavie' }
];

const PRODUCTS = {
  rekomendasi: [
    { id: 'rec-10gb', title: 'Dlavie 10GB', price: 'Rp25.000', description: '10GB / 7 hari' },
    { id: 'rec-25gb', title: 'Dlavie 25GB', price: 'Rp55.000', description: '25GB / 30 hari' },
    { id: 'rec-ai', title: 'Dlavie AI Basic', price: 'Rp15.000', description: 'Token AI bot starter' }
  ],
  favorit: [
    { id: 'fav-15gb', title: 'Favorit 15GB', price: 'Rp35.000', description: '15GB / 14 hari' },
    { id: 'fav-unlimited', title: 'Favorit Unlimited', price: 'Rp80.000', description: 'FUP wajar / 30 hari' }
  ],
  harian: [
    { id: 'day-1gb', title: 'Harian 1GB', price: 'Rp5.000', description: '1GB / 1 hari' },
    { id: 'day-3gb', title: 'Harian 3GB', price: 'Rp10.000', description: '3GB / 1 hari' }
  ],
  bulanan: [
    { id: 'month-20gb', title: 'Bulanan 20GB', price: 'Rp50.000', description: '20GB / 30 hari' },
    { id: 'month-40gb', title: 'Bulanan 40GB', price: 'Rp90.000', description: '40GB / 30 hari' }
  ],
  roam: [
    { id: 'roam-asia', title: 'Asia Roam', price: 'Rp120.000', description: 'Roaming Asia starter' }
  ],
  alwayson: [
    { id: 'aon-6m', title: 'AlwaysOn 6 Bulan', price: 'Rp99.000', description: 'Masa aktif panjang' }
  ],
  '5g': [
    { id: '5g-50gb', title: 'Happy 5G 50GB', price: 'Rp110.000', description: 'Akses cepat 5G' }
  ],
  spesial: [
    { id: 'special-business', title: 'Dlavie Business', price: 'Hubungi Admin', description: 'Plan business untuk jualan' }
  ]
};

function footer(cfg) {
  return `\n\n${cfg.watermark}`;
}

export function getCategories() {
  return CATEGORIES;
}

export function getProducts(categoryId = 'rekomendasi') {
  return PRODUCTS[categoryId] || PRODUCTS.rekomendasi;
}

export function buildTextCommerceMenu(cfg) {
  return [
    '*Pilih Jenis Paket*',
    '',
    ...CATEGORIES.map((item, index) => `${index + 1}. ${item.title}`),
    '',
    'Balas angka kategori. Contoh: *1* untuk Rekomendasi.',
    footer(cfg)
  ].join('\n');
}

export function buildTextProductList(cfg, categoryId = 'rekomendasi') {
  const category = CATEGORIES.find((item) => item.id === categoryId) || CATEGORIES[0];
  const products = getProducts(category.id);
  return [
    `*${category.title}*`,
    category.description,
    '',
    ...products.map((item, index) => `${index + 1}. *${item.title}*\n   ${item.description}\n   ${item.price}`),
    '',
    'Balas *commerce* untuk kembali ke kategori.',
    footer(cfg)
  ].join('\n');
}

export function resolveCategoryCommand(command) {
  const numeric = Number(command);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= CATEGORIES.length) {
    return CATEGORIES[numeric - 1].id;
  }
  const found = CATEGORIES.find((item) => [item.id, item.title.toLowerCase()].includes(String(command || '').toLowerCase()));
  return found?.id || null;
}

export function buildListPayload(cfg, to) {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: {
        type: 'text',
        text: 'Dlavie Commerce'
      },
      body: {
        text: 'Pilih jenis paket Dlavie. Menu ini dirancang untuk tampil rapi di iOS dan Android.'
      },
      footer: {
        text: cfg.watermark
      },
      action: {
        button: 'Pilih Paket',
        sections: [
          {
            title: 'Pilih Jenis Paket',
            rows: CATEGORIES.map((item) => ({
              id: `category:${item.id}`,
              title: item.title.slice(0, 24),
              description: item.description.slice(0, 72)
            }))
          }
        ]
      }
    }
  };
}

export function buildFlowPayload(cfg, to) {
  if (!cfg.flowId) return null;
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'flow',
      header: {
        type: 'text',
        text: 'Dlavie Commerce'
      },
      body: {
        text: 'Buka menu belanja Dlavie dengan tampilan seperti aplikasi.'
      },
      footer: {
        text: cfg.watermark
      },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: `dlavie-${Date.now()}`,
          flow_id: cfg.flowId,
          flow_cta: cfg.flowCta,
          flow_action: 'navigate',
          flow_action_payload: {
            screen: 'DLAVIE_PACKAGE_CATEGORY',
            data: {
              categories: CATEGORIES.map((item) => ({ id: item.id, title: item.title }))
            }
          }
        }
      }
    }
  };
}
