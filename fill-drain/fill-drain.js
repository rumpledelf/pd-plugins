(function () {
  function advance(level, taps, unplugged, dt) {
    const incoming = taps * .075, outgoing = unplugged ? .14 : 0;
    const raw = level + (incoming-outgoing)*dt;
    return {level: Math.max(0,Math.min(1,raw)), overflow: Math.max(0,raw-1)};
  }
  function stateName(level, taps, unplugged) {
    if(unplugged && taps === 2) return level >= 1 ? 'Overflowing' : 'Filling slowly';
    if(unplugged && level > 0) return 'Draining';
    if(unplugged && taps) return 'Draining · plug is out';
    if(level >= 1 && taps) return 'Overflowing';
    if(taps) return 'Filling';
    return level <= 0 ? 'Empty' : level >= 1 ? 'Full' : 'Tap off';
  }
  function boot(root) {
    if(!root || root.dataset.pluginBooted === 'true') return;
    const stage = root.querySelector('.bath-stage');
    if(!stage) return;
    root.dataset.pluginBooted = 'true';
    const taps = [...root.querySelectorAll('.bath-tap')], plug = root.querySelector('.bath-plug');
    const water = root.querySelector('.bath-water'), streams = root.querySelector('.bath-streams');
    const upperStreams = root.querySelector('.bath-upper-streams'), spills = root.querySelector('.bath-spills');
    const ripple = root.querySelector('.bath-ripple'), status = root.querySelector('.bath-status');
    const ns = 'http://www.w3.org/2000/svg';
    let on = [false,false], unplugged = false, level = 0, time = 0, spillTime = 0, spillSide = 0, previous = 0, lastState = '';
    const inside = [], upper = [], drops = [];
    function node(tag,attrs,parent) {
      const n=document.createElementNS(ns,tag);
      Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v)); parent.append(n); return n;
    }
    [175,261].forEach(x => {
      inside.push(node('rect',{x:x-3,y:85,width:6,height:87},streams));
      upper.push(node('rect',{x:x-3,y:58,width:6,height:27},upperStreams));
    });
    for(let i=0;i<18;i++) drops.push({node:node('ellipse',{rx:2.5,ry:4},spills),age:-1,side:0});
    function render() {
      const n = on.filter(Boolean).length, y = 172-level*87;
      const wave = n && level > 0 && level < 1 ? Math.sin(time*5)*.7 : 0;
      water.setAttribute('d','M110 '+y+'Q245 '+(y+wave)+' 398 '+y+'V176H110Z');
      water.style.display = level > 0 ? '' : 'none';
      inside.forEach((s,i) => { s.style.display = on[i] ? '' : 'none'; s.setAttribute('height',Math.max(0,y-85)); });
      upper.forEach((s,i) => { s.style.display = on[i] ? '' : 'none'; });
      taps.forEach((tap,i) => {
        tap.setAttribute('aria-pressed',String(on[i]));
        tap.querySelector('.bath-handle').style.transform = on[i] ? 'rotate(30deg)' : '';
      });
      plug.setAttribute('aria-pressed',String(unplugged));
      plug.setAttribute('aria-label',unplugged ? 'Put plug back in' : 'Pull out plug');
      root.querySelector('.bath-stopper').style.transform=unplugged ? 'translate(23px, -51px)' : '';
      root.querySelector('.bath-chain').setAttribute('d',unplugged ? 'M373 91Q385 99 364 111' : 'M373 91Q375 140 341 162');
      drops.forEach(d => {
        const p=Math.max(0,d.age)/.8;
        const spread=unplugged ? 4 : 17;
        d.node.style.display=d.age>=0 ? '' : 'none';
        d.node.setAttribute('rx',unplugged ? 1.2 : 2.5);
        d.node.setAttribute('cx',d.side ? 402+p*spread : 108-p*spread);
        d.node.setAttribute('cy',84+118*p*p);
      });
      if(unplugged && level > .02) {
        const radius = 4+(time*12)%18;
        ripple.setAttribute('d','M'+(341-radius)+' '+(y+3)+'Q341 '+(y+8)+' '+(341+radius)+' '+(y+3));
      } else ripple.setAttribute('d','');
      const name=stateName(level,n,unplugged);
      if(name!==lastState) { status.textContent=name==='Empty' ? 'Empty · turn a tap.' : name; lastState=name; }
      root.dataset.state=name; root.dataset.level=level.toFixed(3);
    }
    function activate(el,action) {
      el.addEventListener('click',action);
      el.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' ') { e.preventDefault(); action(); } });
    }
    taps.forEach((tap,i)=>activate(tap,()=>{ on[i]=!on[i]; render(); }));
    activate(plug,()=>{ unplugged=!unplugged; render(); });
    root.querySelector('.bath-reset').addEventListener('click',()=>{ on=[false,false]; unplugged=false; level=0; time=0; spillTime=0; spillSide=0; drops.forEach(d=>{d.age=-1;}); render(); });
    function frame(now) {
      const dt=previous ? Math.min((now-previous)/1000,.05) : 0; previous=now;
      if(!document.hidden) {
        time+=dt;
        const tapsOn=on.filter(Boolean).length;
        level=advance(level,tapsOn,unplugged,dt).level;
        const excess=Math.max(0,tapsOn*.075-(unplugged ? .14 : 0));
        drops.forEach(d=>{ if(d.age>=0) { d.age+=dt; if(d.age>.8) d.age=-1; } });
        if(level>=1 && excess>0) {
          spillTime+=dt*(unplugged ? 18 : 18*excess/.15);
          while(spillTime>=1) {
            spillTime-=1;
            const drop=drops.find(d=>d.age<0);
            if(drop) { drop.age=0; drop.side=spillSide++%2; }
          }
        } else spillTime=0;
        render();
      }
      if(root.isConnected) requestAnimationFrame(frame);
    }
    render(); requestAnimationFrame(frame);
  }
  boot(document.getElementById('plugin_fill-drain'));
})();
