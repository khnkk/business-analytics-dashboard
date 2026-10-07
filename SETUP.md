# Local setup

## Requirements

- Node.js 22.5+ because the server uses Node's built-in `node:sqlite` module.
- npm

No MySQL installation is required.

## Install

From the project root:

```bash
npm install
npm run install:all
```

## Database

A verified SQLite database is included under `server/data/business_analytics.db` for immediate local use. It contains the supplied 300,000-row dataset.

If you want to rebuild it from `data.xlsx`, delete the database file and run:

```bash
npm run import-data
```

The importer recreates the SQLite table and indexes from the workbook.

## Development

Run both applications with:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

The API is available at:

```text
http://localhost:5000/api/health
```

## Production

Build the React frontend:

```bash
npm run build
```

Start the Express production server:

```bash
npm start
```

Open:

```text
http://localhost:5000
```

## Environment

Optional `server/.env`:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
DB_FILE=./data/business_analytics.db
```
