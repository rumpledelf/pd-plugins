(function () {
  function boot(root) {
    if(!root || root.dataset.pluginBooted==='true')return;
    const physics=root.billiardsPhysics;
    const table=root.querySelector('.billiards-table');
    if(!physics || !table)return;
    root.dataset.pluginBooted='true';
    const q=name=>root.querySelector('.billiards-'+name);
    const status=root.querySelector('#billiards-status');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const colors=['white','#0585BA','#64317B','#B7287E','#999999','#0585BA','#64317B'];
    let world=physics.createWorld(),angle=0,phase='ready',gesture=null,key=null;
    let frame=0,last=0,chargeStarted=0,settleStarted=null,eventIndex=0,count=-1;
    const ns='http://www.w3.org/2000/svg';
    const nodes=world.balls.map(ball=>{
      const group=document.createElementNS(ns,'g');
      group.dataset.ball=ball.id;
      const body=document.createElementNS(ns,'circle');
      body.setAttribute('r',physics.TABLE.radius);body.setAttribute('fill',colors[ball.id]);body.setAttribute('stroke','#333333');body.setAttribute('stroke-width','1.3');group.append(body);
      if(ball.id){
        const patch=document.createElementNS(ns,'circle');patch.setAttribute('r','9');patch.setAttribute('fill','white');group.append(patch);
        const number=document.createElementNS(ns,'text');number.textContent=ball.id;number.setAttribute('text-anchor','middle');number.setAttribute('y','5');number.setAttribute('font-size','15');number.setAttribute('fill','black');group.append(number);
      }
      q('balls').append(group);return group;
    });
    function charge(now){return Math.min(1,Math.max(0,(now-chargeStarted)/1600));}
    function guideDistance(cue,dx,dy){
      let distance=190;
      const diameter=physics.TABLE.radius*2,r=physics.TABLE.radius,t=physics.TABLE;
      world.balls.forEach(ball=>{
        if(ball.id===0 || ball.pocketed)return;
        const x=ball.x-cue.x,y=ball.y-cue.y,along=x*dx+y*dy,across=x*dy-y*dx;
        if(along>0 && Math.abs(across)<diameter){const hit=along-Math.sqrt(diameter*diameter-across*across);if(hit>0)distance=Math.min(distance,hit);}
      });
      if(dx>0)distance=Math.min(distance,(t.right-r-cue.x)/dx);else if(dx<0)distance=Math.min(distance,(t.left+r-cue.x)/dx);
      if(dy>0)distance=Math.min(distance,(t.bottom-r-cue.y)/dy);else if(dy<0)distance=Math.min(distance,(t.top+r-cue.y)/dy);
      return Math.max(r+4,distance);
    }
    function draw(now){
      world.balls.forEach((ball,index)=>{
        let x=ball.x,y=ball.y,scale=1,opacity=1;
        if(ball.pocketed){
          const t=Math.min(1,(world.time-ball.pocketTime)/.7),ease=1-Math.pow(1-t,3),p=physics.POCKETS[ball.pocket];
          x+=(p.x-x)*ease;y+=(p.y-y)*ease;
          scale=reduced.matches?(t<1?1:0):1-.92*ease;
          opacity=t<.65?1:Math.max(0,(1-t)/.35);
        }
        nodes[index].setAttribute('transform',`translate(${x} ${y}) scale(${scale})`);nodes[index].setAttribute('opacity',opacity);
        nodes[index].dataset.pocketed=String(ball.pocketed);
      });
      const pocketed=world.balls.filter(ball=>ball.id && ball.pocketed && world.time-ball.pocketTime>=.7).length;
      if(pocketed!==count){count=pocketed;q('score').textContent=`Pocketed: ${count} / 6`;}
      const cue=world.balls[0],dx=Math.cos(angle),dy=Math.sin(angle);
      const aiming=phase==='ready' && !cue.pocketed && count<6;
      q('aim').setAttribute('visibility',aiming?'visible':'hidden');
      if(aiming){
        const distance=guideDistance(cue,dx,dy),power=(gesture?.mode==='charging' || key!==null)?charge(now):0;
        const back=physics.TABLE.radius+9+power*22;
        const start=physics.TABLE.radius+4;
        q('guide').setAttribute('d',`M${cue.x+dx*start} ${cue.y+dy*start}L${cue.x+dx*distance} ${cue.y+dy*distance}`);
        q('aim-handle').setAttribute('cx',cue.x+dx*distance);q('aim-handle').setAttribute('cy',cue.y+dy*distance);
        q('cue').setAttribute('d',`M${cue.x-dx*(back+105)} ${cue.y-dy*(back+105)}L${cue.x-dx*back} ${cue.y-dy*back}`);
        q('cue-tip').setAttribute('d',`M${cue.x-dx*(back+5)} ${cue.y-dy*(back+5)}L${cue.x-dx*back} ${cue.y-dy*back}`);
      }
      const charging=phase==='ready' && (gesture?.mode==='charging' || key!==null);
      q('power').setAttribute('visibility',charging?'visible':'hidden');
      q('power-fill').setAttribute('d',`M270 431H${270+260*charge(now)}`);
      table.dataset.phase=phase;table.dataset.shots=world.shots;table.dataset.angle=angle;
    }
    function tick(now){
      frame=0;if(!root.isConnected)return;
      const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
      if(phase==='rolling'){
        physics.step(world,dt);
        while(eventIndex<world.events.length){const event=world.events[eventIndex++];status.textContent=event.id===0?'Cue ball pocketed. It returns after the balls stop.':'In! Let the balls settle…';}
        if(physics.settled(world)){
          if(settleStarted===null)settleStarted=now;
          const dropsDone=world.balls.every(ball=>!ball.pocketed || world.time-ball.pocketTime>.85);
          if(now-settleStarted>650 && dropsDone){
            const respawned=physics.respawnCue(world);phase='ready';
            const allIn=world.balls.slice(1).every(ball=>ball.pocketed);
            status.textContent=allIn?'All six pocketed. Nicely done!':respawned?'Cue ball back. Drag to aim your next shot.':'Drag to aim. Hold still, then release to shoot.';
          }
        }else settleStarted=null;
      }
      draw(now);
      if(phase==='rolling' || gesture?.mode==='charging' || key!==null)frame=requestAnimationFrame(tick);
    }
    function wake(){if(!frame){last=0;frame=requestAnimationFrame(tick);}}
    function shoot(now){
      if(phase!=='ready')return;
      if(physics.shoot(world,angle,charge(now))){phase='rolling';settleStarted=null;status.textContent='Rolling…';wake();}
    }
    function point(event){const p=table.createSVGPoint();p.x=event.clientX;p.y=event.clientY;return p.matrixTransform(q('world').getScreenCTM().inverse());}
    function aim(event){const p=point(event),cue=world.balls[0];if(Math.hypot(p.x-cue.x,p.y-cue.y)>12)angle=Math.atan2(p.y-cue.y,p.x-cue.x);draw(performance.now());}
    function cancel(){gesture=null;key=null;status.textContent='Drag to aim. Hold still, then release to shoot.';draw(performance.now());}
    table.addEventListener('pointerdown',event=>{
      if(phase!=='ready' || count===6 || gesture || key!==null || !event.isPrimary || event.button!==0)return;
      event.preventDefault();table.focus({preventScroll:true});table.setPointerCapture(event.pointerId);
      chargeStarted=performance.now();gesture={pointer:event.pointerId,mode:'charging',x:event.clientX,y:event.clientY};
      status.textContent='Hold for power. Release to shoot, or drag to aim.';wake();
    });
    table.addEventListener('pointermove',event=>{
      if(!gesture || event.pointerId!==gesture.pointer)return;
      if(gesture.mode==='charging' && Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>6){gesture.mode='aiming';status.textContent='Aiming only. Lift, then hold again to shoot.';}
      if(gesture.mode==='aiming')aim(event);
    });
    table.addEventListener('pointerup',event=>{
      if(!gesture || event.pointerId!==gesture.pointer)return;
      const mode=gesture.mode;gesture=null;
      if(mode==='charging')shoot(performance.now());else{status.textContent='Aim set. Hold still, then release to shoot.';draw(performance.now());}
    });
    table.addEventListener('pointercancel',()=>{if(gesture)cancel();});
    table.addEventListener('lostpointercapture',()=>{if(gesture)cancel();});
    table.addEventListener('keydown',event=>{
      if(event.key==='Escape'){if(phase==='ready')cancel();return;}
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(event.key))return;
      event.preventDefault();if(phase!=='ready' || count===6 || gesture)return;
      if(event.key.startsWith('Arrow')){if(key!==null)return;angle+=(event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:1)*(event.shiftKey?5:1)*Math.PI/180;draw(performance.now());return;}
      if(!event.repeat && key===null){key=event.key;chargeStarted=performance.now();status.textContent='Hold for power. Release to shoot.';wake();}
    });
    table.addEventListener('keyup',event=>{if(event.key===key){event.preventDefault();key=null;shoot(performance.now());}});
    table.addEventListener('blur',()=>{if(gesture || key!==null)cancel();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden && (gesture || key!==null))cancel();});
    q('reset').addEventListener('click',()=>{
      cancelAnimationFrame(frame);frame=0;gesture=null;key=null;world=physics.createWorld();angle=0;phase='ready';settleStarted=null;eventIndex=0;count=-1;
      status.textContent='Drag to aim. Hold still, then release to shoot.';draw(performance.now());
    });
    draw(performance.now());
  }
  boot(document.getElementById('plugin_billiards'));
})();
