(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const svg = root.querySelector('.lathe-stage'), stock = root.querySelector('.lathe-stock'), clip = root.querySelector('.lathe-clip');
    const grain = root.querySelector('.lathe-grain'), spindle = root.querySelector('.lathe-spindle'), tool = root.querySelector('.lathe-tool'), shavingLayer = root.querySelector('.lathe-shavings');
    const toggle = root.querySelector('.lathe-toggle'), reset = root.querySelector('.lathe-reset'), message = root.querySelector('.lathe-message');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const LEFT = 125, RIGHT = 503, CY = 108, N = 127, MIN = 10, MAX = 40;
    const radii = Array(N).fill(MAX), particles = [];
    const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
    let running = false, holding = false, pointer = null, x = 314, depth = 54, angle = 0, frame = 0, previous = 0, dustClock = 0;
    function pathAt(factor) {
      return radii.map((r,i) => (i ? 'L' : 'M') + (LEFT + i * (RIGHT-LEFT)/(N-1)).toFixed(1) + ' ' + (CY + r*factor).toFixed(1)).join(' ');
    }
    function render() {
      const top = pathAt(-1);
      const bottom = [...radii].reverse().map((r,i) => 'L' + (RIGHT-i*(RIGHT-LEFT)/(N-1)).toFixed(1)+' '+(CY+r).toFixed(1)).join(' ');
      const d = top + bottom + 'Z';
      stock.setAttribute('d',d); clip.setAttribute('d',d);
      grain.setAttribute('d',pathAt(Math.sin(angle)) + ' ' + pathAt(Math.sin(angle + Math.PI)));
      root.querySelector('.lathe-woodgrain').setAttribute('transform','translate(0 '+(Math.sin(angle)*12)+')');
      spindle.setAttribute('transform','rotate('+angle*180/Math.PI+' 113 108)');
      tool.setAttribute('transform','translate('+x+' '+(CY+depth)+')');
      root.dataset.latheMinimumRadius = Math.min(...radii).toFixed(2);
    }
    function shaving() {
      if (reduced.matches) return;
      const node = document.createElementNS('http://www.w3.org/2000/svg','path');
      node.setAttribute('d','M-3 0Q-6 -5 0 -5Q5 -4 3 0');
      node.setAttribute('fill','none'); node.setAttribute('stroke','#C9A66B'); node.setAttribute('stroke-width','1.6');
      shavingLayer.appendChild(node);
      particles.push({node,x,y:CY+depth,vx:30+Math.random()*65,vy:-(25+Math.random()*40),life:0,spin:Math.random()*360});
    }
    function tick(now) {
      frame = 0;
      if (!root.isConnected) return;
      const dt = Math.min(.04,(now-previous)/1000 || .016); previous = now;
      if (running) angle += dt * (reduced.matches ? .5 : 15);
      let cut = false;
      if (running && holding) {
        for (let i=0;i<N;i++) {
          const distance = Math.abs(LEFT+i*(RIGHT-LEFT)/(N-1)-x);
          if (distance > 9) continue;
          const target = clamp(depth + distance*.55,MIN,MAX);
          if (radii[i] > target) { radii[i] = Math.max(target,radii[i]-dt*25); cut=true; }
        }
      }
      if (cut) {
        dustClock += dt;
        if(dustClock > .045) { shaving(); dustClock=0; }
      }
      for(let i=particles.length-1;i>=0;i--) {
        const p=particles[i]; p.life+=dt; p.x+=p.vx*dt; p.vy+=150*dt; p.y+=p.vy*dt;
        p.node.setAttribute('transform','translate('+p.x+' '+p.y+') rotate('+(p.spin+p.life*320)+')');
        p.node.setAttribute('opacity',Math.max(0,1-p.life/.8));
        if(p.life>.8) {p.node.remove();particles.splice(i,1);}
      }
      render();
      if(running || particles.length) frame=requestAnimationFrame(tick);
    }
    function wake() { if(!frame) {previous=performance.now();frame=requestAnimationFrame(tick);} }
    function move(event) {
      const point = new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());
      x=clamp(point.x,LEFT,RIGHT);
      depth=clamp(Math.abs(point.y-CY),MIN,58);
      render();
    }
    function release() { holding=false;pointer=null; }
    toggle.addEventListener('click',() => {
      running=!running;
      toggle.textContent=running?'Stop':'Start';
      toggle.classList.toggle('green',!running);
      toggle.classList.toggle('magenta',running);
      message.textContent=running?'Drag into the wood. Closer to the centre cuts deeper.':'Stopped. Your shape is saved.';
      if(running) wake();
    });
    reset.addEventListener('click',() => {
      radii.fill(MAX); holding=false; depth=54;
      particles.splice(0).forEach(p=>p.node.remove()); render();
      message.textContent=running?'Fresh blank. Drag the tool to shape it.':'Fresh blank. Start to shape it.';
    });
    svg.addEventListener('pointerdown',event => {
      if(event.button!==0 || pointer!==null) return;
      pointer=event.pointerId;holding=true;svg.setPointerCapture(pointer);move(event);
      if(running) wake();
    });
    svg.addEventListener('pointermove',event => {if(event.pointerId===pointer) move(event);});
    svg.addEventListener('pointerup',release);svg.addEventListener('pointercancel',release);svg.addEventListener('lostpointercapture',release);
    svg.addEventListener('keydown',event => {
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(event.key)) return;
      event.preventDefault();
      if(event.key==='ArrowLeft') x=clamp(x-6,LEFT,RIGHT);
      if(event.key==='ArrowRight') x=clamp(x+6,LEFT,RIGHT);
      if(event.key==='ArrowUp') depth=clamp(depth-3,MIN,58);
      if(event.key==='ArrowDown') depth=clamp(depth+3,MIN,58);
      if(event.key===' ') {holding=true;if(running)wake();}
      render();
    });
    svg.addEventListener('keyup',event => {if(event.key===' '){event.preventDefault();holding=false;}});
    svg.addEventListener('blur',release);
    render();
  }
  boot(document.getElementById('plugin_lathe'));
})();
