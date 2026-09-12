(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const svg=root.querySelector('svg'), lens=root.querySelector('.magnify-lens'), rim=root.querySelector('.magnify-rim');
    const clip=root.querySelector('.magnify-clip'), mask=root.querySelector('.magnify-mask'), enlarged=root.querySelector('.magnify-enlarged');
    const wave=root.querySelector('.magnify-wave'), mouth=root.querySelector('.magnify-mouth'), hint=root.querySelector('.magnify-hint');
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    let x=370,y=102,pointer=null,offsetX=0,offsetY=0,overlap=false,frame=0,started=0;
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    function animate(now) {
      frame=0;
      if(!root.isConnected || !overlap) return;
      const tilt=reduced.matches?-55:-45+Math.sin((now-started)/115)*24;
      wave.setAttribute('transform','translate(7 -2) rotate('+tilt+')');
      if(!reduced.matches) frame=requestAnimationFrame(animate);
    }
    function render() {
      lens.setAttribute('transform','translate('+x+' '+y+')');
      rim.setAttribute('transform','translate('+x+' '+y+')');
      for(const circle of [clip,mask]) {circle.setAttribute('cx',x);circle.setAttribute('cy',y);}
      enlarged.setAttribute('transform','translate('+x+' '+y+') scale(3) translate('+(-x)+' '+(-y)+')');
      const inside=Math.hypot(x-180,y-101)<35;
      if(inside!==overlap) {
        overlap=inside;
        root.dataset.magnifyOverlap=String(overlap);
        mouth.setAttribute('d',overlap?'M-4 -9Q0 -3 4 -9':'M-3 -8Q0 -7 3 -8');
        hint.textContent='Drag the glass to magnify.';
        if(frame) cancelAnimationFrame(frame);
        frame=0;
        if(overlap) {started=performance.now();frame=requestAnimationFrame(animate);}
        else wave.setAttribute('transform','translate(7 -2)');
      }
    }
    function point(event) {return new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());}
    function release(event) {
      if(pointer!==null && event.pointerId!==undefined && event.pointerId!==pointer) return;
      pointer=null;svg.classList.remove('is-dragging');
    }
    svg.addEventListener('pointerdown',event=>{
      if(event.button!==0 || pointer!==null || !event.target.closest('.magnify-lens, .magnify-rim')) return;
      const p=point(event);pointer=event.pointerId;offsetX=p.x-x;offsetY=p.y-y;
      svg.setPointerCapture(pointer);svg.classList.add('is-dragging');
    });
    svg.addEventListener('pointermove',event=>{
      if(event.pointerId!==pointer) return;
      const p=point(event);x=clamp(p.x-offsetX,62,475);y=clamp(p.y-offsetY,62,135);render();
    });
    svg.addEventListener('pointerup',release);svg.addEventListener('pointercancel',release);svg.addEventListener('lostpointercapture',release);
    svg.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const step=event.shiftKey?20:7;
      if(event.key==='ArrowLeft')x-=step;if(event.key==='ArrowRight')x+=step;
      if(event.key==='ArrowUp')y-=step;if(event.key==='ArrowDown')y+=step;
      x=clamp(x,62,475);y=clamp(y,62,135);render();
    });
    reduced.addEventListener('change',()=>{
      if(frame)cancelAnimationFrame(frame);
      frame=0;
      if(overlap)frame=requestAnimationFrame(animate);
    });
    root.dataset.magnifyOverlap='false';render();
  }
  boot(document.getElementById('plugin_magnify'));
})();
