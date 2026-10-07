# Performance

- 300,000 source rows are imported into SQLite once rather than loaded into the browser.
- Dashboard requests return aggregated data only.
- Date, outlet, category, order type, and order ID columns are indexed.
- The database uses WAL mode and normal synchronous mode for the local read-heavy dashboard workload.
- Detailed raw-row rendering is intentionally omitted from the main dashboard to avoid sending or rendering 300,000 records.
- Repeated dashboard requests are served from the local indexed database without a network database round trip.
- The importer uses a transaction for efficient bulk insertion.

## Measured local request benchmark

Measured against the included SQLite database with the Express server running locally on Node.js 22.16.0. The measurements include the HTTP request and response transfer, but not browser rendering.

| Request | Response time | JSON payload |
|---|---:|---:|
| Full dashboard | 745 ms | 21.1 KB |
| Outlet filter | 229 ms | 20.0 KB |
| Category filter | 340 ms | 20.3 KB |

The dashboard's Performance section also reports live browser-side response time, aggregated response row count, source row count, and uncompressed JSON payload size for the latest request.
