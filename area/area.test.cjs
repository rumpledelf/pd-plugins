const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function harness(){
  class Node {
    constructor(){this.value='';this.dataset={};this.events={};this.attrs={};this.style={};this.textContent='';}
    addEventListener(k,f){this.events[k]=f;}
    setAttribute(k,v){this.attrs[k]=v;}
    toggleAttribute(k,on){if(on)this.attrs[k]='';else delete this.attrs[k];}
    focus(){}
  }
  const form=new Node(),units=new Node(),result=new Node(),preview=new Node();
  units.value='cm';
  const rows={};
  for(const name of ['width','height','base','radius']){
    const row=new Node(),input=new Node(),unit=new Node();
    row.dataset.field=name;row.querySelector=s=>s==='input'?input:unit;
    rows[name]={row,input};
  }
  const radios=['rectangle','triangle','circle'].map(value=>Object.assign(new Node(),{value}));
  const diagrams=radios.map(r=>{const n=new Node();n.dataset.diagram=r.value;return n;});
  let selected=radios[0];
  const root={dataset:{},querySelector(s){
    return {'.measurement-module':form,'.measurement-units select':units,'.measurement-result':result,'.measurement-preview':preview}[s]||selected;
  },querySelectorAll(s){
    if(s==='[data-field]')return Object.values(rows).map(f=>f.row);
    if(s==='[data-diagram]')return diagrams;
    return radios;
  }};
  vm.runInNewContext(fs.readFileSync(__dirname+'/area.js','utf8'),{document:{getElementById:()=>root}});
  function set(name,value){rows[name].input.value=String(value);rows[name].input.events.input();}
  function shape(name){selected=radios.find(r=>r.value===name);selected.events.change();}
  function unit(value){units.value=value;units.events.change();}
  function calculate(){form.events.submit({preventDefault(){}});return result.textContent;}
  return {rows,diagrams,preview,set,shape,unit,calculate,result,units};
}
test('rectangle, triangle and circle results have at most two decimal places',()=>{
  const h=harness();
  h.set('width',3.333);h.set('height',3.333);
  assert.equal(h.calculate(),'Area: 11.11 cm²');
  h.shape('triangle');h.set('base',3.333);
  assert.equal(h.calculate(),'Area: 5.55 cm²');
  assert.equal(h.rows.base.row.style.order,0);assert.equal(h.rows.height.row.style.order,1);
  h.shape('circle');h.set('radius',1);
  assert.equal(h.calculate(),'Area: 3.14 cm²');
  h.set('radius',2);assert.equal(h.result.textContent,'');
  assert.equal(h.calculate(),'Area: 12.57 cm²');
});
test('unit conversion keeps canonical precision, independent of rounded area display',()=>{
  const h=harness();h.shape('circle');h.set('radius',1);h.calculate();
  for(let i=0;i<20;i++){h.unit('in');h.unit('ft');h.unit('m');h.unit('cm');}
  assert.equal(h.rows.radius.input.value,'1');
  assert.equal(h.result.textContent,'Area: 3.14 cm²');
  h.unit('in');assert.equal(h.result.textContent,'Area: 0.49 in²');
});
test('shape switches select one diagram and only validate the required dimensions',()=>{
  const h=harness();h.set('width','bad');h.shape('circle');h.set('radius',1);
  assert.equal(h.calculate(),'Area: 3.14 cm²');
  assert.deepEqual(h.diagrams.filter(n=>!('hidden' in n.attrs)).map(n=>n.dataset.diagram),['circle']);
  assert.match(h.preview.attrs['aria-label'],/centre to its edge/);
  assert.equal(h.rows.radius.row.hidden,false);assert.equal(h.rows.width.row.hidden,true);
});
test('invalid, zero, negative and nondecimal dimensions are rejected',()=>{
  for(const value of ['',0,-1,'Infinity','0x10','bad']){
    const h=harness();h.shape('circle');h.set('radius',value);
    assert.match(h.calculate(),/greater than zero/);
    h.unit('m');
    if(value!=='')assert.equal(h.units.value,'cm');
  }
});
test('radius and the other dimensions all use host text controls',()=>{
  const html=fs.readFileSync(__dirname+'/area.html','utf8');
  assert.equal((html.match(/type="text" inputmode="decimal"/g)||[]).length,4);
  assert.doesNotMatch(html,/type="number"/);
});
