(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const slider = root.querySelector('input'), toggle = root.querySelector('.harmony-toggle');
    const waves = [root.querySelector('.harmony-base'),root.querySelector('.harmony-second')];
    const caption = root.querySelector('.harmony-caption');
    if (!slider || !toggle || !waves.every(Boolean) || !caption) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const labels = {0:'Unison',1:'Semitone',2:'Whole tone',3:'Minor third',4:'Major third',5:'Fourth',6:'Tritone',7:'Fifth',8:'Minor sixth',9:'Major sixth',10:'Minor seventh',11:'Major seventh',12:'Octave'};
    const normalCaption = 'Compare the blend. What feels harmonious can vary.';
    let frequency = 220*Math.pow(2,7/12), audio = null, oscillators = [], gains = [];
    let playing = false, token = 0, frame = 0, phase = 0, previous = 0;
    function draw() {
      [220,frequency].forEach((f,index)=>{
        let d='';const cycles=4*f/220, y=index?78:26;
        for(let x=8;x<=572;x+=2){
          const a=(x-8)/564*Math.PI*2*cycles-phase*f/220;
          const value=(Math.sin(a)+.3*Math.sin(2*a)+.15*Math.sin(3*a))/1.25;
          d+=(x===8?'M':'L')+x+' '+(y-value*18).toFixed(2)+' ';
        }
        waves[index].setAttribute('d',d);
      });
    }
    function update() {
      const interval=Number(slider.value), near=Math.round(interval);
      frequency=220*Math.pow(2,interval/12);
      const exact=Math.abs(interval-near)<.001;
      const text=(exact?labels[near]+' · ':'')+Number(interval.toFixed(2))+' semitone'+(interval===1?'':'s');
      root.querySelector('.harmony-interval-value').textContent=text;
      root.querySelector('.harmony-frequency').textContent='Second: '+Math.round(frequency)+' Hz';
      slider.setAttribute('aria-valuetext',text+', '+Math.round(frequency)+' hertz');
      root.querySelector('.harmony-waves').setAttribute('aria-label','Sound waves: fixed 220 hertz and adjustable '+Math.round(frequency)+' hertz. Motion slowed for visibility.');
      root.querySelectorAll('[data-interval]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.interval)===interval)));
      if(audio && oscillators[1])oscillators[1].frequency.setTargetAtTime(frequency,audio.currentTime,.04);
      draw();
    }
    function animate(now) {
      frame=0;
      if(!root.isConnected || document.hidden){stop();return;}
      if(!playing)return;
      if(!reduced.matches)phase+=Math.min(50,now-previous)/1000*2*Math.PI;
      previous=now;draw();frame=requestAnimationFrame(animate);
    }
    function stop() {
      token++;playing=false;cancelAnimationFrame(frame);frame=0;
      toggle.textContent='Play';toggle.setAttribute('aria-pressed','false');
      const old=audio, oldGains=gains, oldOscillators=oscillators;
      audio=null;gains=[];oscillators=[];
      if(old){
        if(old.state==='running'){
          oldGains.forEach(g=>{g.gain.cancelScheduledValues(old.currentTime);g.gain.setTargetAtTime(0,old.currentTime,.012);});
          oldOscillators.forEach(o=>o.stop(old.currentTime+.07));
          setTimeout(()=>old.close().catch(()=>{}),90);
        }else old.close().catch(()=>{});
      }
    }
    async function play() {
      const Audio=window.AudioContext || window.webkitAudioContext;
      if(!Audio){caption.textContent='Audio is unavailable here. The waves still show the intervals.';return;}
      const current=++token;playing=true;toggle.textContent='Stop';toggle.setAttribute('aria-pressed','true');
      try{
        audio=new Audio();const context=audio;await context.resume();
        if(current!==token || !root.isConnected || document.hidden){if(current===token)stop();return;}
        // A gentle harmonic-rich sound makes close-interval roughness audible.
        const real=new Float32Array(4),imag=new Float32Array([0,1,.3,.15]);
        const timbre=context.createPeriodicWave(real,imag);
        [220,frequency].forEach(f=>{
          const oscillator=context.createOscillator(),gain=context.createGain();
          oscillator.setPeriodicWave(timbre);oscillator.frequency.value=f;gain.gain.value=0;
          oscillator.connect(gain);gain.connect(context.destination);oscillator.start();
          gain.gain.setTargetAtTime(.035,context.currentTime,.03);
          oscillators.push(oscillator);gains.push(gain);
        });
        caption.textContent=normalCaption;previous=performance.now();frame=requestAnimationFrame(animate);
      }catch(error){if(current===token){stop();caption.textContent='Could not start audio. Try Play again.';}}
    }
    slider.addEventListener('input',update);
    root.querySelectorAll('[data-interval]').forEach(button=>button.addEventListener('click',()=>{slider.value=button.dataset.interval;update();}));
    toggle.addEventListener('click',()=>playing?stop():play());
    document.addEventListener('visibilitychange',()=>{if(document.hidden && playing)stop();});
    window.addEventListener('pagehide',stop);
    update();
  }
  boot(document.getElementById('plugin_harmony'));
})();
