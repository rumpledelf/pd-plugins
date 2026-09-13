const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function harness() {
  class Element {
    constructor() {
      this.storedValue=''; this.attrs={}; this.events={}; this.textContent='';
      this.classList={toggle(){}};
    }
    get value(){return this.storedValue;}
    set value(v){this.storedValue=String(v);}
    setAttribute(k,v){this.attrs[k]=String(v);}
    removeAttribute(k){delete this.attrs[k];}
    addEventListener(k,f){this.events[k]=f;}
    focus(){}
  }
  const nodes=new Map();
  const root={dataset:{},querySelector(s){if(!nodes.has(s))nodes.set(s,new Element());return nodes.get(s);}};
  const context={document:{getElementById:()=>root}};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(__dirname+'/multiply.js','utf8'),context);
  const get=s=>root.querySelector(s);
  const first=get('.multiply-first'),second=get('.multiply-second');
  const answer=get('.multiply-answer');
  const marker=get('#multiply-feedback');
  const remainder=null;
  const check=()=>get('form').events.submit({preventDefault(){}});
  const reveal=()=>get('.multiply-show').events.click();
  const random=()=>get('.multiply-new').events.click();
  return {first,second,answer,marker,remainder,check,reveal,random};
}
test('correct and incorrect answers use only inline tick/cross',()=>{
  const h=harness();h.first.value=17;h.second.value=5;
  h.answer.value=85;
  if(h.remainder)h.remainder.value=2;
  h.check();assert.equal(h.marker.textContent,'✓');
  h.answer.value=999;h.check();assert.equal(h.marker.textContent,'✗');
  assert.ok(h.marker.attrs['aria-label']);
});
test('answer and operand edits clear stale feedback; reveal is not marked as earned',()=>{
  const h=harness();h.first.value=17;h.second.value=5;
  h.answer.value=999;h.check();
  h.answer.events.input();assert.equal(h.marker.textContent,'');
  h.reveal();assert.equal(h.answer.value,'85');
  assert.equal(h.marker.textContent,'');
  h.first.events.input();assert.equal(h.answer.value,'');assert.equal(h.marker.textContent,'');
  h.answer.value=999;h.check();h.random();
  assert.equal(h.answer.value,'');assert.equal(h.marker.textContent,'');
});
test('invalid entries expose a cross with an accessible explanation',()=>{
  const h=harness();h.first.value='';h.check();
  assert.equal(h.marker.textContent,'✗');assert.ok(h.marker.attrs['aria-label']);
});
test('Random is grey and feedback is inside the equation rather than a paragraph',()=>{
  const html=fs.readFileSync(__dirname+'/multiply.html','utf8');
  assert.match(html,/arithmetic-random grey" type="button">Random/);
  assert.match(html,/<span[^>]+arithmetic-result/);
  assert.doesNotMatch(html,/New numbers|<p/);
});
