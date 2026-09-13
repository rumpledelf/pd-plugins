(function () {
  function collide(m1,m2,u1,u2){
    const impulse=1.9*(u1-u2)/(1/m1+1/m2);
    return [u1-impulse/m1,u2+impulse/m2];
  }
  function makeState(m1=1,m2=3){return {x1:85,x2:315,v1:0,v2:0,m1,m2,hit:false,phase:'ready'};}
  function step(s,dt){
    if(s.phase!=='moving')return;
    s.x1+=s.v1*dt;s.x2+=s.v2*dt;
    if(s.x2-s.x1<=112&&s.v1>s.v2){
      const overlap=112-(s.x2-s.x1);s.x1-=overlap*s.m2/(s.m1+s.m2);s.x2+=overlap*s.m1/(s.m1+s.m2);
      [s.v1,s.v2]=collide(s.m1,s.m2,s.v1,s.v2);s.hit=true;
    }
    if(s.hit){
      for(const n of [1,2]){
        s['v'+n]=Math.sign(s['v'+n])*Math.max(0,Math.abs(s['v'+n])-22*dt)||0;
        // End stops are external forces, separate from the trolley collision.
        const left=n===1?54:74,right=n===1?506:526;
        if(s['x'+n]<left){s['x'+n]=left;if(s['v'+n]<0)s['v'+n]*=-.65;}
        if(s['x'+n]>right){s['x'+n]=right;if(s['v'+n]>0)s['v'+n]*=-.65;}
      }
      if(!s.v1&&!s.v2)s.phase='done';
    }
  }
  function boot(root){
    if(!root||root.dataset.pluginBooted==='true')return;
    const a=root.querySelector('.momentum-mass-a'),b=root.querySelector('.momentum-mass-b'),push=root.querySelector('.momentum-push'),reset=root.querySelector('.momentum-reset'),speed=root.querySelector('.momentum-speed'),status=root.querySelector('.momentum-status');
    if(!a||!b||!push||!reset||!speed||!status)return;
    root.dataset.pluginBooted='true';
    let state=makeState(),frame=0,last=0;
    function draw(){
      for(const [letter,n] of [['a',1],['b',2]]){
        root.querySelector('.momentum-cart-'+letter).setAttribute('transform','translate('+state['x'+n]+' 0)');
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
