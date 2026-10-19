(function () {
  function collide(m1,m2,u1,u2){
    const impulse=1.9*(u1-u2)/(1/m1+1/m2);
    return [u1-impulse/m1,u2+impulse/m2];
  }
  function makeState(m1=1,m2=3){return {x1:85,x2:315,v1:0,v2:0,m1,m2,hit:false,impactAge:0,jolt1:0,jolt2:0,wallAge1:-1,wallAge2:-1,phase:'ready'};}
  function step(s,dt){
    if(s.phase!=='moving')return;
    s.x1+=s.v1*dt;s.x2+=s.v2*dt;
    if(s.hit)s.impactAge+=dt;
    if(s.wallAge1>=0)s.wallAge1+=dt;
    if(s.wallAge2>=0)s.wallAge2+=dt;
    if(s.x2-s.x1<=112&&s.v1>s.v2){
      const overlap=112-(s.x2-s.x1);s.x1-=overlap*s.m2/(s.m1+s.m2);s.x2+=overlap*s.m1/(s.m1+s.m2);
      const u1=s.v1,u2=s.v2;
      [s.v1,s.v2]=collide(s.m1,s.m2,u1,u2);s.hit=true;s.impactAge=0;
      s.jolt1=Math.min(7,Math.abs(s.v1-u1)/18);
      s.jolt2=Math.min(7,Math.abs(s.v2-u2)/18);
    }
    if(s.hit){
      for(const n of [1,2]){
        s['v'+n]=Math.sign(s['v'+n])*Math.max(0,Math.abs(s['v'+n])-22*dt)||0;
        // End stops are external forces, separate from the trolley collision.
        const left=n===1?54:74,right=n===1?506:526;
        if(s['x'+n]<left){s['x'+n]=left;if(s['v'+n]<0){s['v'+n]*=-.65;s['wallAge'+n]=0;}}
        if(s['x'+n]>right){s['x'+n]=right;if(s['v'+n]>0){s['v'+n]*=-.65;s['wallAge'+n]=0;}}
      }
      if(!s.v1&&!s.v2)s.phase='done';
    }
  }
  function boot(root){
    if(!root||root.dataset.pluginBooted==='true')return;
    const a=root.querySelector('.momentum-mass-a'),b=root.querySelector('.momentum-mass-b'),push=root.querySelector('.momentum-push'),reset=root.querySelector('.momentum-reset'),speed=root.querySelector('.momentum-speed'),status=root.querySelector('.momentum-status');
    if(!a||!b||!push||!reset||!speed||!status)return;
    root.dataset.pluginBooted='true';
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const springA=root.querySelector('.momentum-cart-a path:nth-child(2)'),springB=root.querySelector('.momentum-cart-b path:nth-child(2)');
    let state=makeState(),frame=0,last=0;
    function draw(){
      const hitT=state.hit?state.impactAge:-1;
      const pinch=(!reduced.matches&&hitT>=0&&hitT<.28)?Math.sin(hitT/.28*Math.PI)*(1-hitT/.28)*.42:0;
      if(springA)springA.setAttribute('transform',pinch?`translate(36 0) scale(${(1-pinch).toFixed(3)} 1) translate(-36 0)`:'');
      if(springB)springB.setAttribute('transform',pinch?`translate(-36 0) scale(${(1-pinch).toFixed(3)} 1) translate(36 0)`:'');
      for(const [letter,n] of [['a',1],['b',2]]){
        let tilt=0;
        if(!reduced.matches){
          if(hitT>=0)tilt+=(n===1?-1:1)*(state['jolt'+n]||0)*Math.exp(-5.5*hitT)*Math.sin(20*hitT);
          const wt=state['wallAge'+n];
          if(wt>=0)tilt+=(state['x'+n]<200?1:-1)*4*Math.exp(-6*wt)*Math.sin(20*wt);
        }
        root.querySelector('.momentum-cart-'+letter).setAttribute('transform','translate('+state['x'+n]+' 0)'+(Math.abs(tilt)>.04?' rotate('+tilt.toFixed(2)+' 0 103)':''));
        root.querySelector('.momentum-extra-'+letter).setAttribute('visibility',state['m'+n]===3?'visible':'hidden');
        for(const [wheel,x] of [[1,-23],[2,23]])root.querySelector('.momentum-wheel-'+letter+wheel).setAttribute('transform','translate('+x+' 103) rotate('+((state['x'+n]-(n===1?85:315))/9*180/Math.PI)+')');
      }
      root.dataset.phase=state.phase;
    }
    function lock(disabled){a.disabled=b.disabled=speed.disabled=push.disabled=disabled;push.classList.toggle('grey',disabled);}
    function tick(now){
      frame=0;if(!root.isConnected)return;
      let remaining=Math.min(.05,(now-last)/1000);last=now;const wasHit=state.hit;
      while(remaining>0){const dt=Math.min(remaining,1/120);step(state,dt);remaining-=dt;}
      if(!wasHit&&state.hit)status.textContent=state.m1<state.m2?'The lighter blue trolley bounces back.':state.m1>state.m2?'The heavier blue trolley keeps moving forwards.':'Almost all the motion passes to the purple trolley.';
      if(state.phase==='done'){status.textContent='At rest. Try a different mass or a stronger push.';lock(false);}
      draw();if(state.phase==='moving')frame=requestAnimationFrame(tick);
    }
    function schedule(){if(!frame){last=performance.now();frame=requestAnimationFrame(tick);}}
    function restart(){cancelAnimationFrame(frame);frame=0;state=makeState(Number(a.value),Number(b.value));lock(false);status.textContent='Choose a speed, then push the trolley.';draw();}
    push.addEventListener('click',()=>{if(state.phase==='moving')return;restart();state.phase='moving';state.v1=Number(speed.value);lock(true);status.textContent='The blue trolley carries momentum into the collision.';schedule();});
    reset.addEventListener('click',restart);a.addEventListener('change',restart);b.addEventListener('change',restart);restart();
  }
  boot(document.getElementById('plugin_momentum'));
})();
