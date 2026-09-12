const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const context={};
vm.runInNewContext(fs.readFileSync(__dirname+'/boing.js','utf8').replace("boot(document.getElementById('plugin_boing'));",'globalThis.sim={makeState,integrate,tilt,PITCH,BASE,TOP};'),context);
const {makeState,integrate,tilt,PITCH,BASE,TOP}=context.sim;
assert.equal(PITCH,3.5,'Resting coils retain a small visible gap');
assert.equal(BASE-TOP,42,'Spring starts as a compact stack on the desk');
for(const x of [-80,0,80]){
  const nodes=makeState();
  for(let i=0;i<960;i++)integrate(nodes,1/240,true,{x,y:-100});
  if(x)assert.ok(Math.sign(tilt(nodes,12))===Math.sign(x)&&Math.abs(tilt(nodes,12))>.1,'Top follows the bend');
  let compressed=false,rebounded=false;
  for(let i=0;i<4800;i++){
    integrate(nodes,1/240,false,{});
    if(nodes[12].y>-.5)compressed=true;
    if(compressed&&nodes[12].y<-2)rebounded=true;
    assert.ok(nodes.every(n=>Number.isFinite(n.x+n.y+n.vx+n.vy)));
    assert.equal(nodes[0].x,0);assert.equal(nodes[0].y,0);
    for(let j=1;j<nodes.length;j++)assert.ok(PITCH+nodes[j-1].y-nodes[j].y>=2.5-1e-6,'Coils cannot compress through neighbors');
  }
  assert.ok(compressed&&rebounded,'Release compresses and rebounds');
  assert.ok(nodes.every(n=>Math.abs(n.x)<.1&&Math.abs(n.y)<.1),'Spring settles');
}
console.log('Boing: left/right tilt, compression, rebound, fixed base, contact spacing and settling pass.');
