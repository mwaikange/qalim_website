import {readFile,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
for(const name of ['index.html','help.html']){
  const html=await readFile('public/'+name,'utf8');
  if(!html.includes('name="viewport"')||!html.includes('<main'))throw Error(`Missing page structure: ${name}`);
  for(const [,url] of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g))if(/\.(?:css|js|svg|png)$/.test(url))await stat('public'+url);
}
for(const file of ['api/request.js','lib/requests.js','public/site-config.js','public/site.js','public/demo.js','public/styles.css'])await stat(file);
const site=process.env.SITE_URL;
if(site){const url=new URL(site);if(url.protocol!=='https:')throw Error('SITE_URL must use HTTPS.');const base=url.origin;const routes=['/','/help','/privacy-policy','/child-safety','/request-account-removal'];await writeFile('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route=>`<url><loc>${base+route}</loc></url>`).join('')}</urlset>`);await writeFile('public/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);}else await writeFile('public/robots.txt','User-agent: *\nAllow: /\n');
console.log('Static pages, local assets and request endpoint verified. Vercel output: public/.');
