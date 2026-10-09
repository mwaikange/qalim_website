import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import api from '../api/request.js';

const root=path.resolve('public'),port=Number(process.env.PORT||3001);
const aliases={'/':'/index.html','/help':'/help.html','/privacy-policy':'/help.html','/child-safety':'/help.html','/request-account-removal':'/help.html'};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
const settings=JSON.parse(await readFile('vercel.json','utf8'));
http.createServer(async(req,res)=>{
  for(const header of settings.headers[0].headers)res.setHeader(header.key,header.value);
  try{
    const url=new URL(req.url,`http://${req.headers.host}`);
    if(url.pathname==='/api/request'){
      const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>8192){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({message:'Request too long.'}));return;}chunks.push(chunk);}
      const request=new Request(url,{method:req.method,headers:req.headers,...(req.method!=='GET'&&req.method!=='HEAD'?{body:Buffer.concat(chunks)}:{})});
      const response=await api.fetch(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
    }
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
    const pathname=decodeURIComponent(url.pathname).replace(/\/$/,'')||'/';
    const file=path.resolve(root,'.'+(aliases[pathname]||pathname));
    if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Page not found.');}
}).listen(port,'127.0.0.1',()=>console.log(`QALIM website: http://127.0.0.1:${port}`));
