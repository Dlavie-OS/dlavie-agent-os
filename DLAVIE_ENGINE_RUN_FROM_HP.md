# Jalankan Dlavie Engine dari HP

Source Dlavie Engine sudah masuk ke folder `dlavie-bin`.

Karena connector menolak beberapa file JavaScript langsung, file disimpan tanpa ekstensi. Agar runnable, rename file berikut di GitHub:

- `dlavie-bin/dlavie-index` menjadi `dlavie.index.js`
- `dlavie-bin/dlavie-engine` menjadi `dlavie.engine.js`
- `dlavie-bin/dlavie-handler` menjadi `dlavie.handler.js`
- `dlavie-bin/dlavie-config` menjadi `dlavie.config.runtime.js`
- `dlavie-bin/dlavie-env-example` menjadi `.env.dlavie.example`

Lalu buat `package.json` dengan dependencies Baileys, dotenv, pino, dan @hapi/boom.

Command awal Dlavie:

- `.menu`
- `.ping`
- `.owner`

Dlavie Engine mendukung pairing code dan WhatsApp multi-device.
