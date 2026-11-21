// Builds the Express app: API routes, then the built website (client/dist) if present.
import fs from 'node:fs';
import express from 'express';
import { config } from './config.js';
import { storeRouter } from './routes/store.js';
import { adminRouter } from './routes/admin.js';

export function createApp() {
  const app = express();
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');

  app.use('/api/admin', adminRouter);
  app.use('/api', storeRouter);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // Turn any thrown error (bad JSON, body too large, bugs) into a JSON reply instead of an HTML page.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    const message = status === 413 ? 'Upload is too large' : status === 400 ? 'Invalid request' : 'Something went wrong';
    res.status(status).json({ error: message });
  });

  // In production this one server also serves the website (run `npm run build` in client first).
  if (fs.existsSync(config.paths.clientDist)) app.use(express.static(config.paths.clientDist));

  return app;
}
