import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateCatalog,validateData} from '../tools/validate-data.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../data/schema.json',import.meta.url)));
test('catalog, synthetic fixtures and public pilot accounts satisfy their contracts',()=>{
  assert.equal(validateData().students,1512);
});
test('catalog rejects missing arrays, repeated columns, unknown fields and invalid scales',()=>{
  const missing=structuredClone(catalog);delete missing.dataColumns;
  for(const value of [missing,{...catalog,dataColumns:['ID','ID']},{...catalog,token:'not-allowed'},{...catalog,scale:'other'}, {...catalog,groups:'A'}])assert.throws(()=>validateCatalog(value));
});
