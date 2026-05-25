import { createApp } from './core/app.js';

async function main() {
  const app = await createApp();
  await app.start();
}

main().catch((error) => {
  console.error('[fatal]', error.stack || error.message);
  process.exit(1);
});
