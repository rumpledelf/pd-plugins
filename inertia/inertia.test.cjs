const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={};
vm.runInNewContext(fs.readFileSync(__dirname+'/inertia.js','utf8').replace("boot(document.getElementById('plugin_inertia'));",'globalThis.sim={makeState,step};'),context);
const {makeState,step}=context.sim;
for(const reduced of [false,true])for(const dt of [1/60,1/120,1/240]){
  const s=makeState();step(s,1);assert.equal(s.cart,70);s.phase='rolling';
  let stopped=false,fell=false;
  for(let i=0;i<10/dt;i++){
    const previous=s.phase;step(s,dt,reduced);
    if(previous==='rolling'&&s.phase!=='rolling'){assert.equal(s.cart,270);assert.equal(s.vx,100,'Stopping cart does not stop ball');stopped=true;}
    if(s.phase==='falling'){fell=true;assert.ok(s.ball>=350);}
    if(stopped)assert.equal(s.cart,270);
    assert.ok(Number.isFinite(s.ball+s.y+s.vx+s.vy));assert.ok(s.ball<550&&s.y<=129);
  }
  assert.ok(stopped&&fell);assert.equal(s.phase,'done');assert.equal(s.vx,0);assert.ok(s.ball>400);
}
console.log('Inertia: carried motion, independent ball velocity at stop, fall, containment and rest pass at three timesteps and reduced motion.');
