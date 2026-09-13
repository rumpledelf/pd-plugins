const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function harness() {
  class Node {
    constructor() { this.children=[]; this.attrs={}; this.dataset={}; this.events={}; this.classList={remove(){}}; }
    append(n) { n.remove(); this.children.push(n); n.parent=this; }
    remove() { if(this.parent) this.parent.children=this.parent.children.filter(n=>n!==this); this.parent=null; }
    replaceChildren() { this.children.forEach(n=>n.parent=null); this.children=[]; }
    setAttribute(k,v) { this.attrs[k]=String(v); }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(k,fn) { this.events[k]=fn; }
  }
  const nodes={};
  ['stage','rail','falling','landed','status','reset'].forEach(k=>nodes['.fruit-'+k]=new Node());
  const root=new Node(); root.isConnected=true; root.querySelector=s=>nodes[s];
  let next,now=100;
  const context={document:{hidden:false,getElementById:()=>root,createElementNS:()=>new Node()},requestAnimationFrame:f=>{next=f;}};
  vm.createContext(context);
  const code=fs.readFileSync(__dirname+'/full-empty.js','utf8').replace(
    "  boot(document.getElementById('plugin_full-empty'));",
    "  globalThis.model={speed,hitsBucket,slots}; boot(document.getElementById('plugin_full-empty'));");
  vm.runInContext(code,context);
  next(now);
  function run(seconds) { for(let i=0;i<seconds*120;i++) { now+=1000/120; next(now); } }
  function press(n) { n.events.keydown({key:'Enter',preventDefault(){}}); }
  return {root,nodes,run,press,model:context.model};
}

test('catch boundaries, increasing speed and twelve separate stack positions',()=>{
  const {model}=harness();
  assert.equal(model.hitsBucket(193),false); assert.equal(model.hitsBucket(194),true);
  assert.equal(model.hitsBucket(306),true); assert.equal(model.hitsBucket(307),false);
  for(let n=1;n<=12;n++) assert.ok(model.speed(n)>model.speed(n-1));
  assert.equal(new Set(model.slots.map(p=>p.join(','))).size,12);
});
test('a missed apple exits without increasing the count; reset clears a falling apple',()=>{
  const h=harness();
  h.press(h.nodes['.fruit-rail'].children[1]); h.run(2);
  assert.equal(Number(h.root.dataset.count),0);
  assert.equal(h.nodes['.fruit-falling'].children.length,0);
  h.press(h.nodes['.fruit-rail'].children[0]);
  h.nodes['.fruit-reset'].events.click(); h.run(1);
  assert.equal(Number(h.root.dataset.count),0);
  assert.equal(h.nodes['.fruit-falling'].children.length,0);
});
test('keyboard catches settle visibly, fill stops the rail and Reset empties it',()=>{
  const h=harness();
  for(let frame=0;frame<120*60 && Number(h.root.dataset.count)<12;frame++) {
    const candidate=h.nodes['.fruit-rail'].children.find(n=>{
      const x=Number(n.attrs.transform.match(/translate\(([^ ]+)/)[1]);
      return x>=240 && x<=260;
    });
    if(candidate) h.press(candidate);
    h.run(1/120);
  }
  h.run(2);
  assert.equal(Number(h.root.dataset.count),12);
  assert.equal(h.nodes['.fruit-landed'].children.length,12);
  assert.equal(h.nodes['.fruit-status'].textContent,'Full!');
  const before=h.nodes['.fruit-rail'].children.map(n=>n.attrs.transform);
  h.run(2);
  assert.deepEqual(h.nodes['.fruit-rail'].children.map(n=>n.attrs.transform),before);
  h.nodes['.fruit-reset'].events.click();
  assert.equal(Number(h.root.dataset.count),0);
  assert.equal(h.nodes['.fruit-landed'].children.length,0);
});
