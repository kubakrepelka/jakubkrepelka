import test from 'node:test';
import assert from 'node:assert/strict';
import { createContactHandler } from '../server/contact.js';
import { validateContact } from '../shared/contact.js';
const input = { name: 'Jan Novák', email: 'jan@example.com', phone: '+420 777 123 456', service: 'Webové stránky', message: 'Potřebuji nový web.', requestId: '12345678-1234-1234-1234-123456789abc' };
const env = { RESEND_API_KEY: 'test-only', CONTACT_EMAIL: 'info@jkweby.cz', CONTACT_FROM_EMAIL: 'JK WEBY <web@mail.jkweby.cz>', NODE_ENV: 'production' };
async function run(body = input, options = {}, request = {}) {
  const res = { headers: {}, setHeader(k,v) { this.headers[k] = v; }, status(v) { this.code = v; return this; }, json(v) { this.body = v; return this; } };
  await createContactHandler({ env, limit: () => true, send: async () => ({ data: { id: 'mock' } }), ...options })({ method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://jkweby.cz' }, body, ...request }, res);
  return res;
}
test('required fields, email, phone, lengths and service are validated', () => {
  assert.equal(validateContact({}).valid, false);
  for (const patch of [{email:'invalid'}, {phone:'abc'}, {phone:'123'}, {service:'invalid'}, {name:'a'.repeat(101)}, {message:'a'.repeat(5001)}, {email:[]}]) assert.equal(validateContact({...input,...patch}).valid, false);
  assert.equal(validateContact({...input,phone:''}).valid, true);
});
test('main email uses verified sender and visitor replyTo; retry keys are stable', async () => {
  const calls = []; const send = async (...args) => { calls.push(args); return {data:{id:'ok'}}; };
  assert.equal((await run(input,{send})).code,200);
  await run(input,{send});
  assert.equal(calls[0][0].replyTo,input.email);
  assert.equal(calls[0][0].from,env.CONTACT_FROM_EMAIL);
  assert.equal(calls[1][0].to,input.email);
  assert.deepEqual(calls[0],calls[2]);
});
test('honeypot never sends; malformed and invalid data rejected', async () => {
  const send = () => { throw Error('must not send'); };
  assert.equal((await run({...input,website:'spam'},{send})).code,200);
  assert.equal((await run({}, {send})).code,400);
  assert.equal((await run('{')).code,400);
  assert.equal((await run({...input,message:'x'.repeat(25000)})).code,413);
});
test('method, origin, rate limit and missing configuration', async () => {
  assert.equal((await run(input,{}, {method:'GET'})).code,405);
  assert.equal((await run(input,{}, {headers:{origin:'https://evil.example'}})).code,403);
  assert.equal((await run(input,{limit:()=>false})).code,429);
  assert.equal((await run(input,{env:{}})).code,503);
});
test('main failure is retryable; confirmation failure remains success', async () => {
  assert.equal((await run(input,{send:async()=>({error:{message:'failed'}})})).code,502);
  let n=0;
  assert.equal((await run(input,{send:async()=> ++n===1 ? {data:{id:'ok'}} : {error:{message:'failed'}}})).code,200);
});
test('Turnstile fails closed and checks action and hostname', async () => {
  const options = {env:{...env,TURNSTILE_SECRET_KEY:'test'}, fetcher:async()=>({ok:true,json:async()=>({success:true,hostname:'jkweby.cz',action:'contact'})})};
  assert.equal((await run(input,options)).code,400);
  assert.equal((await run({...input,turnstileToken:'test'},options)).code,200);
  assert.equal((await run({...input,turnstileToken:'test'},{...options,fetcher:async()=>({ok:true,json:async()=>({success:true,hostname:'evil.example',action:'contact'})})})).code,400);
});
