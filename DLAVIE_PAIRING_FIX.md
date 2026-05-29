# Dlavie Pairing Fix v4.1

Patch ini disiapkan dari arsip Replit untuk memperbaiki lifecycle linking Baileys pada `dlavie-runner-guarded`.

## Perubahan inti

- Memakai `fetchLatestBaileysVersion()` saat socket dibuat.
- Memakai `makeCacheableSignalKeyStore()` bila tersedia.
- Mengganti browser profile ke `Browsers.ubuntu('Chrome')` jika tersedia.
- `markOnlineOnConnect` menjadi `false`.
- Link code diminta ketika engine belum registered dan event koneksi sudah siap.
- Engine tidak menghapus session otomatis saat belum registered.
- QR fallback dicetak di console jika kode link ditolak.
- Tambah command `.whoami` untuk debugging owner/LID.
- `.guard` menampilkan policy guard agar versi patch mudah dicek.

## Workflow Replit

Start Dlavie Guarded Engine:

```bash
PORT=9000 DLAVIE_SESSION_PATH=dlavie.session.guard DLAVIE_PHONE_NUMBER=6285725483343 DLAVIE_OWNER_NUMBERS=62882007437216 DLAVIE_GUARD_ENABLED=true npm start
```

Reset Dlavie Session:

```bash
pkill node || true; rm -rf dlavie.session.guard; PORT=9000 DLAVIE_SESSION_PATH=dlavie.session.guard DLAVIE_PHONE_NUMBER=6285725483343 DLAVIE_OWNER_NUMBERS=62882007437216 DLAVIE_GUARD_ENABLED=true npm start
```

## Setelah connect

Test:

```text
.test
.guard
.whoami
```

Jika `.guard` masih menunjukkan role user karena WhatsApp mengirim `@lid`, salin nilai Sender/JID dari `.whoami` ke ENV:

```text
DLAVIE_OWNER_ALIASES=<sender atau jid dari .whoami>
```
