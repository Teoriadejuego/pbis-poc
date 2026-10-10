'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
test('offline build blocks all connections and enabled builds allow only the configured HTTPS endpoint',async()=>{
  const {feedbackConfig,connectPolicy}=await import('../tools/feedback-config.mjs');
  const offline=feedbackConfig();assert.equal(offline.endpoint,'');assert.equal(connectPolicy(offline),"'none'");
  const enabled=feedbackConfig(' https://opiniones.example.org/api/feedback ');
  assert.equal(connectPolicy(enabled),'https://opiniones.example.org/api/feedback');
  assert.equal(enabled.recipient,'pbis_usuario@outlook.es');assert.equal(enabled.version,'0.10.7');
  for(const value of ['http://example.org/api','https://user:secret@example.org/api','https://example.org/api?key=secret','https://example.org/api#x','https://*.example.org/api',"https://example.org/a';connect-src *",'javascript:alert(1)'])assert.throws(()=>feedbackConfig(value));
});

test('Formspree configuration identifies the provider and permits only its exact form URL',async()=>{
 const {feedbackConfig,connectPolicy}=await import('../tools/feedback-config.mjs');
 const c=feedbackConfig('https://formspree.io/f/mvkgydrn');assert.equal(c.provider,'formspree');assert.equal(connectPolicy(c),c.endpoint);
 for(const url of ['https://formspree.io/other','https://formspree.io:8443/f/mvkgydrn','https://formspree.io/f/mvkgydrn?token=x'])assert.throws(()=>feedbackConfig(url));
});
