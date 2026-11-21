// Entry point: start the order status sync and the HTTP server.
import { config } from './config.js';
import { createApp } from './app.js';
import { providers } from './providers.js';
import { startOrderSync } from './services/orderSync.js';

console.log('Providers:', providers.map((p) => p.id).join(', ') || 'NONE (set *_API_KEY in .env)');
startOrderSync();
createApp().listen(config.port, () => console.log(`API on :${config.port}`));
