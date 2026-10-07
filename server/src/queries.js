function where(filters={}){
  const clauses=[]; const params={};
  if(filters.startDate){clauses.push("order_datetime >= @startDate");params.startDate=`${filters.startDate} 00:00:00`;}
  if(filters.endDate){clauses.push("order_datetime < datetime(@endDate, '+1 day')");params.endDate=filters.endDate;}
  if(filters.outlet){clauses.push('outlet_name = @outlet');params.outlet=filters.outlet;}
  if(filters.group){clauses.push('item_group = @group');params.group=filters.group;}
  if(filters.orderType){clauses.push('order_type = @orderType');params.orderType=filters.orderType;}
  return {sql:clauses.length?`WHERE ${clauses.join(' AND ')}`:'',params};
}
export function summary(db,filters){const {sql,params}=where(filters);return db.prepare(`SELECT COUNT(*) lineItems,COUNT(DISTINCT bill_no) orders,COALESCE(SUM(revenue),0) revenue,CASE WHEN COUNT(DISTINCT bill_no)=0 THEN 0 ELSE ROUND(SUM(revenue)*1.0/COUNT(DISTINCT bill_no),2) END aov FROM order_items ${sql}`).get(params);}
export function revenueTrend(db,filters){const {sql,params}=where(filters);return db.prepare(`SELECT substr(order_datetime,1,10) date,ROUND(SUM(revenue),2) revenue,COUNT(DISTINCT bill_no) orders FROM order_items ${sql} GROUP BY date ORDER BY date`).all(params);}
export function categories(db,filters){const {sql,params}=where(filters);return db.prepare(`SELECT item_group groupName,ROUND(SUM(revenue),2) revenue,COUNT(DISTINCT bill_no) orders,COUNT(*) lineItems FROM order_items ${sql} GROUP BY item_group ORDER BY revenue DESC`).all(params);}
export function outlets(db,filters){const {sql,params}=where(filters);return db.prepare(`SELECT outlet_name outlet,ROUND(SUM(revenue),2) revenue,COUNT(DISTINCT bill_no) orders,CASE WHEN COUNT(DISTINCT bill_no)=0 THEN 0 ELSE ROUND(SUM(revenue)*1.0/COUNT(DISTINCT bill_no),2) END aov FROM order_items ${sql} GROUP BY outlet_name ORDER BY revenue DESC`).all(params);}
export function orderTypes(db,filters){const {sql,params}=where(filters);return db.prepare(`SELECT order_type orderType,ROUND(SUM(revenue),2) revenue,COUNT(DISTINCT bill_no) orders FROM order_items ${sql} GROUP BY order_type ORDER BY revenue DESC`).all(params);}
export function hourly(db,filters){const {sql,params}=where(filters);return db.prepare(`SELECT CAST(substr(order_datetime,12,2) AS INTEGER) hour,ROUND(SUM(revenue),2) revenue,COUNT(DISTINCT bill_no) orders FROM order_items ${sql} GROUP BY hour ORDER BY hour`).all(params);}
export function topItems(db,filters){const {sql,params}=where(filters);return db.prepare(`SELECT item,item_group groupName,ROUND(SUM(revenue),2) revenue,COUNT(DISTINCT bill_no) orders,SUM(quantity) quantity FROM order_items ${sql} GROUP BY item,item_group ORDER BY revenue DESC LIMIT 10`).all(params);}
export function filterOptions(db){return {dateRange:db.prepare('SELECT MIN(order_datetime) minDate,MAX(order_datetime) maxDate FROM order_items').get(),outlets:db.prepare('SELECT DISTINCT outlet_name value FROM order_items ORDER BY value').all().map(x=>x.value),groups:db.prepare('SELECT DISTINCT item_group value FROM order_items ORDER BY value').all().map(x=>x.value),orderTypes:db.prepare('SELECT DISTINCT order_type value FROM order_items ORDER BY value').all().map(x=>x.value)};}
