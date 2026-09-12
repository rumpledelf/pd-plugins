(function () {
  function boot(root) {
    if(!root || root.dataset.pluginBooted==='true')return;
    root.dataset.pluginBooted='true';
    const ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
    const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
    const STEP=360/37,NS='http://www.w3.org/2000/svg';
    const svg=root.querySelector('svg'),rotor=root.querySelector('.roulette-rotor'),ball=root.querySelector('.roulette-ball'),button=root.querySelector('button'),result=root.querySelector('.roulette-result');
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const mod=n=>((n%360)+360)%360;
    const point=(angle,r)=>({x:180+Math.sin(angle*Math.PI/180)*r,y:180-Math.cos(angle*Math.PI/180)*r});
    function element(name,attrs){const node=document.createElementNS(NS,name);for(const [k,v]of Object.entries(attrs))node.setAttribute(k,v);return node;}
    for(let i=0;i<37;i++){
      const number=ORDER[i],a=i*STEP-STEP/2,b=i*STEP+STEP/2;
      const p=point(a,150),q=point(b,150),s=point(b,103),t=point(a,103);
      const colour=number===0?'#4CAF50':RED.has(number)?'#C62828':'#333333';
      rotor.appendChild(element('path',{d:'M'+p.x+' '+p.y+'A150 150 0 0 1 '+q.x+' '+q.y+'L'+s.x+' '+s.y+'A103 103 0 0 0 '+t.x+' '+t.y+'Z',fill:colour,stroke:'gainsboro','stroke-width':.8,'data-number':number}));
      const text=element('text',{x:180,y:47,fill:'white','font-size':13,'text-anchor':'middle','dominant-baseline':'middle',transform:'rotate('+(i*STEP)+' 180 180)'});
      text.textContent=number;rotor.appendChild(text);
    }
    rotor.appendChild(element('circle',{cx:180,cy:180,r:102,fill:'gainsboro',stroke:'#333333','stroke-width':2}));
    for(let i=0;i<8;i++){
      const p=point(i*45,25),q=point(i*45,87);
      rotor.appendChild(element('path',{d:'M'+p.x+' '+p.y+'L'+q.x+' '+q.y,stroke:'#999999','stroke-width':2}));
    }
    rotor.appendChild(element('circle',{cx:180,cy:180,r:24,fill:'#333333'}));
    rotor.appendChild(element('circle',{cx:180,cy:180,r:8,fill:'gainsboro'}));
    let wheelAngle=0,ballAngle=0,busy=false;
    function paint(radius){
      rotor.setAttribute('transform','rotate('+wheelAngle+' 180 180)');
      const p=point(ballAngle,radius);ball.setAttribute('cx',p.x);ball.setAttribute('cy',p.y);
      root.dataset.wheelAngle=String(wheelAngle);root.dataset.ballAngle=String(ballAngle);
    }
    function randomNumber(){
      const word=new Uint32Array(1),limit=Math.floor(4294967296/37)*37;
      do{crypto.getRandomValues(word);}while(word[0]>=limit);
      return word[0]%37;
    }
    function spin(){
      if(busy)return;
      busy=true;root.dataset.spinning='true';delete root.dataset.result;
      button.disabled=true;button.classList.add('grey');result.textContent='Spinning…';
      const number=randomNumber(),index=ORDER.indexOf(number);
      const salt=new Uint32Array(1);crypto.getRandomValues(salt);
      const startWheel=wheelAngle,startBall=ballAngle;
      const endWheel=reduced.matches?startWheel:startWheel+1080+salt[0]/4294967296*360;
      const target=mod(endWheel+index*STEP);
      const endBall=reduced.matches?startBall+mod(target-startBall+180)-180:startBall-2160-mod(startBall-target);
      const duration=reduced.matches?700:6400,started=performance.now();
      function frame(now){
        if(!root.isConnected)return;
        const t=Math.min(1,(now-started)/duration),e=1-(1-t)**3;
        wheelAngle=startWheel+(endWheel-startWheel)*e;
        ballAngle=startBall+(endBall-startBall)*e;
        const drop=Math.max(0,Math.min(1,(t-.62)/.33));
        let radius=158+(116-158)*(drop*drop*(3-2*drop));
        if(!reduced.matches&&t>.74&&t<1){
          const settle=(t-.74)/.26;
          radius+=Math.sin(settle*Math.PI*5)*(1-settle)*5;
        }
        paint(radius);
        if(t<1){requestAnimationFrame(frame);return;}
        wheelAngle=mod(endWheel);ballAngle=mod(endBall);paint(116);
        const colour=number===0?'Green':RED.has(number)?'Red':'Black';
        root.dataset.result=String(number);root.dataset.resultColour=colour;root.dataset.spinning='false';
        result.textContent=number+' · '+colour;
        button.disabled=false;button.classList.remove('grey');busy=false;
      }
      requestAnimationFrame(frame);
    }
    button.addEventListener('click',spin);svg.addEventListener('click',spin);
    root.dataset.spinning='false';paint(158);
  }
  boot(document.getElementById('plugin_roulette'));
})();
