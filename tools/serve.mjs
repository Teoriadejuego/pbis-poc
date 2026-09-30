import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../site');
const port=Number(process.env.PORT||8890);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.zip':'application/zip','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{try{const url=new URL(req.url,'http://localhost');const requested=decodeURIComponent(url.pathname);const file=path.resolve(root,'.'+requested+(requested.endsWith('/')?'index.html':''));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}const stat=fs.statSync(file);if(!stat.isFile())throw Error();res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);}catch{res.writeHead(404);res.end('Archivo no encontrado');}}).listen(port,'127.0.0.1',()=>console.log('RADARS web local: http://127.0.0.1:'+port));
