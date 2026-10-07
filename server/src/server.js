import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, closeDatabase } from './db.js';
import { summary,revenueTrend,categories,outlets,orderTypes,hourly,topItems,filterOptions } from './queries.js';

dotenv.config();
const app=express();
const port=Number(process.env.PORT||5000);
const allowed=process.env.CLIENT_ORIGIN||'http://localhost:5173';
app.use(cors({origin:allowed==='*'?true:allowed}));
app.use(express.json());
function parseFilters(query){
  const f={};
  for(const key of ['startDate','endDate','outlet','group','orderType']){const v=typeof query[key]==='string'?query[key].trim():'';if(v)f[key]=v;}
  for(const key of ['startDate','endDate']) if(f[key]&&!/^\d{4}-\d{2}-\d{2}$/.test(f[key])) throw new Error(`Invalid ${key}`);
  if(f.startDate&&f.endDate&&f.startDate>f.endDate) throw new Error('startDate cannot be after endDate');
  return f;
}
app.get('/api/health',(_req,res)=>{const r=db.prepare('SELECT COUNT(*) count FROM order_items').get();res.json({status:'ok',records:r.count});});
app.get('/api/filters',(_req,res,next)=>{try{res.json(filterOptions(db));}catch(e){next(e);}});
app.get('/api/dashboard',(req,res,next)=>{try{const f=parseFilters(req.query);res.json({summary:summary(db,f),revenueTrend:revenueTrend(db,f),categories:categories(db,f),outlets:outlets(db,f),orderTypes:orderTypes(db,f),hourly:hourly(db,f),topItems:topItems(db,f)});}catch(e){next(e);}});
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const dist=path.resolve(__dirname,'../../client/dist');
app.use(express.static(dist));
app.get('/{*splat}',(req,res,next)=>{if(req.path.startsWith('/api/'))return next();res.sendFile(path.join(dist,'index.html'),e=>e&&next(e));});
app.use((err,_req,res,_next)=>{console.error(err);const bad=/^Invalid|cannot be/.test(err.message||'');res.status(bad?400:500).json({error:bad?err.message:'Unable to complete the request.'});});
const server=app.listen(port,()=>console.log(`Analytics dashboard running on http://localhost:${port}`));
function shutdown(){server.close(()=>{closeDatabase();process.exit(0);});}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
