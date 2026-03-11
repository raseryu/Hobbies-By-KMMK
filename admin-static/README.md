# KMMK Admin (No Node.js)

This folder is a **static admin dashboard UI** that runs with **no Node.js**, **no build step**, and **no server**.

## How to run

- Open `admin-static/index.html` in your browser (double-click it).

## What’s included

- **Admin dashboard layout**: sidebar navigation + top bar + responsive layout
- **Administrative navigation bar**:
  - Dashboard overview
  - Inventory management
  - Orders & transactions
  - Content / control forms
- **Product management interface**: add/edit/delete products (stored in LocalStorage)
- **Order / transaction management**: create orders, view details, update status, delete
- **Forms for content / inventory control**: settings form (currency, thresholds, etc.)
- **Data tables / management views**: product table + order table with search & filters
- **Import/Export**: JSON import/export buttons in the sidebar (helps move data between machines)

## Data storage

All data is stored in your browser using **LocalStorage**.

- Export to JSON if you need to move data to a different browser/device.
- Use **Reset demo data** to restore the initial demo dataset.

