const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID,randomBytes}=require('node:crypto'),C=require('../src/audit-connection.js');
const fixture=()=>({schema:'pbis.audit-connection.v1',endpoint:'https://script.google.com/macros/s/TEST/exec',projectId:randomUUID(),revision:1,userCode:'U-'+randomUUID(),username:'orientacion',token:randomBytes(32).toString('base64')});
test('private orientation connection admits only its schema and Google endpoint',()=>{
 const c=fixture();assert.deepEqual(C.parse(JSON.stringify(c)),c);
 for(const bad of [{...c,password:'do-not-store'},{...c,username:'another'},{...c,endpoint:'https://example.test/exec'},{...c,token:'short'},null])assert.throws(()=>C.parse(JSON.stringify(bad)));
 assert.throws(()=>C.parse('not json'));assert.throws(()=>C.parse(' '.repeat(4097)));
});
