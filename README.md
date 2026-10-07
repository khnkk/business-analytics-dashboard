# Business Analytics Dashboard

A React + Node.js + SQLite analytics dashboard built for the Software Developer Intern technical assessment.

## Stack

- React + Vite
- Node.js + Express
- SQLite with node:sqlite
- Recharts
- SheetJS for Excel ingestion

## Architecture

```text
Excel workbook
    |
    v
Node.js ETL importer
    |
    v
SQLite database
    |
    v
Express REST API
    |
    v
React dashboard
```

I kept the 300K rows on the server. SQLite handles the filtering and aggregations, so the frontend only receives the results needed for the charts.

## Local setup

Requirements: Node.js 20+ recommended. No MySQL installation is required.

From the project root:

```bash
npm install
npm run install:all
npm run import-data
npm run dev
```

Open `http://localhost:5173`.

The API runs on `http://localhost:5000`.

## Production build

```bash
npm run install:all
npm run import-data
npm run build
npm start
```

The Express server serves the built React application and API.

## Environment

Copy `server/.env.example` to `server/.env` if you want to override the defaults:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
DB_FILE=./data/business_analytics.db
```

## Data model

Each source row is a line item. `BillNo` identifies an order and can occur across multiple rows. Revenue is `Price * Quantity`. Orders are counted with `COUNT(DISTINCT BillNo)`.

The supplied dataset contains 300,000 line items, 110,478 distinct orders and total revenue of 69,480,952.

## Dashboard

- Revenue
- Distinct orders
- Line items
- Average order value
- Daily revenue trend
- Revenue by category
- Revenue by outlet
- Revenue by order type
- Hourly demand
- Top 10 items
- Date range filtering
- Outlet filtering
- Category filtering
- Order-type filtering
- Responsive layout
- Loading and error states

The source has one brand value, `Burger Town`, so a brand filter is intentionally omitted.

## Performance

- SQL-side aggregation
- Indexed date, outlet, category, order type and bill number fields
- Precomputed revenue column
- Server-side filtering
- No 300K-row browser download
- SQLite WAL mode
- Transactional ETL import


## Documentation

- `docs/DATA_ANALYSIS.md`
- `docs/TECHNICAL_DECISIONS.md`
- `docs/PERFORMANCE.md`

## Legal pages

- `/privacy`
- `/terms`

## Deployment

`render.yaml` contains a Render configuration using persistent disk storage for the SQLite database. Attach a custom domain through the hosting provider after deployment.

## Source-data note

The provided data is labeled Burger Town, not California Burrito, so I kept the dashboard branding neutral instead of assuming the dataset represented California Burrito sales. The Excel file doesn't specify a currency, so I haven't added a currency symbol to the dashboard

## Dashboard navigation

- **Performance**: shows the dashboard's live browser-measured request time plus the server-side aggregation, indexed SQLite, and aggregated-response strategy used to keep the interface responsive.
- **Operations**: jumps to hourly demand and top-item operational analysis.
- **Data notes**: explains the source-data assumptions and calculation rules.

## Dashboard UX polish

The interface intentionally uses a restrained internal-analytics style rather than a marketing dashboard aesthetic. KPI definitions are visible near the summary metrics, filters are applied server-side, the Performance section reports measured browser request time and implementation details, and the operations table paginates the returned top-item dataset. The UI avoids decorative gradients, excessive pills, fabricated business claims, and unnecessary animation.
