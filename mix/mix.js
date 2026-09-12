(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),reset=root.querySelector('button'),message=root.querySelector('.mix-message');
    if(!ctx)return;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const W=112,H=64,COUNT=W*H;
    const field=document.createElement('canvas');field.width=W;field.height=H;
    const fx=field.getContext('2d'),pixels=fx.createImageData(W,H);
    const palette=[[5,133,186],[183,40,126],[76,175,80]];
    let a=new Float32Array(COUNT*3),b=new Float32Array(COUNT*3),held=false,pointer=null,speed=0,time=0,last=0,frame=0,focus=false,stirred=0;
    const targetMean=[0,0,0];
    const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
    function initialise() {
      targetMean.fill(0);
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){
        const p=palette[Math.min(2,Math.floor(y/H*3))],i=(y*W+x)*3;
        a[i]=p[0];a[i+1]=p[1];a[i+2]=p[2];
        for(let c=0;c<3;c++)targetMean[c]+=p[c]/COUNT;
      }
      held=false;pointer=null;speed=0;time=0;stirred=0;
      canvas.classList.remove('is-held');
      if(frame)cancelAnimationFrame(frame);frame=0;
      message.textContent='Hold the stick to mix.';
      root.dataset.mixing='false';root.dataset.mixAmount='0';
      paint();
    }
    function step(dt) {
      const strength=speed*(reduced.matches?.25:1);
      const phase=time*.95;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){
        const u=x/(W-1),v=y/(H-1),su=Math.sin(Math.PI*u),sv=Math.sin(Math.PI*v);
        const cu=Math.cos(Math.PI*u),cv=Math.cos(Math.PI*v);
        const wave=.55*Math.sin(Math.PI*u+phase)+.8*Math.cos(phase*.71);
        const vx=su*cv*wave*1.5;
        const vy=-(cu*wave+su*.55*Math.cos(Math.PI*u+phase))*sv*1.5;
        const px=clamp(x-vx*dt*W*strength,0,W-1),py=clamp(y-vy*dt*H*strength,0,H-1);
        const x0=Math.floor(px),y0=Math.floor(py),x1=Math.min(W-1,x0+1),y1=Math.min(H-1,y0+1),tx=px-x0,ty=py-y0;
        const i=(y*W+x)*3,l=(y*W+Math.max(0,x-1))*3,r=(y*W+Math.min(W-1,x+1))*3,t=(Math.max(0,y-1)*W+x)*3,d=(Math.min(H-1,y+1)*W+x)*3;
        for(let c=0;c<3;c++){
          const upper=a[(y0*W+x0)*3+c]*(1-tx)+a[(y0*W+x1)*3+c]*tx;
          const lower=a[(y1*W+x0)*3+c]*(1-tx)+a[(y1*W+x1)*3+c]*tx;
          const advected=upper*(1-ty)+lower*ty;
          const diffusion=(a[l+c]+a[r+c]+a[t+c]+a[d+c])*.25;
          const smooth=reduced.matches?.3:.10;
          b[i+c]=advected*(1-smooth)+diffusion*smooth;
        }
      }
      // Preserve each colour's total contribution despite interpolation losses.
      const mean=[0,0,0];
      for(let i=0;i<COUNT;i++)for(let c=0;c<3;c++)mean[c]+=b[i*3+c]/COUNT;
      for(let i=0;i<COUNT;i++)for(let c=0;c<3;c++)b[i*3+c]=clamp(b[i*3+c]+targetMean[c]-mean[c],0,255);
      [a,b]=[b,a];
    }
    function paint() {
      let mean=[0,0,0];
      for(let i=0;i<COUNT;i++){
        const p=i*4,k=i*3;
        for(let c=0;c<3;c++){pixels.data[p+c]=a[k+c];mean[c]+=a[k+c]/COUNT;}
        pixels.data[p+3]=255;
      }
      let variance=0;
      for(let i=0;i<COUNT;i+=8)for(let c=0;c<3;c++)variance+=(a[i*3+c]-mean[c])**2/(COUNT/8*3);
      root.dataset.mixVariance=variance.toFixed(1);
      root.dataset.mixAmount=Math.min(1,stirred/15).toFixed(3);
      if(stirred>1 && variance<110) message.textContent='All mixed together!';
      fx.putImageData(pixels,0,0);
      ctx.clearRect(0,0,520,210);
      ctx.save();
      ctx.beginPath();ctx.moveTo(147,66);ctx.lineTo(373,66);ctx.lineTo(353,186);ctx.lineTo(167,186);ctx.closePath();ctx.clip();
      ctx.imageSmoothingEnabled=true;ctx.drawImage(field,145,65,230,123);
      ctx.restore();
      ctx.strokeStyle='#000000';ctx.lineWidth=3;ctx.lineJoin='round';
      ctx.beginPath();ctx.moveTo(140,39);ctx.lineTo(164,190);ctx.lineTo(356,190);ctx.lineTo(380,39);ctx.stroke();
      const swing=reduced.matches?3:54;
      const tipX=260+Math.sin(time*4)*swing;
      const handleX=294-Math.sin(time*4)*swing*.62;
      ctx.beginPath();ctx.moveTo(handleX-3,20);ctx.lineTo(tipX-3,164);ctx.quadraticCurveTo(tipX,173,tipX+3,164);ctx.lineTo(handleX+3,20);ctx.closePath();
      ctx.fillStyle='#999999';ctx.fill();ctx.strokeStyle='#333333';ctx.lineWidth=focus?3:1.2;ctx.stroke();
    }
    function tick(now) {
      frame=0;if(!root.isConnected)return;
      const dt=Math.min(.035,(now-last)/1000||.016);last=now;
      speed=held?Math.min(1,speed+dt*5):Math.max(0,speed-dt*2.2);
      time+=dt*speed;stirred+=dt*speed;
      if(speed>0)step(dt);
      paint();
      if(held||speed>0)frame=requestAnimationFrame(tick);
      else root.dataset.mixing='false';
    }
    function start() {
      if(held)return;held=true;canvas.classList.add('is-held');root.dataset.mixing='true';
      message.textContent='Watch the colours swirl together.';
      if(!frame){last=performance.now();frame=requestAnimationFrame(tick);}
    }
    function stop(event) {
      if(event&&event.pointerId!==undefined&&pointer!==null&&event.pointerId!==pointer)return;
      held=false;pointer=null;canvas.classList.remove('is-held');
    }
    canvas.addEventListener('pointerdown',event=>{
      if(event.button!==0||pointer!==null)return;
      pointer=event.pointerId;canvas.setPointerCapture(pointer);start();
    });
    canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);canvas.addEventListener('lostpointercapture',stop);
    canvas.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();start();}});
    canvas.addEventListener('keyup',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();stop();}});
    canvas.addEventListener('focus',()=>{focus=canvas.matches(':focus-visible');paint();});
    canvas.addEventListener('blur',()=>{focus=false;stop();paint();});
    reset.addEventListener('click',initialise);
    initialise();
  }
  boot(document.getElementById('plugin_mix'));
})();
