const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context={};
vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname+'/fill-drain.js','utf8').replace(
  "  boot(document.getElementById('plugin_fill-drain'));",
  "  globalThis.model={advance,stateName};"),context);
const {advance,stateName}=context.model;

test('one tap fills in fourteen seconds; two fill in seven, at different frame rates',()=>{
  for(const dt of [1/30,1/60,1/120]) for(const taps of [1,2]) {
    let level=0;
    for(let t=0;t<14/taps;t+=dt) level=advance(level,taps,false,dt).level;
    assert.equal(level,1);
  }
});
test('water is bounded; excess spills instead of increasing the stored volume',()=>{
  const result=advance(1,2,false,1);
  assert.equal(result.level,1); assert.ok(Math.abs(result.overflow-.15)<1e-10);
  assert.equal(advance(0,0,true,1).level,0);
  assert.equal(advance(.4,0,false,5).level,.4);
});
test('both taps slowly outpace the drain; one tap still lets it empty',()=>{
  let level=1;
  for(let i=0;i<120*18;i++) level=advance(level,1,true,1/120).level;
  assert.equal(level,0);
  assert.ok(advance(level,2,false,1).level>0);
  assert.ok(Math.abs(advance(0,2,true,5).level-.05)<1e-10);
});
test('status distinguishes filling, overflowing and draining',()=>{
  assert.equal(stateName(0,0,false),'Empty');
  assert.equal(stateName(.5,1,false),'Filling');
  assert.equal(stateName(1,1,false),'Overflowing');
  assert.equal(stateName(1,0,false),'Full');
  assert.equal(stateName(.5,2,true),'Filling slowly');
  assert.equal(stateName(1,2,true),'Overflowing');
  assert.equal(stateName(.5,1,true),'Draining');
  assert.match(stateName(0,1,true),/plug is out/);
  assert.equal(stateName(0,0,true),'Empty');
});
