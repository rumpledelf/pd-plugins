const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/kaleidoscope.js','utf8');
const context={};
vm.runInNewContext(source.replace("boot(document.getElementById('plugin_kaleidoscope'));",'globalThis.sim={separate,advance};'),context);
let seed=17;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(const reduced of [false,true])for(let trial=0;trial<10;trial++){
  const pieces=Array.from({length:13},()=>({x:8,y:2,size:8+random()*11,angle:random()*6,vx:0,vy:0,spin:0}));
  const sizes=pieces.map(p=>p.size);
  for(let i=0;i<12;i++)context.sim.separate(pieces);
  for(let turn=0;turn<20;turn++){
    for(const p of pieces){p.vx=(random()-.7)*260;p.vy=(random()-.5)*260;p.spin=(random()-.5)*14;}
    let energy;
    for(let frame=0;frame<180;frame++)energy=context.sim.advance(pieces,1/60,reduced);
    assert.ok(energy<.7,'Motion settles after release');
    const radii=pieces.map(p=>Math.hypot(p.x,p.y));
    assert.ok(Math.max(...radii)-Math.min(...radii)>30,'Repeated turns retain radial spread');
    for(const p of pieces){assert.ok(Number.isFinite(p.x+p.y+p.angle));assert.ok(Math.hypot(p.x,p.y)<=101);}
    assert.deepEqual(pieces.map(p=>p.size),sizes,'Drawn sizes never shrink');
  }
}
console.log('Kaleidoscope: 400 repeated tumbles retain size/spread, stay contained and settle; reduced motion also passes.');
