const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={};
vm.runInNewContext(fs.readFileSync(__dirname+'/momentum.js','utf8').replace("boot(document.getElementById('plugin_momentum'));",'globalThis.sim={makeState,step,collide};'),context);
const {makeState,step,collide}=context.sim;
for(const m1 of [1,3])for(const m2 of [1,3])for(const speed of [45,90,140]){
  const [v1,v2]=collide(m1,m2,speed,0);
  assert.ok(Math.abs(m1*speed-m1*v1-m2*v2)<1e-9,'Momentum is conserved across collision');
  assert.ok(m1*v1*v1+m2*v2*v2<=m1*speed*speed+1e-9,'Collision cannot create kinetic energy');
  assert.ok(v2>0);if(m1<m2)assert.ok(v1<0);else assert.ok(v1>=0);
  for(const dt of [1/60,1/120,1/240]){
    const s=makeState(m1,m2);s.phase='moving';s.v1=speed;
    for(let i=0;i<20/dt;i++){
      step(s,dt);assert.ok(Number.isFinite(s.x1+s.x2+s.v1+s.v2));assert.ok(s.x2-s.x1>=112-1e-8);assert.ok(s.x1>=54&&s.x2<=526);
    }
    assert.ok(s.hit,'Even a quick tap reaches the other trolley');assert.equal(s.phase,'done');assert.equal(s.v1,0);assert.equal(s.v2,0);
  }
}
console.log('Momentum: all mass/power combinations conserve impact momentum, lose energy, avoid overlap and settle at three timesteps.');
