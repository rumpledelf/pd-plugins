(function () {
  function makeState(speed=100){return {cart:70,ball:108,y:91,vx:speed,speed,vy:0,angle:0,impactAge:0,phase:'ready'};}
  function step(s,dt,reduced=false){
    if(s.phase==='ready'||s.phase==='done')return;
    if(s.phase!=='rolling')s.impactAge+=dt;
    if(s.phase==='rolling'){
      const timeToStop=(270-s.cart)/s.speed,travel=Math.min(dt,timeToStop);
      s.cart+=s.speed*travel;s.ball=s.cart+38;
      if(dt<timeToStop)return;
      s.cart=270;s.phase='continuing';dt-=travel;s.impactAge=dt;
    }
    if(s.phase==='continuing'){
      const timeToEdge=Math.max(0,(350-s.ball)/s.vx),travel=Math.min(dt,timeToEdge);
      s.ball+=s.vx*travel;s.angle+=s.vx*travel/12;
      if(dt<timeToEdge)return;
      s.phase='falling';dt-=travel;
    }
    if(s.phase==='falling'){
      s.ball+=s.vx*dt;s.angle+=s.vx*dt/12;s.vy+=420*dt;s.y+=s.vy*dt;
      if(s.y>=129){s.y=129;s.vy=reduced?0:-s.vy*.25;if(Math.abs(s.vy)<20)s.phase='floor';}
    }else if(s.phase==='floor'){
      const next=Math.max(0,s.vx-100*dt),distance=(s.vx+next)*dt/2;
      s.ball+=distance;s.angle+=distance/12;s.vx=next;
      if(!s.vx)s.phase='done';
    }
  }
  function boot(root){
    if(!root||root.dataset.pluginBooted==='true')return;
    const cart=root.querySelector('.inertia-cart'),ball=root.querySelector('.inertia-ball'),push=root.querySelector('.inertia-push'),reset=root.querySelector('.inertia-reset'),status=root.querySelector('.inertia-status');
    if(!cart||!ball||!push||!reset||!status)return;
    root.dataset.pluginBooted='true';
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const speed=root.querySelector('.inertia-speed');
    let state=makeState(),frame=0,last=0;
    function draw(){
      const t=state.impactAge;
      const jolt=reduced.matches?0:Math.pow(state.speed/100,2)*9*Math.exp(-5*t)*Math.sin(18*t);
      cart.setAttribute('transform','translate('+state.cart+' 0) rotate('+jolt+' 80 141)');
      for(const [name,x] of [['a',16],['b',64]])root.querySelector('.inertia-wheel-'+name).setAttribute('transform','translate('+x+' 131) rotate('+((state.cart-70)/10*180/Math.PI)+')');
      ball.setAttribute('transform','translate('+state.ball+' '+state.y+') rotate('+(state.angle*180/Math.PI)+')');
      const shadow=root.querySelector('.inertia-shadow');shadow.setAttribute('cx',state.ball);shadow.setAttribute('rx',12+(129-state.y)*.12);
      root.dataset.phase=state.phase;
    }
    function tick(now){
      frame=0;if(!root.isConnected)return;
      let remaining=Math.min(.05,(now-last)/1000);last=now;const previous=state.phase;
      while(remaining>0){const dt=Math.min(remaining,1/120);step(state,dt,reduced.matches);remaining-=dt;}
      if(previous!==state.phase){
        if(state.phase==='continuing')status.textContent='The trolley stops. The ball keeps moving.';
        if(state.phase==='done'){status.textContent='The ball kept moving until other forces slowed it down.';push.disabled=false;push.classList.remove('grey');}
      }
      draw();if(state.phase!=='done')frame=requestAnimationFrame(tick);
    }
    function restart(){cancelAnimationFrame(frame);frame=0;state=makeState(Number(speed.value));push.disabled=false;push.classList.remove('grey');status.textContent='Push the trolley towards the stop.';draw();}
    push.addEventListener('click',()=>{restart();state.phase='rolling';push.disabled=true;push.classList.add('grey');status.textContent='The trolley and ball move together.';last=performance.now();frame=requestAnimationFrame(tick);});
    reset.addEventListener('click',restart);draw();
  }
  boot(document.getElementById('plugin_inertia'));
})();
