import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import XLSX from 'xlsx';
import { db } from '../src/db.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(serverRoot, '..');
const filePath = path.join(root, 'data.xlsx');
const schemaPath = path.join(serverRoot, 'sql', 'schema.sql');
const required = ['BillNo','Outlet_Name','Order_Datetime','Group','Order_Type','Item','Price','Quantity','Settlement','Brand'];

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number') {
    const p = XLSX.SSF.parse_date_code(value);
    if (!p) return null;
    return new Date(p.y, p.m - 1, p.d, p.H, p.M, Math.floor(p.S));
  }
  if (typeof value === 'string') {
    const text = value.trim();
    const m = text.match(/^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2}):(\d{2})$/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +m[6]);
    const d = new Date(text);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}
function sqliteDate(date){
  const p = n => String(n).padStart(2,'0');
  return `${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}
if(!fs.existsSync(filePath)) throw new Error(`Dataset not found: ${filePath}`);
const workbook = XLSX.readFile(filePath, { cellDates: true });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });
if(!rows.length) throw new Error('The dataset is empty.');
for(const column of required){ if(!(column in rows[0])) throw new Error(`Missing required column: ${column}`); }

db.exec(fs.readFileSync(schemaPath,'utf8'));
db.exec('DROP TABLE IF EXISTS order_items_new');
db.exec(`CREATE TABLE order_items_new (
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
)`);
const insert = db.prepare(`INSERT INTO order_items_new (bill_no,outlet_name,order_datetime,item_group,order_type,item,price,quantity,settlement,brand,revenue) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
let invalid = 0;
db.exec('BEGIN TRANSACTION');
try { for(const row of rows){
  const date = parseDate(row.Order_Datetime);
  const values = [row.BillNo,row.Outlet_Name,date && sqliteDate(date),row.Group,row.Order_Type,row.Item,row.Price,row.Quantity,row.Settlement,row.Brand];
  if(!date || values.slice(0,2).some(v => v === null || v === '') || values.slice(3).some(v => v === null || v === '')) { invalid++; continue; }
  const price = Number(row.Price); const quantity = Number(row.Quantity); const bill = Number(row.BillNo);
  if(!Number.isFinite(price)||!Number.isFinite(quantity)||!Number.isFinite(bill)){ invalid++; continue; }
  insert.run(bill,String(row.Outlet_Name),values[2],String(row.Group),String(row.Order_Type),String(row.Item),price,quantity,String(row.Settlement),String(row.Brand),price*quantity);
} db.exec('COMMIT'); } catch (error) { db.exec('ROLLBACK'); throw error; }
db.exec('DROP TABLE order_items');
db.exec('ALTER TABLE order_items_new RENAME TO order_items');
db.exec('CREATE INDEX idx_order_datetime ON order_items(order_datetime); CREATE INDEX idx_outlet_name ON order_items(outlet_name); CREATE INDEX idx_item_group ON order_items(item_group); CREATE INDEX idx_order_type ON order_items(order_type); CREATE INDEX idx_bill_no ON order_items(bill_no);');
const count = db.prepare('SELECT COUNT(*) AS count FROM order_items').get().count;
const orders = db.prepare('SELECT COUNT(DISTINCT bill_no) AS count FROM order_items').get().count;
const revenue = db.prepare('SELECT COALESCE(SUM(revenue),0) AS total FROM order_items').get().total;
console.log(`Imported ${count.toLocaleString()} rows.`);
console.log(`Distinct orders: ${orders.toLocaleString()}`);
console.log(`Revenue: ${revenue.toLocaleString()}`);
if(invalid) console.warn(`Skipped ${invalid} invalid rows.`);
if(count !== 300000) console.warn(`Expected 300,000 rows from the supplied assessment dataset; imported ${count.toLocaleString()}.`);
