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
  vm.runInContext(fs.readFileSync(__dirname+'/divide.js','utf8'),context);
  const get=s=>root.querySelector(s);
  const first=get('.divide-first'),second=get('.divide-second');
  const answer=get('.divide-quotient');
  const marker=get('.divide-feedback');
  const remainder=get('.divide-remainder');
  const check=()=>get('.divide-check').events.click();
  const reveal=()=>get('.divide-show').events.click();
  const random=()=>get('.divide-new').events.click();
  return {first,second,answer,marker,remainder,check,reveal,random};
}
test('correct and incorrect answers use only inline tick/cross',()=>{
  const h=harness();h.first.value=17;h.second.value=5;
  h.answer.value=3;
  if(h.remainder)h.remainder.value=2;
  h.check();assert.equal(h.marker.textContent,'✓');
  h.answer.value=999;h.check();assert.equal(h.marker.textContent,'✗');
  assert.ok(h.marker.attrs['aria-label']);
});
test('answer and operand edits clear stale feedback; reveal is not marked as earned',()=>{
  const h=harness();h.first.value=17;h.second.value=5;
  h.answer.value=999;h.check();
  h.answer.events.input();assert.equal(h.marker.textContent,'');
  h.reveal();assert.equal(h.answer.value,'3');
  assert.equal(h.marker.textContent,'');
  h.first.events.input();assert.equal(h.answer.value,'');assert.equal(h.marker.textContent,'');
  h.answer.value=999;h.check();h.random();
  assert.equal(h.answer.value,'');assert.equal(h.marker.textContent,'');
});
test('invalid entries expose a cross with an accessible explanation',()=>{
  const h=harness();h.first.value='';h.check();
  assert.equal(h.marker.textContent,'✗');assert.ok(h.marker.attrs['aria-label']);
  h.first.value=10;h.second.value=0;h.check();assert.match(h.marker.attrs['aria-label'],/zero/);
});
test('Random is grey and feedback is inside the equation rather than a paragraph',()=>{
  const html=fs.readFileSync(__dirname+'/divide.html','utf8');
  assert.match(html,/arithmetic-random grey" type="button">Random/);
  assert.match(html,/<span[^>]+arithmetic-result/);
  assert.doesNotMatch(html,/New numbers|<p/);
});
test('all fields inherit the same text-control styling and retain integer validation',()=>{
  const html=fs.readFileSync(__dirname+'/divide.html','utf8');
  assert.equal((html.match(/type="text"/g)||[]).length,4);
  assert.doesNotMatch(html,/type="number"/);
  for(const value of ['1e2','1.5','-1','abc','1000000']) {
    const h=harness(); h.first.value=value; h.second.value='2'; h.check();
    assert.equal(h.marker.textContent,'✗');
    assert.match(h.marker.attrs['aria-label'],/whole numbers/);
  }
});
