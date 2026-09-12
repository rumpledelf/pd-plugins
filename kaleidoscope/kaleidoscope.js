(function () {
  const WEDGE=Math.PI/6,CHAMBER=101;
  function contain(p){
    // Plastic shapes can partly overlap, but their centers cannot pile up.
    const radius=p.size*.42;
    const walls=[[0,1], [Math.sin(WEDGE),-Math.cos(WEDGE)]];
    for(const [nx,ny] of walls){
      const distance=p.x*nx+p.y*ny;
      if(distance<radius){
        p.x+=nx*(radius-distance);p.y+=ny*(radius-distance);
        const velocity=p.vx*nx+p.vy*ny;
        if(velocity<0){p.vx-=1.45*velocity*nx;p.vy-=1.45*velocity*ny;}
      }
    }
    const r=Math.hypot(p.x,p.y),limit=CHAMBER-radius;
    if(r>limit){
      const nx=p.x/r,ny=p.y/r,dot=p.vx*nx+p.vy*ny;
      p.x=nx*limit;p.y=ny*limit;
      if(dot>0){p.vx-=1.45*dot*nx;p.vy-=1.45*dot*ny;}
    }
  }
  function separate(pieces){
    for(let pass=0;pass<16;pass++){
      for(let i=0;i<pieces.length;i++)for(let j=i+1;j<pieces.length;j++){
        const a=pieces[i],b=pieces[j],dx=b.x-a.x,dy=b.y-a.y;
        const distance=Math.hypot(dx,dy),gap=(a.size+b.size)*.42;
        if(distance>=gap)continue;
        const nx=distance>1e-6?dx/distance:1,ny=distance>1e-6?dy/distance:0;
        const overlap=(gap-distance)/2;
        a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;
        const approach=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
        if(approach<0){const impulse=-approach*.65;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;}
      }
      pieces.forEach(contain);
    }
  }
  function advance(pieces,dt,reduced,shaking=false){
    const damp=Math.exp(-(reduced?12:shaking?.8:4.2)*dt);
    for(const p of pieces){p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt;}
    // Shaking lifts the loose, flat pieces so they can slide over one another.
    // Restore separation as they settle back into the chamber.
    if(shaking)pieces.forEach(contain);else separate(pieces);
    let energy=0;
    for(const p of pieces){p.vx*=damp;p.vy*=damp;p.spin*=damp;energy+=Math.abs(p.vx)+Math.abs(p.vy)+Math.abs(p.spin)*8;}
    return energy;
  }
  function boot(root) {
    if(!root||root.dataset.pluginBooted==='true')return;
    root.dataset.pluginBooted='true';
    const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),button=root.querySelector('button');
    if(!ctx)return;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const SIZE=440,CENTRE=220,RADIUS=208,ANGLE=Math.PI/6,TEXTURE=256;
    const colours=['#0585BA','#64317B','#B7287E','#4CAF50','orange'];
    const source=document.createElement('canvas');source.width=source.height=TEXTURE;
    const painter=source.getContext('2d',{willReadFrequently:true});
    const output=ctx.createImageData(SIZE,SIZE),outWords=new Uint32Array(output.data.buffer),lookup=new Int32Array(SIZE*SIZE);
    lookup.fill(-1);
    // Fold every alternate 30-degree sector back into the SAME source wedge.
    // Pixel mapping avoids antialiased clipping gaps at mirror boundaries.
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
      const dx=x+.5-CENTRE,dy=y+.5-CENTRE,r=Math.hypot(dx,dy);
      if(r>RADIUS)continue;
      let a=((Math.atan2(dy,dx)%(ANGLE*2))+ANGLE*2)%(ANGLE*2);
      if(a>ANGLE)a=2*ANGLE-a;
      const sx=Math.min(TEXTURE-1,Math.floor(r*Math.cos(a))),sy=Math.min(TEXTURE-1,Math.floor(r*Math.sin(a)));
      lookup[y*SIZE+x]=sy*TEXTURE+sx;
    }
    let pieces=[],pointer=null,lastPoint=null,frame=0,previous=0,generation=0,shakeUntil=0,nextShake=0;
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    function newPieces(){
      pieces=Array.from({length:13},(_,i)=>{
        const radius=Math.sqrt(.08+Math.random()*.92)*94,angle=Math.random()*ANGLE;
        return {x:Math.cos(angle)*radius,y:Math.sin(angle)*radius,size:8+Math.random()*11,angle:Math.random()*Math.PI*2,vx:0,vy:0,spin:0,sides:[3,4,5,0][i%4],colour:colours[i%colours.length]};
      });
      for(let i=0;i<12;i++)separate(pieces);
      generation++;root.dataset.piecesGeneration=generation;
      if(frame)cancelAnimationFrame(frame);frame=0;root.dataset.moving='false';paint();
    }
    function paint(){
      painter.setTransform(1,0,0,1,0,0);painter.fillStyle='white';painter.fillRect(0,0,TEXTURE,TEXTURE);painter.scale(2,2);
      for(const p of pieces){
        painter.save();painter.translate(p.x,p.y);painter.rotate(p.angle);
        painter.beginPath();
        if(p.sides===0)painter.ellipse(0,0,p.size,p.size*.55,0,0,Math.PI*2);
        else for(let i=0;i<p.sides;i++){
          const a=i*Math.PI*2/p.sides;
          if(i===0)painter.moveTo(Math.cos(a)*p.size,Math.sin(a)*p.size);
          else painter.lineTo(Math.cos(a)*p.size,Math.sin(a)*p.size);
        }
        painter.closePath();painter.fillStyle=p.colour;painter.fill();painter.restore();
      }
      const image=painter.getImageData(0,0,TEXTURE,TEXTURE),pixels=new Uint32Array(image.data.buffer);
      for(let i=0;i<lookup.length;i++)if(lookup[i]>=0)outWords[i]=pixels[lookup[i]];
      ctx.putImageData(output,0,0);
      ctx.strokeStyle='#999999';ctx.lineWidth=1.5;ctx.beginPath();
      for(let i=0;i<12;i++){const a=i*ANGLE;ctx.moveTo(CENTRE,CENTRE);ctx.lineTo(CENTRE+Math.cos(a)*RADIUS,CENTRE+Math.sin(a)*RADIUS);}
      ctx.stroke();
      ctx.lineWidth=3;ctx.beginPath();ctx.arc(CENTRE,CENTRE,RADIUS+3,0,Math.PI*2);ctx.stroke();
    }
    function settle(now){
      frame=0;if(!root.isConnected)return;
      const dt=Math.min(.035,(now-previous)/1000||.016);previous=now;
      if(now<shakeUntil&&now>=nextShake){jostle();nextShake=now+160;}
      if(now>=shakeUntil)canvas.classList.remove('is-shaking');
      const energy=advance(pieces,dt,reduced.matches,now<shakeUntil);
      paint();
      if(energy>.7||now<shakeUntil){frame=requestAnimationFrame(settle);root.dataset.moving='true';}
      else{pieces.forEach(p=>{p.vx=p.vy=p.spin=0;});root.dataset.moving='false';}
    }
    function jostle(){
      const strength=reduced.matches?.25:1;
      for(const p of pieces){
        p.vx=(Math.random()-.5)*840*strength;
        p.vy=(Math.random()-.5)*560*strength;
        p.spin=(Math.random()-.5)*30*strength;
      }
    }
    function shake(){
      const now=performance.now();
      shakeUntil=now+(reduced.matches?0:900);nextShake=now+160;
      canvas.classList.remove('is-shaking');
      if(!reduced.matches){void canvas.offsetWidth;canvas.classList.add('is-shaking');}
      jostle();root.dataset.moving='true';
      if(!frame){previous=now;frame=requestAnimationFrame(settle);}
    }
    function kick(turn,dx=0,dy=0){
      const strength=reduced.matches?.3:1;
      pieces.forEach((p,i)=>{
        p.vx=clamp(p.vx+(-p.y*turn*7+dx*1.5)*strength,-130,130);
        p.vy=clamp(p.vy+(p.x*turn*7+dy*1.5)*strength,-130,130);
        p.spin=clamp(p.spin+turn*(i%2?8:-6)*strength,-7,7);
      });
      if(!frame){previous=performance.now();frame=requestAnimationFrame(settle);}
    }
    function point(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)/r.width*220-110,y:(event.clientY-r.top)/r.height*220-110};}
    canvas.addEventListener('pointerdown',event=>{
      if(event.button!==0||pointer!==null)return;
      pointer=event.pointerId;lastPoint=point(event);canvas.setPointerCapture(pointer);canvas.classList.add('is-held');
    });
    canvas.addEventListener('pointermove',event=>{
      if(event.pointerId!==pointer)return;
      const p=point(event);let turn=Math.atan2(p.y,p.x)-Math.atan2(lastPoint.y,lastPoint.x);
      if(turn>Math.PI)turn-=Math.PI*2;if(turn<-Math.PI)turn+=Math.PI*2;
      kick(clamp(turn,-.35,.35),p.x-lastPoint.x,p.y-lastPoint.y);lastPoint=p;
    });
    function release(event){if(event.pointerId!==pointer)return;pointer=null;lastPoint=null;canvas.classList.remove('is-held');}
    canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
    canvas.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(event.key))return;
      event.preventDefault();kick(event.key==='ArrowLeft'||event.key==='ArrowDown'?-.16:.16);
    });
    button.addEventListener('click',shake);
    newPieces();
  }
  boot(document.getElementById('plugin_kaleidoscope'));
})();
