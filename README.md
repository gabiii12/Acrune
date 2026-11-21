# SMM Store

A customer storefront for social media boosting services. Customers pick a service, place an
order and pay by GCash with a receipt screenshot. The admin checks the payment and approves it,
and the order is sent to the provider (z-smm or Growix) automatically.

## Running it locally

You need Node.js 22.5 or newer, and two terminals:

```
cd server ; npm install ; npm run dev     # API on http://localhost:3001
cd client ; npm install ; npm run dev     # site on http://localhost:5173
```

Before the first run, copy `server/.env.example` to `server/.env` and fill it in.

- Admin dashboard: http://localhost:5173/#/admin
- Phone on the same Wi-Fi: `npm run dev -- --host` in `client`, then open the Network address.

## Production

```
cd client ; npm run build     # creates client/dist
cd server ; npm start         # serves the API and the built site on one port
```

Set `TRUST_PROXY=1` in `.env` when hosting behind a proxy. Back up `server/orders.db` and
`server/uploads/` (the payment screenshots) regularly. Both are excluded from git.

## Project structure

```
server/                      Express API (Node, built-in SQLite)
  .env.example               every setting, documented
  orders.db                  database (created on first run)
  uploads/                   payment screenshots (private, admin-only)
  src/
    index.js                 entry point: starts the server and the order sync
    app.js                   builds the Express app (routes, error handler, static site)
    config.js                reads .env into one config object
    db.js                    schema and migrations
    providers.js             SMM panel API client (one per provider)
    utils.js
    middleware/auth.js       admin password check and signed login tokens
    routes/store.js          customer API: services, orders, payment, cancel
    routes/admin.js          admin API: orders, approve/reject/refund, screenshots, margins
    services/catalog.js      merged service list from all providers (cached, cleaned)
    services/orderSync.js    pulls delivery status from providers every 5 minutes
    services/uploads.js      screenshot validation and storage

client/                      React + Vite
  src/
    main.jsx                 entry point, loads the styles
    App.jsx                  routes (#/, #/guide, #/track, #/order/:code, #/admin/...)
    content/guide.js         all customer help text: steps, FAQ, guide tips
    constants/               order statuses, service types, platform brand colors
    lib/                     api client, money format, local storage, image compression
    hooks/                   useHashRoute (routing), useDialog (in-page confirm/prompt)
    components/              shared UI: Logo, StatusBadge, CopyButton, OrderGuide, StoreLayout…
    pages/store/             customer pages: services, order form, payment, order, track, guide
    pages/admin/             admin dashboard: layout, overview, orders, services, actions
    styles/                  theme (colors), base, components, store, admin
```

## Order lifecycle

```
awaiting_payment ──pay──▶ payment_submitted ──approve──▶ processing ──▶ completed
       │                        │    │                        │
   customer cancel          reject  customer cancel      provider cancels / partial
   (deleted)                  ▼          ▼                    ▼
                          rejected   canceled ──mark refunded──▶ refunded
                                     (deleted if the customer canceled)
```

## Checks

```
cd client ; npm run lint ; npm run build
```
