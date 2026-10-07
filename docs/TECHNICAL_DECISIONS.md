# Technical Decisions

## Architecture

React + Vite provides the dashboard UI. Node.js + Express exposes a REST API. SQLite stores the imported assessment dataset and performs server-side aggregation.

The browser never receives the full 300,000-row dataset. It receives only the aggregates needed for the current dashboard state.

## Why SQLite

The assessment explicitly permits SQLite. The dataset contains 300,000 rows, which is well within a practical single-file SQLite workload for this assessment. SQLite provides SQL aggregation, indexes, transactions and a simple local deployment model without requiring a separate database server.

The trade-off is concurrency and horizontal scalability. A server database such as PostgreSQL would be a better choice for a high-concurrency production analytics system.

## ETL

The importer reads the Excel workbook, accepts native Excel datetimes and also supports the DD-MM-YYYY HH:MM:SS string format described in the assessment, validates required fields, calculates `revenue = Price * Quantity`, and performs the import in a transaction.

## Query strategy

Dashboard metrics are calculated in SQL using aggregation and `COUNT(DISTINCT bill_no)` for orders. Filters are converted into parameterized SQL predicates. The frontend requests aggregated results rather than raw rows.

## Index strategy

Indexes are created on `order_datetime`, `outlet_name`, `item_group`, `order_type` and `bill_no` because these fields participate in filtering, grouping or distinct-order calculations.

## Frontend

The UI uses React and Recharts. Filters update API query parameters. Loading and error states are handled in the dashboard layer, and the layout is responsive.

## Data decisions

The supplied analysis confirms 300,000 line items, 110,478 distinct orders and total revenue of 69,480,952. `BillNo` is therefore treated as the order identifier, not the row. The source has one brand value, `Burger Town`, so a brand filter adds no useful information. The source also provides no currency symbol, so the UI does not assert INR.

## Branding decision

The dashboard uses neutral Business Analytics wording. Although the assessment is for California Burrito, the supplied dataset contains `Burger Town` as its only brand value. Representing those records as California Burrito sales would be an unsupported claim.
