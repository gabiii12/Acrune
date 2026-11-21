// SQLite database (orders.db in the server folder) and its schema migrations.
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

export const db = new DatabaseSync(config.paths.db);
// Overwrite deleted rows on disk so erased orders are really gone.
db.exec('PRAGMA secure_delete = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  service_id INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  link TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  contact TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_payment',
  payment_ref TEXT UNIQUE,
  zsmm_order_id TEXT,
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);`);

// Columns added after the first version. Each is a no-op once the column exists.
for (const sql of [
  `ALTER TABLE orders ADD COLUMN provider TEXT NOT NULL DEFAULT 'zsmm'`,
  `ALTER TABLE orders ADD COLUMN provider_status TEXT`,
  `ALTER TABLE orders ADD COLUMN remains INTEGER`,
  `ALTER TABLE orders ADD COLUMN payment_proof TEXT`, // screenshot filename in server/uploads
  `ALTER TABLE orders ADD COLUMN customer_canceled INTEGER NOT NULL DEFAULT 0`, // erase once refunded
]) { try { db.exec(sql); } catch { /* column exists */ } }

// If the server died mid-approval we can't know whether the provider got the order.
// Put it back for review with a warning instead of leaving it stuck forever.
db.prepare(`UPDATE orders SET status='payment_submitted',
  note='Server restarted during approval. Check the provider panel before approving again.'
  WHERE status='approving'`).run();

// Unpaid orders the customer canceled hold nothing worth keeping.
db.prepare(`DELETE FROM orders WHERE status='customer_canceled'`).run();
