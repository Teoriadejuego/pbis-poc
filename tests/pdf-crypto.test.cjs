const {test}=require('node:test'),assert=require('node:assert/strict');
const PDF=require('../src/pdf-crypto.js');
test('PDF password requires the full valid DNI, canonical uppercase, including leading zeros',()=>{
 assert.equal(PDF.normalizeDni(' 12345678z '),'12345678Z');
 assert.equal(PDF.normalizeDni('00000000t'),'00000000T');
 for(const value of ['',null,'orientacion','FRJ508','12345678','12345678A','1*3**6*8Z','12345678-Z','1234567 Z'])assert.throws(()=>PDF.normalizeDni(value),/DNI completo/);
});
test('PDF encryption fails closed if cancelled or unavailable; no plaintext fallback',async()=>{
 await assert.rejects(PDF.protect(new ArrayBuffer(10),'12345678Z',{current:()=>false}),/consulta ha cambiado/);
 await assert.rejects(PDF.protect(new ArrayBuffer(10),'12345678Z'),/navegador no permite/);
 assert.throws(()=>PDF.protect(new ArrayBuffer(10),''),/DNI completo/);
});
