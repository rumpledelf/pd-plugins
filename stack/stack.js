(function () {
  function boot(root) {
    if(!root || root.dataset.pluginBooted==='true')return;
    root.dataset.pluginBooted='true';
    const svg=root.querySelector('svg'),layer=root.querySelector('.stack-blocks'),message=root.querySelector('.stack-message'),reset=root.querySelector('button');
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const NS='http://www.w3.org/2000/svg',FLOOR=193;
    const homes=[52,131,210,289,368],colours=['#0585BA','#64317B','#B7287E','#4CAF50','orange'];
    const shapes=[
      {name:'rectangle',width:60,height:28,top:60,path:'M-30-14H30V14H-30Z'},
      {name:'square',width:38,height:38,top:38,path:'M-19-19H19V19H-19Z'},
      {name:'thin rectangle',width:64,height:16,top:64,path:'M-32-8H32V8H-32Z'},
      {name:'hexagon',width:58,height:36,top:34,path:'M-17-18H17L29 0L17 18H-17L-29 0Z'},
      {name:'trapezium',width:56,height:34,top:30,path:'M-15-17H15L28 17H-28Z'}
    ];
    const blocks=colours.map((colour,id)=>{
      const node=document.createElementNS(NS,'g');node.setAttribute('class','stack-block');node.dataset.block=id;
      const shape=shapes[id];
      node.setAttribute('aria-label',shape.name);
      node.innerHTML='<rect x="'+(-shape.width/2-6)+'" y="'+(-shape.height/2)+'" width="'+(shape.width+12)+'" height="'+shape.height+'" fill="transparent"/><path class="stack-body" d="'+shape.path+'" fill="'+colour+'" stroke="#333333" stroke-width="2"/>';
      layer.appendChild(node);
      return {id,node,...shape,x:homes[id],y:FLOOR-shape.height/2,home:homes[id],motion:null};
    });
    let piles=homes.map((x,id)=>({x,ids:[id]})),snapshot=null,active=null,selected=0,pointer=null,offsetX=0,offsetY=0,frame=0,last=0;
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    function draw(){
      for(const b of blocks){
        b.node.setAttribute('transform','translate('+b.x+' '+b.y+')');
        b.node.classList.toggle('is-selected',b.id===selected);
        b.node.classList.toggle('is-held',b.id===active);
      }
      const tallest=piles.reduce((best,pile)=>pile.ids.length>best.length?pile.ids:best,[]);
      root.dataset.stackCount=tallest.length;
      root.dataset.stackOrder=tallest.join(',');
    }
    function tick(now){
      frame=0;if(!root.isConnected)return;
      const dt=Math.min(40,now-last);last=now;let moving=false;
      for(const b of blocks){
        if(!b.motion)continue;
        const m=b.motion;m.elapsed+=dt;
        const t=Math.min(1,m.elapsed/m.duration),e=1-(1-t)**3;
        b.x=m.x+(m.tx-m.x)*e;
        b.y=m.y+(m.ty-m.y)*e-(reduced.matches?0:Math.sin(Math.PI*t)*m.arc);
        if(t===1){b.x=m.tx;b.y=m.ty;b.motion=null;}else moving=true;
      }
      draw();if(moving)frame=requestAnimationFrame(tick);
    }
    function animate(b,x,y,arc=0){
      b.motion={x:b.x,y:b.y,tx:x,ty:y,arc,elapsed:0,duration:reduced.matches?80:360};
      if(!frame){last=performance.now();frame=requestAnimationFrame(tick);}
    }
    function arrange(){
      piles.forEach(pile=>{
        let top=FLOOR;
        const half=Math.max(...pile.ids.map(id=>blocks[id].width))/2;
        pile.x=clamp(pile.x,half+2,418-half);
        pile.ids.forEach(id=>{const b=blocks[id];animate(b,pile.x,top-b.height/2,0);top-=b.height;});
      });
    }
    function pick(id){
      if(active!==null)return;
      snapshot=piles.map(pile=>({x:pile.x,ids:[...pile.ids]}));
      selected=id;active=id;blocks[id].motion=null;
      piles.forEach(pile=>{pile.ids=pile.ids.filter(other=>other!==id);});
      piles=piles.filter(pile=>pile.ids.length);arrange();
      layer.appendChild(blocks[id].node);
      draw();
    }
    function drop(){
      if(active===null)return;
      const b=blocks[active];
      const target=piles.filter(pile=>Math.abs(b.x-pile.x)<(b.width+blocks[pile.ids[pile.ids.length-1]].top)*.4)
        .sort((a,c)=>Math.abs(a.x-b.x)-Math.abs(c.x-b.x))[0];
      if(target){
        target.ids.push(active);
        message.textContent=target.ids.length===blocks.length?'All five stacked!':'Put a block on top of another.';
      }else{
        const left=b.width/2+2,right=418-b.width/2;
        const gap=pile=>(b.width+Math.max(...pile.ids.map(id=>blocks[id].width)))/2+2;
        const candidates=[clamp(b.x,left,right),left,right,...piles.flatMap(pile=>[pile.x-gap(pile),pile.x+gap(pile)])];
        const available=candidates.filter(x=>x>=left&&x<=right&&piles.every(pile=>Math.abs(x-pile.x)>=gap(pile)-.001));
        const x=available.sort((a,c)=>Math.abs(a-b.x)-Math.abs(c-b.x))[0];
        if(x===undefined){
          piles.sort((a,c)=>Math.abs(a.x-b.x)-Math.abs(c.x-b.x))[0].ids.push(active);
        }else piles.push({x,ids:[active]});
        message.textContent='Put a block on top of another.';
      }
      active=null;snapshot=null;arrange();draw();
    }
    function cancel(){
      if(active===null)return;
      piles=snapshot;active=null;snapshot=null;arrange();draw();
    }
    function point(e){return new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());}
    svg.addEventListener('pointerdown',event=>{
      if(event.button!==0||pointer!==null)return;
      const target=event.target.closest('[data-block]');if(!target)return;
      svg.focus({preventScroll:true});
      if(active!==null)drop();
      const id=Number(target.dataset.block),p=point(event);
      pick(id);pointer=event.pointerId;offsetX=p.x-blocks[id].x;offsetY=p.y-blocks[id].y;
      svg.setPointerCapture(pointer);
    });
    svg.addEventListener('pointermove',event=>{
      if(event.pointerId!==pointer||active===null)return;
      const p=point(event),b=blocks[active];
      b.x=clamp(p.x-offsetX,b.width/2+2,418-b.width/2);b.y=clamp(p.y-offsetY,b.height/2+2,FLOOR-b.height/2);draw();
    });
    function release(event){
      if(pointer===null||event.pointerId!==pointer)return;
      pointer=null;drop();
    }
    svg.addEventListener('pointerup',release);
    function cancelPointer(event){if(event.pointerId!==pointer)return;pointer=null;cancel();}
    svg.addEventListener('pointercancel',cancelPointer);svg.addEventListener('lostpointercapture',cancelPointer);
    svg.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(event.key))return;
      event.preventDefault();
      if(event.key==='Enter'){
        if(event.repeat)return;
        drop();selected=(selected+1)%blocks.length;draw();return;
      }
      if(event.key===' '){if(!event.repeat){if(active===null)pick(selected);else drop();}return;}
      if(active===null)pick(selected);
      const b=blocks[active],step=event.shiftKey?20:8;
      if(event.key==='ArrowLeft')b.x-=step;if(event.key==='ArrowRight')b.x+=step;
      if(event.key==='ArrowUp')b.y-=step;if(event.key==='ArrowDown')b.y+=step;
      b.x=clamp(b.x,b.width/2+2,418-b.width/2);b.y=clamp(b.y,b.height/2+2,FLOOR-b.height/2);draw();
    });
    svg.addEventListener('blur',()=>{if(pointer===null)drop();});
    reset.addEventListener('click',()=>{
      if(pointer!==null&&svg.hasPointerCapture(pointer))svg.releasePointerCapture(pointer);
      pointer=null;active=null;piles=homes.map((x,id)=>({x,ids:[id]}));snapshot=null;selected=0;
      blocks.forEach((b,i)=>{b.motion=null;b.x=homes[i];b.home=homes[i];b.y=FLOOR-b.height/2;});
      if(frame)cancelAnimationFrame(frame);frame=0;
      message.textContent='Put a block on top of another.';draw();
    });
    draw();
  }
  boot(document.getElementById('plugin_stack'));
})();
