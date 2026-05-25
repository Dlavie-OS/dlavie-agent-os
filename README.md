# Dlavie Agent OS

**Dlavie Agent OS** adalah fondasi engine WhatsApp multi-device untuk ekosistem **Dlavie Cloud**.

Phase 1 fokus pada core runtime yang stabil, modular, dan siap dikembangkan menjadi platform bot bisnis DLAVIE.

## Runtime Stack

```txt
@whiskeysockets/baileys
→ DlavieBaileysAdapter
→ Dlavie WA-MD Engine
→ Dlavie Plugin Runtime
→ Dlavie Agent OS
```

## Phase 1 Features

- Multi-device WhatsApp connection.
- Pairing code dengan branding `DLAVIEAI`.
- QR fallback.
- Plugin-based command system.
- Command guide otomatis.
- DeliveryGuard untuk safe reply dan quoted fallback.
- iOS-safe text menu.
- OriginMark placeholder.
- LicenseGuard placeholder.
- Pulse Battery / EngineCore placeholder.
- Health command.
- Session Doctor placeholder.
- HTTP health endpoint.
- Local `/simulate` endpoint untuk debugging command router.

## Setup

Copy config example:

```bash
cp config.example.json config.json
```

Edit minimal:

```json
{
  "BOT_NAME": "Dlavie Agent OS",
  "WA_PHONE_NUMBER": "6285725483343",
  "OWNER_NUMBER": "62882007437216",
  "PAIRING_CODE": "DLAVIEAI",
  "PRIVATE_ONLY": false
}
```

Install:

```bash
npm install --omit=dev
```

Run:

```bash
npm start
```

## Panel Deploy

```bash
git clone -b dlavie-agent-os-v1 https://github.com/Dlavie-OS/dlavie-agent-os.git .
npm install --omit=dev
cp config.example.json config.json
npm start
```

Jika folder sudah ada:

```bash
git fetch origin
git checkout -B dlavie-agent-os-v1 origin/dlavie-agent-os-v1
npm install --omit=dev
npm start
```

## First Commands

```txt
menu
/help
/help battery
/about
/origin
/license
/health
/battery
/engine
/components
/session
/device
```

## Important Security Notes

- Jangan commit `config.json` berisi token asli.
- Jangan commit folder `data/session`.
- Jangan kirim API key/token di chat.
- Secrets harus masuk lewat environment variable atau config lokal panel.

## Branch Strategy

```txt
main                  = stable only
dlavie-agent-os-v1    = active Phase 1 development
hotfix/*              = urgent fixes
feature/*             = modular features
```

## Roadmap

1. Phase 1 — Engine Core.
2. Phase 2 — DeliveryGuard + LID hardening.
3. Phase 3 — SafeOps update/log/doctor.
4. Phase 4 — CommerceCore basic.
5. Phase 5 — CS AI Ticket System.
6. Phase 6 — Dlavie Cloud Panel integration.
