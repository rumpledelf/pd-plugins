(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const stage = root.querySelector('.dice-stage'), layer = root.querySelector('.dice-cubes');
    const result = root.querySelector('#dice-result');
    if (!stage || !layer || !result) return;
    const ns = 'http://www.w3.org/2000/svg', half = 33;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const pips = {
      1: [[0,0]], 2: [[-1,-1],[1,1]], 3: [[-1,-1],[0,0],[1,1]],
      4: [[-1,-1],[1,-1],[-1,1],[1,1]], 5: [[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],
      6: [[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]
    };
    // Face normals are paired so opposite values always add to seven.
    const faceData = [
      {value:1,n:[0,1,0],u:[1,0,0],v:[0,0,1]},
      {value:6,n:[0,-1,0],u:[1,0,0],v:[0,0,-1]},
      {value:2,n:[0,0,1],u:[1,0,0],v:[0,1,0]},
      {value:5,n:[0,0,-1],u:[-1,0,0],v:[0,1,0]},
      {value:3,n:[1,0,0],u:[0,0,-1],v:[0,1,0]},
      {value:4,n:[-1,0,0],u:[0,0,1],v:[0,1,0]}
    ];
    const poses = {1:[0,0,0],2:[-90,0,0],3:[0,0,90],4:[0,0,-90],5:[90,0,0],6:[180,0,0]};
    let rolling = false, frame = 0;
    function node(tag, attrs, parent) {
      const element = document.createElementNS(ns, tag);
      Object.entries(attrs || {}).forEach(([k,v]) => element.setAttribute(k,v));
      if (parent) parent.append(element); return element;
    }
    const dice = [1,2].map((value, index) => {
      const group = node('g', {'data-die':index + 1}, layer);
      const faces = faceData.map(face => {
        const group = node('g', {'data-face':face.value});
        const panel = node('path', {stroke:'#333333','stroke-width':1.6,'stroke-linejoin':'round'},group);
        const dots = pips[face.value].map(() => node('path',{fill:'black'},group));
        return {...face,group,panel,dots};
      });
      return {group,faces,angles:poses[value].slice(),value,x:135 + index * 130};
    });
    function rotate(p, angles) {
      let [x,y,z] = p;
      const [a,b,c] = angles.map(v=>v*Math.PI/180);
      [y,z] = [y*Math.cos(a)-z*Math.sin(a),y*Math.sin(a)+z*Math.cos(a)];
      [x,y] = [x*Math.cos(c)-y*Math.sin(c),x*Math.sin(c)+y*Math.cos(c)];
      return [x*Math.cos(b)+z*Math.sin(b),y,-x*Math.sin(b)+z*Math.cos(b)];
    }
    function camera(p) {
      // Elevated view makes the horizontal, scoring face the clearest face.
      const yaw = -.38, pitch = .92;
      const x=p[0]*Math.cos(yaw)+p[2]*Math.sin(yaw), z=-p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw);
      return [x,p[1]*Math.cos(pitch)-z*Math.sin(pitch),p[1]*Math.sin(pitch)+z*Math.cos(pitch)];
    }
    function draw(die, lift=0, slide=0) {
      const project = p => {
        const v = camera(rotate(p,die.angles));
        const scale = 450 / (450-v[2]);
        return [die.x+slide+v[0]*scale,118-lift-v[1]*scale];
      };
      function onFace(face,x,y) {return face.n.map((n,i)=>n*half+face.u[i]*x+face.v[i]*y);}
      const visible=[];
      die.faces.forEach(face=>{
        const worldNormal=rotate(face.n,die.angles), normal=camera(worldNormal);
        // The perspective camera is 450 units away, not infinitely distant.
        if(normal[2]<=half/450){face.group.remove();return;}
        const corners=[[-half,-half],[half,-half],[half,half],[-half,half]].map(([x,y])=>project(onFace(face,x,y)));
        face.panel.setAttribute('d','M'+corners.map(p=>p.join(' ')).join('L')+'Z');
        face.panel.setAttribute('fill',worldNormal[1]>.9?'white':normal[0]>0?'gainsboro':'whitesmoke');
        face.dots.forEach((dot,index)=>{
          const [u,v]=pips[face.value][index]; const points=[];
          for(let k=0;k<16;k++){const a=k*Math.PI/8;points.push(project(onFace(face,u*17+4.7*Math.cos(a),v*17+4.7*Math.sin(a))));}
          dot.setAttribute('d','M'+points.map(p=>p.join(' ')).join('L')+'Z');
        });
        visible.push({face,depth:normal[2]});
      });
      visible.sort((a,b)=>a.depth-b.depth).forEach(({face})=>die.group.append(face.group));
      const shadow=root.querySelectorAll('.dice-shadows ellipse')[dice.indexOf(die)];
      shadow.setAttribute('rx',48-lift*.24); shadow.setAttribute('opacity',1-lift*.01);
    }
    function randomInt(limit) {
      // Rejection sampling avoids modulo bias; each die gets a separate draw.
      if (window.crypto && window.crypto.getRandomValues) {
        const values=new Uint32Array(1), ceiling=Math.floor(4294967296/limit)*limit;
        do {window.crypto.getRandomValues(values);} while(values[0]>=ceiling);
        return values[0]%limit;
      }
      return Math.floor(Math.random()*limit);
    }
    function roll() {
      if(rolling)return;
      rolling=true; stage.setAttribute('aria-disabled','true'); result.textContent='Rolling…';
      const start=performance.now();
      const rolls=dice.map((die,index)=>{
        const value=1+randomInt(6), target=poses[value].slice();target[1]=randomInt(4)*90;
        return {die,value,from:die.angles.slice(),target,to:target.map((a,i)=>a+(i===1?1080:720)),duration:reduced.matches?100:1450+index*180};
      });
      function tick(now) {
        frame=0;
        if(!root.isConnected){rolling=false;return;}
        let done=true;
        rolls.forEach(({die,value,from,to,target,duration},index)=>{
          const t=Math.min(1,(now-start)/duration), ease=1-Math.pow(1-t,3);
          die.angles=reduced.matches?target:from.map((a,i)=>a+(to[i]-a)*ease);
          let lift=0;
          if(!reduced.matches)lift=t<.62?Math.sin(t/.62*Math.PI)*40:Math.abs(Math.sin((t-.62)/.38*Math.PI*2))*10*(1-(t-.62)/.38);
          if(t===1){die.angles=target;die.value=value;}else done=false;
          draw(die,lift,reduced.matches?0:Math.sin(Math.PI*t)*(index?14:-14));
        });
        if(done){
          rolling=false;stage.setAttribute('aria-disabled','false');
          dice.forEach(die=>die.group.setAttribute('data-result',die.value));
          result.textContent=`${dice[0].value} + ${dice[1].value} = ${dice[0].value+dice[1].value} · Tap to roll`;
        }else frame=requestAnimationFrame(tick);
      }
      frame=requestAnimationFrame(tick);
    }
    stage.addEventListener('click',roll);
    stage.addEventListener('keydown',event=>{
      if(event.key===' '||event.key==='Enter'){event.preventDefault();if(!event.repeat)roll();}
    });
    dice.forEach(die=>draw(die));
  }
  boot(document.getElementById('plugin_dice'));
})();
