import {createHash} from 'node:crypto';

export const RECIPIENT='support@mwaikange.com';
const kinds={deletion:'Account removal',privacy:'Privacy request',safety:'Safety report'};
const json=(status,message)=>new Response(JSON.stringify({message}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});

export function validateRequest(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return {error:'Please check your request details.'};
  if(value.website)return {error:'This request could not be accepted.'};
  if(!Object.hasOwn(kinds,value.kind))return {error:'Please select a valid request type.'};
  const email=typeof value.email==='string'?value.email.trim():'';
  if(email.length>254||/[\r\n]/.test(email)||! /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))return {error:'Please enter a valid registered email address.'};
  if(value.kind==='deletion'&&value.consent!==true)return {error:'Please confirm you understand that deletion is permanent.'};
  const username=typeof value.username==='string'?value.username.trim():'';
  const message=typeof value.message==='string'?value.message.trim():'';
  if(username.length>24||/[\r\n\x00-\x1f]/.test(username)||message.length>1000||message.includes('\0'))return {error:'Player names must be at most 24 characters and messages at most 1,000 characters.'};
  if(value.kind!=='deletion'&&!message)return {error:'Please include the details of your request.'};
  return {data:{kind:value.kind,email,username,message,consent:value.consent===true}};
}

export function createRequestHandler({sendMail,env=process.env,now=Date.now}={}){
  const limits=new Map();
  return async request=>{
    if(request.method!=='POST')return new Response(null,{status:405,headers:{Allow:'POST'}});
    const origin=request.headers.get('origin');
    if(!origin||origin!==new URL(request.url).origin)return json(403,'Please submit this request from the QALIM website.');
    if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json(415,'Please submit using the request form.');
    let body;
    try{
      const reader=request.body?.getReader();if(!reader)return json(400,'Request details are missing.');
      const chunks=[];let size=0;
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();return json(413,'This request is too long.');}chunks.push(value);}
      body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }catch{return json(400,'Please check your request details and try again.');}
    const validation=validateRequest(body);if(validation.error)return json(400,validation.error);
    if(!env.SMTP_HOST||!env.SMTP_USER||!env.SMTP_PASS||!env.SMTP_FROM||/[\r\n]/.test(env.SMTP_FROM)||!Number.isInteger(Number(env.SMTP_PORT||587))||![465,587,2525].includes(Number(env.SMTP_PORT||587)))return json(503,'Direct sending is not available yet. Please use “Send using your email app instead”; your details are still here.');
    // Best-effort per-instance throttle; Vercel Firewall supplies distributed limits if needed.
    const time=now();for(const [key,record] of limits)if(record.expires<=time)limits.delete(key);
    const identifier=request.headers.get('x-forwarded-for')?.split(',')[0].trim()||validation.data.email.toLowerCase();
    const key=createHash('sha256').update(identifier).digest('hex');
    const count=limits.get(key)||{count:0,expires:time+15*60*1000};
    if(count.count>=5||(!limits.has(key)&&limits.size>=1000))return json(429,'Please wait 15 minutes before sending another request, or use your email app.');
    count.count++;limits.set(key,count);
    const data=validation.data;
    const message={from:env.SMTP_FROM,to:RECIPIENT,replyTo:data.email,subject:`QALIM tickTack — ${kinds[data.kind]}`,text:[`Request type: ${kinds[data.kind]}`,`Registered email: ${data.email}`,`Player name: ${data.username||'(not provided)'}`,`Message: ${data.message||'(not provided)'}`,data.kind==='deletion'?'Permanent deletion acknowledged: yes':'',`Received at: ${new Date(time).toISOString()}`].filter(Boolean).join('\n\n')};
    try{
      const sent=await sendMail(message,env);
      if(!sent?.accepted?.some(address=>String(address).toLowerCase()===RECIPIENT))return json(502,'The mail server did not accept your request. Please try again or use your email app.');
      return json(200,'Request sent.');
    }catch{
      // Do not log SMTP errors or submitted details: these may contain credentials or personal data.
      return json(502,'Your request could not be sent. Please try again or use your email app instead.');
    }
  };
}
