(function(){
  function boot(root){
    if(!root || root.dataset.pluginBooted==='true' || !root.gearsGeometry)return;
    root.dataset.pluginBooted='true';
    const geometry=root.gearsGeometry,svg=root.querySelector('.gears-stage'),pair=root.querySelector('.gears-pair');
    const play=root.querySelector('.gears-play'),leftSize=root.querySelector('.gears-size-left'),size=root.querySelector('.gears-size'),ratio=root.querySelector('.gears-ratio');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const ns='http://www.w3.org/2000/svg';
    let input=0,inputTeeth=18,outputTeeth=36,centerY=82,direction=1,running=false,frame=0,last=0,drag=null;
    let gears=[];
    function element(tag,attributes,parent){const node=document.createElementNS(ns,tag);Object.entries(attributes).forEach(([key,value])=>node.setAttribute(key,value));if(parent)parent.append(node);return node;}
    function make(teeth,index,x){
      const profile=geometry.profile(teeth),color=index?'#64317B':'#B7287E';
      const group=element('g',{class:'gears-gear',tabindex:0,role:'slider','aria-label':(index?'Right':'Left')+' gear. Drag to turn, or use left and right arrow keys.','aria-valuemin':0,'aria-valuemax':360,'data-teeth':teeth},pair);
      const turning=element('g',{},group),hole=profile.pitch*.51;
      element('path',{d:profile.path+`M${hole} 0A${hole} ${hole} 0 1 0 ${-hole} 0A${hole} ${hole} 0 1 0 ${hole} 0Z`,fill:color,'fill-rule':'evenodd',stroke:'#333333','stroke-width':.65},turning);
      for(let i=0;i<3;i++){const a=i*Math.PI*2/3; element('path',{d:`M0 0L${Math.cos(a)*hole} ${Math.sin(a)*hole}`,stroke:color,'stroke-width':7},turning);}
      element('circle',{cx:profile.pitch*.76,cy:0,r:3.3,fill:'white',stroke:'#333333','stroke-width':.7},turning);
      element('circle',{class:'gears-hub',r:Math.min(8,profile.pitch*.24)},group);
      const gear={group,turning,x,teeth};
      group.setAttribute('transform',`translate(${x} ${centerY})`);
      group.addEventListener('pointerdown',event=>{
        if(!event.isPrimary || event.button!==0 || drag)return;
        event.preventDefault();group.focus({preventScroll:true});group.setPointerCapture(event.pointerId);running=false;sync();
        drag={pointer:event.pointerId,index,previous:angleAt(event,gear)};
      });
      group.addEventListener('pointermove',event=>{
        if(!drag || drag.pointer!==event.pointerId)return;
        const next=angleAt(event,gear);let delta=next-drag.previous;
        if(delta>Math.PI)delta-=Math.PI*2;if(delta<-Math.PI)delta+=Math.PI*2;
        drag.previous=next;turn(index,delta);
      });
      const finish=event=>{if(drag && drag.pointer===event.pointerId)drag=null;};
      group.addEventListener('pointerup',finish);group.addEventListener('pointercancel',finish);group.addEventListener('lostpointercapture',finish);
      group.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight',' ','Enter'].includes(event.key))return;
        event.preventDefault();
        if(event.key===' ' || event.key==='Enter'){if(!event.repeat){running=!running;sync();}return;}
        running=false;sync();turn(index,(event.key==='ArrowLeft'?-1:1)*Math.PI/36);
      });
      return gear;
    }
    function angleAt(event,gear){const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;const p=point.matrixTransform(svg.getScreenCTM().inverse());return Math.atan2(p.y-centerY,p.x-gear.x);}
    function turn(index,delta){input+=index?-delta*outputTeeth/inputTeeth:delta;if(Math.abs(delta)>.0001)direction=(index?-delta:delta)>0?1:-1;draw();caption();}
    function rebuild(){
      drag=null;pair.replaceChildren();
      const a=geometry.profile(inputTeeth),b=geometry.profile(outputTeeth),distance=a.pitch+b.pitch;
      const width=Math.max(400,a.outer+distance+b.outer+32),height=Math.max(180,Math.max(a.outer,b.outer)*2+40);
      centerY=Math.max(82,Math.max(a.outer,b.outer)+8);
      svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
      const start=(width-(a.outer+distance+b.outer))/2;
      gears=[make(inputTeeth,0,start+a.outer),make(outputTeeth,1,start+a.outer+distance)];
      const leftLabel=root.querySelector('.gears-left-label');leftLabel.setAttribute('x',gears[0].x);leftLabel.textContent=inputTeeth+' teeth';
      const label=root.querySelector('.gears-right-label');label.setAttribute('x',gears[1].x);label.textContent=outputTeeth+' teeth';
      leftLabel.setAttribute('y',height-9);label.setAttribute('y',height-9);
      draw();caption();
    }
    function draw(){
      const angles=[input,geometry.drivenAngle(input,inputTeeth,outputTeeth)];
      gears.forEach((gear,index)=>{
        const degrees=angles[index]*180/Math.PI;
        gear.turning.setAttribute('transform',`rotate(${degrees})`);gear.group.dataset.angle=angles[index];
        gear.group.setAttribute('aria-valuenow',Math.round((degrees%360+360)%360));
      });
    }
    function caption(){const gcd=(a,b)=>b?gcd(b,a%b):a,g=gcd(inputTeeth,outputTeeth),a=outputTeeth/g,b=inputTeeth/g;ratio.textContent=`Left: ${a} turn${a===1?'':'s'} ${direction>0?'↻':'↺'} · Right: ${b} turn${b===1?'':'s'} ${direction>0?'↺':'↻'}`;}
    function tick(now){frame=0;if(!root.isConnected || !running || document.hidden)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;input+=dt*direction*(reduced.matches?.25:.7)*18/inputTeeth;draw();frame=requestAnimationFrame(tick);}
    function sync(){play.textContent=running?'Stop':'Play';play.setAttribute('aria-pressed',String(running));if(!running){cancelAnimationFrame(frame);frame=0;}else if(!frame && !document.hidden){last=0;frame=requestAnimationFrame(tick);}}
    play.addEventListener('click',()=>{running=!running;sync();});
    root.querySelector('.gears-reverse').addEventListener('click',()=>{direction*=-1;caption();});
    size.addEventListener('change',()=>{outputTeeth=Number(size.value);rebuild();});
    leftSize.addEventListener('change',()=>{inputTeeth=Number(leftSize.value);rebuild();});
    document.addEventListener('visibilitychange',sync);
    rebuild();
  }
  boot(document.getElementById('plugin_gears'));
})();
