(function (factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else {
    const root = document.getElementById('plugin_billiards');
    if (root) root.billiardsPhysics = factory();
  }
})(function () {
  'use strict';
  const TABLE = { left:40, right:760, top:40, bottom:400, radius:15, pocketRadius:22 };
  const POCKETS = [{x:40,y:40},{x:400,y:34},{x:760,y:40},{x:40,y:400},{x:400,y:406},{x:760,y:400}];
  const FRICTION = 22, RESTITUTION = .96, CUSHION = .82;
  function ball(id,x,y) { return {id,x,y,vx:0,vy:0,pocketed:false,pocket:null,pocketTime:0}; }
  function createWorld() {
    const balls=[ball(0,380,220)];
    let id=1;
    const spacing=TABLE.radius*2+.65;
    for(let row=0;row<3;row++)for(let column=0;column<=row;column++)balls.push(ball(id++,535+row*spacing*Math.sqrt(3)/2,220+(column-row/2)*spacing));
    return {balls,time:0,events:[],shots:0};
  }
  function settled(world) { return world.balls.every(b=>b.pocketed || Math.hypot(b.vx,b.vy)<.01); }
  function shoot(world,angle,power) {
    const cue=world.balls.find(b=>b.id===0);
    if(!cue || cue.pocketed || !settled(world) || !Number.isFinite(angle) || !Number.isFinite(power))return false;
    const speed=45+Math.max(0,Math.min(1,power))*265;
    cue.vx=Math.cos(angle)*speed;cue.vy=Math.sin(angle)*speed;world.shots++;
    return true;
  }
  function capture(world,b,pocketIndex) {
    b.pocketed=true;b.pocket=pocketIndex;b.pocketTime=world.time;b.vx=b.vy=0;
    world.events.push({type:'pocket',id:b.id,pocket:pocketIndex,time:world.time});
  }
  function cushions(world,b) {
    for(let i=0;i<POCKETS.length;i++)if(Math.hypot(b.x-POCKETS[i].x,b.y-POCKETS[i].y)<TABLE.pocketRadius){capture(world,b,i);return;}
    const r=TABLE.radius;
    const middleOpening=Math.abs(b.x-400)<24;
    const cornerOpening=b.x<TABLE.left+TABLE.pocketRadius+r || b.x>TABLE.right-TABLE.pocketRadius-r;
    if(b.y<TABLE.top+r && !middleOpening && !cornerOpening){b.y=TABLE.top+r;if(b.vy<0)b.vy=-b.vy*CUSHION;}
    if(b.y>TABLE.bottom-r && !middleOpening && !cornerOpening){b.y=TABLE.bottom-r;if(b.vy>0)b.vy=-b.vy*CUSHION;}
    const sideCorner=b.y<TABLE.top+TABLE.pocketRadius+r || b.y>TABLE.bottom-TABLE.pocketRadius-r;
    if(b.x<TABLE.left+r && !sideCorner){b.x=TABLE.left+r;if(b.vx<0)b.vx=-b.vx*CUSHION;}
    if(b.x>TABLE.right-r && !sideCorner){b.x=TABLE.right-r;if(b.vx>0)b.vx=-b.vx*CUSHION;}
    // The pocket mouths are genuinely open, rather than cushion walls hidden by art.
    if(b.x<TABLE.left-12 || b.x>TABLE.right+12 || b.y<TABLE.top-18 || b.y>TABLE.bottom+18){
      let nearest=0;
      for(let i=1;i<POCKETS.length;i++)if(Math.hypot(b.x-POCKETS[i].x,b.y-POCKETS[i].y)<Math.hypot(b.x-POCKETS[nearest].x,b.y-POCKETS[nearest].y))nearest=i;
      capture(world,b,nearest);
    }
  }
  function collide(a,b) {
    let dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy);
    const diameter=TABLE.radius*2;
    if(distance>=diameter)return;
    if(distance<.000001){dx=1;dy=0;distance=1;}
    const nx=dx/distance,ny=dy/distance;
    const overlap=diameter-distance;
    a.x-=nx*overlap*.5;a.y-=ny*overlap*.5;b.x+=nx*overlap*.5;b.y+=ny*overlap*.5;
    const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
    if(relative>=0)return;
    const impulse=-(1+RESTITUTION)*relative*.5;
    a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;
  }
  function step(world,dt) {
    if(!Number.isFinite(dt) || dt<=0)return;
    // Cap only pathological caller pauses; callers normally supply <= 0.05 seconds.
    dt=Math.min(dt,.25);
    const maximum=Math.max(0,...world.balls.map(b=>Math.hypot(b.vx,b.vy)));
    const substeps=Math.max(1,Math.ceil(dt*maximum/(TABLE.radius*.4)),Math.ceil(dt/(1/120)));
    const h=dt/substeps;
    for(let sub=0;sub<substeps;sub++){
      world.time+=h;
      const active=world.balls.filter(b=>!b.pocketed);
      active.forEach(b=>{
        b.x+=b.vx*h;b.y+=b.vy*h;
        const speed=Math.hypot(b.vx,b.vy),next=Math.max(0,speed-FRICTION*h);
        if(speed>0){b.vx*=next/speed;b.vy*=next/speed;}
        cushions(world,b);
      });
      // A second separation pass keeps a tight rack from accumulating overlap.
      for(let pass=0;pass<2;pass++)for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++)if(!active[i].pocketed&&!active[j].pocketed)collide(active[i],active[j]);
      active.forEach(b=>{if(!b.pocketed)cushions(world,b);});
    }
  }
  function respawnCue(world) {
    const cue=world.balls.find(b=>b.id===0);
    if(!cue || !cue.pocketed || !settled(world))return false;
    const free=(x,y)=>world.balls.every(b=>b.id===0 || b.pocketed || Math.hypot(b.x-x,b.y-y)>TABLE.radius*2+2);
    const candidates=[[380,220]];
    for(let y=76;y<=364;y+=24)for(let x=76;x<=724;x+=24)candidates.push([x,y]);
    const point=candidates.find(([x,y])=>free(x,y));
    if(!point)return false;
    Object.assign(cue,{x:point[0],y:point[1],vx:0,vy:0,pocketed:false,pocket:null,pocketTime:0});
    return true;
  }
  return {TABLE,POCKETS,FRICTION,RESTITUTION,CUSHION,createWorld,step,shoot,settled,respawnCue};
});
