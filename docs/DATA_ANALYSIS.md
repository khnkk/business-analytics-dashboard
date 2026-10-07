# Data Analysis

Source: `data.xlsx`, sheet `Sheet1`. Every figure below is computed from the supplied workbook.

## Core numbers

| Metric | Value |
|---|---:|
| Line items | 300,000 |
| Distinct orders (`COUNT(DISTINCT BillNo)`) | 110,478 |
| Total revenue (`SUM(Price x Quantity)`) | 69,480,952 |
| Average order value | 628.91 |
| Average line items per order | 2.72 |
| Date range | 2025-06-17 11:02:40 to 2026-06-16 23:48:34 |

The source does not provide a currency symbol. The dashboard therefore displays revenue as a plain numeric value.

## Revenue calculation

Line revenue is `Price x Quantity`. Orders are counted with `COUNT(DISTINCT BillNo)`, never `COUNT(*)`. AOV is revenue divided by distinct orders.

## Dimensions

Six outlets are present: Koramangala, Indiranagar, HSR Layout, Whitefield, JP Nagar and MG Road.

Seven groups are present: Burgers, Combos, Sides, Drinks, Wraps, Desserts and Extras.

Three order types are present: Dine-In, Delivery and Takeaway.

There are 45 distinct items.

The dataset contains one brand value: `Burger Town`. Therefore the dashboard intentionally does not include a brand filter or brand chart.

## Useful observations

- Full-month revenue is broadly flat rather than showing a sustained growth trend.
- June 2025 and June 2026 are partial months, so daily grain is used in the dashboard to avoid misleading partial-month comparisons.
- February 2026 has 28 days, so its lower monthly total should not be interpreted as a demand collapse.
- Hourly demand has strong peaks around 13:00 and 20:00.
- Day-of-week revenue is nearly uniform, so it is not prioritized as a dashboard chart.
- Outlet AOV values are very similar, so outlet revenue differences are primarily volume-driven.
- Combos represent about 13.9% of rows but about 29.4% of revenue.

## Data quality

- No null values were found in the source columns.
- No fully duplicated rows were found.
- Quantity is between 1 and 4, with no zero or negative quantities.
- There are no negative prices or refund rows.
- Price is zero on 8,611 rows. These are complimentary dip items and are retained so line-item counts remain faithful to the source.
- Within each BillNo, outlet, timestamp, order type, settlement and brand are consistent.
- Each item maps to exactly one group and one price.

## Design implications

1. Distinct order counts must use `COUNT(DISTINCT BillNo)`.
2. Brand filtering is omitted because there is only one brand value.
3. Outlet, group and order type are useful dashboard dimensions.
4. A precomputed `revenue` column is safe because Price and Quantity are non-null numeric inputs.
