CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY,
  bill_no INTEGER NOT NULL,
  outlet_name TEXT NOT NULL,
  order_datetime TEXT NOT NULL,
  item_group TEXT NOT NULL,
  order_type TEXT NOT NULL,
  item TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  settlement TEXT NOT NULL,
  brand TEXT NOT NULL,
  revenue INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_datetime ON order_items(order_datetime);
CREATE INDEX IF NOT EXISTS idx_outlet_name ON order_items(outlet_name);
CREATE INDEX IF NOT EXISTS idx_item_group ON order_items(item_group);
CREATE INDEX IF NOT EXISTS idx_order_type ON order_items(order_type);
CREATE INDEX IF NOT EXISTS idx_bill_no ON order_items(bill_no);
