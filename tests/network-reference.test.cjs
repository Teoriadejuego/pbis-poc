'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../src/raw-wave1.js'),reference=require('./fixtures/network-reference-R.json');
const near=(a,b)=>a==null||b==null?a==null&&b==null:Math.abs(a-b)<=1e-8+1e-8*Math.abs(b);
test('network definitions match independent R/igraph reference networks',()=>{
 assert.equal(reference.igraph,'2.3.3');
 for(const fixture of reference.cases){
  const known=Array.isArray(fixture.known)?fixture.known:[fixture.known];
  const actual=W.networkMetrics(fixture.A,known);
  for(const type of ['eigen','eigenOr']){
   assert.equal(actual[type].status,fixture[type].status,fixture.name+' '+type+' status');
   if(fixture[type].vector){
    assert.equal(actual[type].vector.length,fixture[type].vector.length,fixture.name+' vector length');
    actual[type].vector.forEach((v,i)=>{assert.ok(Number.isFinite(v));assert.ok(near(v,fixture[type].vector[i]),fixture.name+' '+type+' '+i);});
   }
   else assert.equal(actual[type].vector,null,fixture.name+' '+type);
  }
  for(const field of ['centralization','gini','modularity','density'])assert.ok(near(actual[field],fixture[field]),fixture.name+' '+field+': '+actual[field]+' / '+fixture[field]);
  const membership=fixture.membership==null?null:Array.isArray(fixture.membership)?fixture.membership:[fixture.membership];
  assert.deepEqual(actual.membership,membership,fixture.name+' partition');
 }
});
