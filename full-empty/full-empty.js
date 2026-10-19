(function () {
  const CAPACITY = 12;
  const slots = [[226,180],[250,180],[274,180],[214,157],[238,157],[262,157],[286,157],[202,134],[226,134],[250,134],[274,134],[298,134]];
  function speed(count) { return 54 + count * 18 + count * count * 2; }
  function hitsBucket(x) { return x >= 194 && x <= 306; }
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    const stage = root.querySelector('.fruit-stage');
    if (!stage) return;
    root.dataset.pluginBooted = 'true';
    const ns = 'http://www.w3.org/2000/svg';
    const rail = root.querySelector('.fruit-rail');
    const fallingLayer = root.querySelector('.fruit-falling');
    const landed = root.querySelector('.fruit-landed');
    const bucket = root.querySelector('.fruit-bucket');
    const shadow = root.querySelector('.fruit-shadow');
    const status = root.querySelector('.fruit-status');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let moving = [], falling = [], count = 0, previous = 0, catchTime = -10, catchTilt = 0, fullTime = -10, clock = 0;
    function svg(tag, attrs, parent) {
      const n = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k,v]) => n.setAttribute(k,v));
      parent.append(n); return n;
    }
    function apple(parent) {
      const g = svg('g', {}, parent);
      svg('path', {d:'M0 -8Q-12 -16 -13 -3Q-13 11 -3 13Q0 10 3 13Q13 11 13 -3Q12 -16 0 -8', fill:'#B7287E',stroke:'#333333','stroke-width':1},g);
      svg('ellipse', {cx:-6,cy:-2,rx:3,ry:6,fill:'orange',opacity:.45,transform:'rotate(15 -6 -2)'},g);
      svg('path', {d:'M0 -9Q0 -16 4 -18',fill:'none',stroke:'#333333','stroke-width':2},g);
      svg('path', {d:'M2 -12Q5 -23 13 -18Q11 -11 2 -12',fill:'#4CAF50'},g);
      return g;
    }
    function position(f) {
      const rot = f.angle ? ' rotate(' + f.angle.toFixed(1) + ')' : '';
      f.g.setAttribute('transform', 'translate('+f.x.toFixed(2)+' '+f.y.toFixed(2)+')' + rot);
    }
    function renderBucket() {
      if (!bucket) return;
      if (reduced.matches) {
        bucket.removeAttribute('transform');
        if (shadow) shadow.setAttribute('rx', 70);
        return;
      }
      let sx = 1, sy = 1, dy = 0, rot = 0;
      const ct = (clock - catchTime) / .34;
      if (ct >= 0 && ct < 1) {
        const squash = Math.sin(ct * Math.PI * 2) * (1 - ct) * .065;
        sx += squash; sy -= squash;
        rot += Math.sin(ct * Math.PI * 2) * (1 - ct) * catchTilt;
      }
      const ft = (clock - fullTime) / .85;
      if (ft >= 0 && ft < 1) {
        dy -= Math.abs(Math.sin(ft * Math.PI * 2.5)) * (1 - ft * .4) * 9;
        rot += Math.sin(ft * Math.PI * 5) * (1 - ft) * 4.5;
        const squash = Math.sin(ft * Math.PI * 5) * (1 - ft) * .07;
        sx += squash; sy -= squash;
      }
      if (Math.abs(sx - 1) > .002 || Math.abs(sy - 1) > .002 || Math.abs(dy) > .05 || Math.abs(rot) > .05) {
        bucket.setAttribute('transform', 'translate(250 ' + (193 + dy).toFixed(2) + ') rotate(' + rot.toFixed(2) + ') scale(' + sx.toFixed(3) + ' ' + sy.toFixed(3) + ') translate(-250 -193)');
        if (shadow) shadow.setAttribute('rx', (70 * sx - dy * .6).toFixed(1));
      } else {
        bucket.removeAttribute('transform');
        if (shadow) shadow.setAttribute('rx', 70);
      }
    }
    function message() {
      status.textContent = count === 0 ? 'Empty · tap an apple above the bucket.'
        : count === CAPACITY ? 'Full!' : 'Filling · '+count+' of '+CAPACITY;
      root.dataset.count = count;
    }
    function drop(f) {
      if (count >= CAPACITY || f.dropped) return;
      f.dropped = true;
      f.g.removeAttribute('tabindex'); f.g.removeAttribute('role');
      f.g.removeAttribute('aria-label'); f.g.setAttribute('aria-hidden','true');
      f.g.classList.remove('fruit-apple'); f.stalk.remove();
      fallingLayer.append(f.g); f.vy = 0; f.spin = (Math.random() < .5 ? -1 : 1) * (40 + Math.random() * 45);
      falling.push(f);
      moving = moving.filter(a => a !== f);
    }
    function spawn(x) {
      const g = svg('g', {class:'fruit-apple',tabindex:0,role:'button','aria-label':'Drop apple into bucket'},rail);
      svg('rect',{x:-20,y:-22,width:40,height:42,fill:'transparent'},g);
      const stalk = svg('path',{d:'M0 -26V-15',stroke:'#999999','stroke-width':2,'pointer-events':'none'},g);
      apple(g);
      const f = {g,stalk,x,y:48,angle:0,spin:0,bob:Math.random()*Math.PI*2,bobRate:1.5+Math.random(),baseY:59+Math.random()*8};
      g.addEventListener('click', () => drop(f));
      g.addEventListener('keydown', e => { if(e.key === ' ' || e.key === 'Enter') { e.preventDefault(); drop(f); } });
      moving.push(f); position(f);
    }
    function reset() {
      rail.replaceChildren(); fallingLayer.replaceChildren(); landed.replaceChildren();
      moving = []; falling = []; count = 0; catchTime = -10; fullTime = -10;
      renderBucket();
      [-20,100,220,340,460].forEach(spawn); message();
    }
    function step(dt) {
      clock += dt;
      if (count < CAPACITY) {
        moving.forEach(f => {
          f.x += speed(count)*dt; f.bob += f.bobRate*dt;
          f.y = f.baseY + Math.sin(f.bob)*20;
          f.angle = reduced.matches ? 0 : Math.cos(f.bob) * 6;
          f.stalk.setAttribute('d','M0 '+(22-f.y)+'V-15');
          position(f);
        });
        moving = moving.filter(f => { if(f.x > 535) { f.g.remove(); return false; } return true; });
        const first = moving.reduce((x,f) => Math.min(x,f.x), 600);
        if(first >= 100) spawn(-20);
      }
      falling = falling.filter(f => {
        if (f.slot !== undefined) {
          f.elapsed += dt;
          const t = Math.min(1,f.elapsed/.38), eased = 1-(1-t)*(1-t), target = slots[f.slot];
          f.x = f.startX+(target[0]-f.startX)*eased;
          f.y = 105+(target[1]-105)*eased-Math.sin(t*Math.PI*2)*4*(1-t);
          f.angle = f.startAngle * (1 - eased) + f.finalAngle * eased;
          position(f);
          if(t === 1) { landed.append(f.g); return false; }
          return true;
        }
        const oldY = f.y; f.vy += 390*dt; f.y += f.vy*dt;
        if (!reduced.matches) f.angle += (f.spin || 0) * dt;
        if(oldY < 105 && f.y >= 105 && hitsBucket(f.x) && count < CAPACITY) {
          f.slot = count++; f.startX = f.x; f.startAngle = f.angle || 0; f.finalAngle = (f.slot % 2 ? -1 : 1) * (4 + (f.slot % 3) * 3);
          f.elapsed = 0; f.y = 105;
          catchTime = clock; catchTilt = (f.x - 250) * .055;
          message();
          if(count === CAPACITY) {
            fullTime = clock + .22;
            moving.forEach(a => { a.g.removeAttribute('tabindex'); a.g.setAttribute('aria-disabled','true'); });
          }
        }
        position(f);
        if(f.y > 235) { f.g.remove(); return false; }
        return true;
      });
      renderBucket();
    }
    function frame(now) {
      const dt = previous ? Math.min((now-previous)/1000,.05) : 0; previous = now;
      if (!document.hidden) for(let left=dt;left>0;left-=1/120) step(Math.min(left,1/120));
      if(root.isConnected) requestAnimationFrame(frame);
    }
    root.querySelector('.fruit-reset').addEventListener('click',reset);
    reset(); requestAnimationFrame(frame);
  }
  boot(document.getElementById('plugin_full-empty'));
})();
