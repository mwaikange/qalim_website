import nodemailer from 'nodemailer';
import { createRequestHandler } from '../lib/requests.js';

const handler=createRequestHandler({sendMail:async (message,env)=>{
  const port=Number(env.SMTP_PORT||587);
  const transport=nodemailer.createTransport({host:env.SMTP_HOST,port,secure:port===465,requireTLS:port!==465,auth:{user:env.SMTP_USER,pass:env.SMTP_PASS},connectionTimeout:8000,greetingTimeout:8000,socketTimeout:12000});
  try{return await transport.sendMail(message);}finally{transport.close();}
}});

export default {fetch:handler};
