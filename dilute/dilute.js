(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const jug = root.querySelector('.dilute-jug');
    const jugShadow = root.querySelector('.dilute-jug-shadow');
    const liquid = root.querySelector('.dilute-liquid');
    const surface = root.querySelector('.dilute-surface');
    const swirl = root.querySelector('.dilute-swirl');
    const stream = root.querySelector('.dilute-stream');
    const splash = root.querySelector('.dilute-splash');
    const jugWater = root.querySelector('.dilute-jug-water');
    const status = root.querySelector('#dilute-status');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let volume = 40, tilt = 0, mixing = 0, held = false, pointer = null, key = null, frame = 0, last = 0;
    const interior = [[-41,-57],[56,-57],[38.5,-43],[23,69],[-23,69]];
    function rotate(points, angle) {
      const c = Math.cos(angle), s = Math.sin(angle);
      return points.map(([x,y]) => [x*c-y*s,x*s+y*c]);
    }
    function area(points) {
      return Math.abs(points.reduce((sum,p,i) => {
        const q=points[(i+1)%points.length]; return sum+p[0]*q[1]-q[0]*p[1];
      },0))/2;
    }
    function below(points, level) {
      const result=[];
      points.forEach((p,i) => {
        const q=points[(i+1)%points.length], inside=p[1]>=level, next=q[1]>=level;
        if(inside) result.push(p);
        if(inside!==next) {
          const t=(level-p[1])/(q[1]-p[1]);
          result.push([p[0]+t*(q[0]-p[0]),level]);
        }
      });
      return result;
    }
    const capacity=area(interior);
    function waterFraction() { return .78-(volume-40)/200*.58; }
    function spillAngle() {
      let low=0,high=110;
      for(let i=0;i<20;i++) {
        const mid=(low+high)/2, shape=rotate(interior,mid*Math.PI/180);
        if(area(below(shape,shape[1][1]))/capacity>waterFraction()) low=mid;
        else high=mid;
      }
      return (low+high)/2;
    }
    function draw(now, dt) {
      const tippingPoint=spillAngle();
      const target = held && volume < 240 ? tippingPoint+2 : 0;
      tilt += (target - tilt) * Math.min(1, dt * 9);
      if (Math.abs(target - tilt) < .02) tilt = target;
      const pouring = held && tilt >= tippingPoint-.5 && volume < 240;
      if (pouring) { volume = Math.min(240, volume + dt * 26); mixing = 1; }
      else mixing = Math.max(0, mixing - dt * 1.2);
      if (volume === 240 && held) { held = false; status.textContent = 'Full glass · lighter cordial'; }
      // The tapered glass gets wider upwards: equal additions raise its
      // surface progressively less. Integrate its illustrated cross-section.
      const slope = 12 / 87;
      const filledArea = volume / 240 * (32 * 77 + slope * 77 * 77);
      const height = (Math.sqrt(32 * 32 + 4 * slope * filledArea) - 32) / (2 * slope);
      const y = 190 - height;
      const wave = reduced.matches ? 0 : Math.sin(now / 170) * mixing * 2;
      liquid.setAttribute('y', y); liquid.setAttribute('height', 190 - y);
      liquid.setAttribute('opacity', 40 / volume);
      surface.setAttribute('d', 'M304 ' + y + 'Q330 ' + (y + wave) + ' 355 ' + y + 'T406 ' + y);
      surface.setAttribute('opacity', Math.min(.8, 60 / volume));
      const curl = Math.sin(now / 300) * 12;
      swirl.setAttribute('d', 'M335 ' + y + 'Q' + (345 + curl) + ' ' + (y + 20) + ' 365 ' + (y + 25) + 'T325 ' + (y + 42));
      swirl.setAttribute('opacity', reduced.matches ? 0 : mixing * .3);
      const radians = tilt * Math.PI / 180;
      const lip=rotate([[62,-60]],radians)[0];
      // Lift and bring the lip over the opening before any water is released.
      const progress=Math.min(1,tilt/Math.max(1,tippingPoint-5));
      const ease=progress*progress*(3-2*progress);
      const jugX=205+(350-lip[0]-205)*ease;
      const jugY=120+(76-lip[1]-120)*ease;
      jug.setAttribute('transform', 'translate('+jugX+' '+jugY+') rotate(' + tilt + ')');
      if (jugShadow) {
        jugShadow.setAttribute('cx', jugX);
        jugShadow.setAttribute('rx', 34 + ease * 10);
        jugShadow.setAttribute('ry', 4 + ease * 1.5);
        jugShadow.setAttribute('opacity', .12 - ease * .05);
      }
      const x=jugX+lip[0], spoutY=jugY+lip[1];
      stream.setAttribute('d', 'M' + x + ' ' + spoutY + 'L'+x+' '+y);
      stream.setAttribute('opacity', pouring ? '.55' : '0');
      splash.setAttribute('transform', 'translate('+x+' ' + (y + wave) + ')');
      splash.setAttribute('opacity', pouring && !reduced.matches ? '.4' : '0');
      // Clip a horizontal surface against the tilted vessel, then transform
      // back into jug coordinates. Water drains instead of fading away.
      const rotated=rotate(interior,radians);
      let low=Math.min(...rotated.map(p=>p[1])),high=Math.max(...rotated.map(p=>p[1]));
      for(let i=0;i<24;i++) {
        const mid=(low+high)/2;
        if(area(below(rotated,mid))>capacity*waterFraction()) low=mid;
        else high=mid;
      }
      const water=rotate(below(rotated,(low+high)/2),-radians);
      jugWater.setAttribute('d',water.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ')+'Z');
      root.dataset.volume = volume.toFixed(1);
    }
    function tick(now) {
      frame = 0;
      if (!root.isConnected) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      draw(now, dt);
      if (held || tilt > 0 || mixing > 0) frame = requestAnimationFrame(tick);
    }
    function wake() { if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick); } }
    function begin() {
      if (volume >= 240) return;
      held = true; status.textContent = 'Adding water · diluting the cordial'; wake();
    }
    function stop() {
      held = false; pointer = null; key = null;
      status.textContent = volume >= 240 ? 'Full glass · lighter cordial' : volume > 40 ? 'Diluted cordial · hold to add water' : 'Neat cordial · hold the jug to pour';
      wake();
    }
    jug.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || pointer !== null || key !== null) return;
      event.preventDefault(); pointer = event.pointerId; jug.setPointerCapture(pointer); begin();
    });
    jug.addEventListener('pointerup', event => { if (event.pointerId === pointer) stop(); });
    jug.addEventListener('pointercancel', stop);
    jug.addEventListener('lostpointercapture', () => { if (pointer !== null) stop(); });
    jug.addEventListener('keydown', event => {
      if (![' ', 'Enter'].includes(event.key)) return;
      event.preventDefault(); if (event.repeat || key !== null || pointer !== null) return;
      key = event.key; begin();
    });
    jug.addEventListener('keyup', event => { if (event.key === key) { event.preventDefault(); stop(); } });
    jug.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    root.querySelector('button').addEventListener('click', () => {
      stop(); volume = 40; mixing = 0; tilt = 0;
      status.textContent = 'Neat cordial · hold the jug to pour'; draw(performance.now(), 0);
    });
    draw(0, 0);
  }
  boot(document.getElementById('plugin_dilute'));
})();
