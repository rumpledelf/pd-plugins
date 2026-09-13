(function () {
  function boot(root) {
    if(!root||root.dataset.pluginBooted==='true')return;
    root.dataset.pluginBooted='true';
    const NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
    const rootSelect=root.querySelector('.chords-root'),quality=root.querySelector('.chords-quality'),playButton=root.querySelector('.chords-play'),keyboard=root.querySelector('.chords-keyboard'),status=root.querySelector('.chords-status');
    const keys=new Map(),voices=new Set();
    let audio=null,master=null,generation=0,observer=null;
    NAMES.forEach((name,i)=>{const option=document.createElement('option');option.value=60+i;option.textContent=name;rootSelect.appendChild(option);});
    let white=0;
    for(let midi=60;midi<84;midi++){
      const pitch=midi%12,black=[1,3,6,8,10].includes(pitch),key=document.createElement('button');
      key.type='button';key.className='chords-key'+(black?' is-black':'');key.dataset.midi=midi;
      key.textContent=NAMES[pitch];key.setAttribute('aria-label',NAMES[pitch]+(Math.floor(midi/12)-1));
      const width=black?4.35:100/14;
      key.style.width=width+'%';key.style.left=(black?white*100/14-width/2:white++*100/14)+'%';
      key.addEventListener('click',()=>play([midi]));keyboard.appendChild(key);keys.set(midi,key);
    }
    function notes(){const n=Number(rootSelect.value);return [n,n+(quality.value==='minor'?3:4),n+7];}
    function update(){
      const selected=notes();keys.forEach((key,midi)=>key.classList.toggle('in-chord',selected.includes(midi)));
      root.dataset.chordNotes=selected.join(',');
      status.textContent=NAMES[Number(rootSelect.value)%12]+' '+quality.value+' · '+selected.map(n=>NAMES[n%12]).join(' ');
    }
    function stopVoices(){
      for(const voice of voices){
        try{
          if(audio&&audio.state==='running'){
            const now=audio.currentTime;
            if(voice.gain.gain.cancelAndHoldAtTime)voice.gain.gain.cancelAndHoldAtTime(now);
            else{voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setValueAtTime(voice.gain.gain.value,now);}
            voice.gain.gain.linearRampToValueAtTime(0,now+.015);voice.osc.stop(now+.02);
          }else{voice.osc.stop();voice.osc.disconnect();voice.gain.disconnect();}
        }catch(error){voice.osc.disconnect();voice.gain.disconnect();}
      }
      voices.clear();keys.forEach(key=>key.classList.remove('is-playing'));
    }
    function closeAudio(){
      generation++;stopVoices();
      const previous=audio;audio=null;master=null;
      if(previous&&previous.state!=='closed')setTimeout(()=>previous.close().catch(()=>{}),30);
      root.dataset.audioState='closed';
    }
    function observeRemoval(){
      if(observer)return;
      observer=new MutationObserver(()=>{
        if(!root.isConnected){closeAudio();observer.disconnect();document.removeEventListener('visibilitychange',visibility);}
      });
      observer.observe(document.body,{childList:true,subtree:true});
    }
    async function play(selected){
      const token=++generation;stopVoices();
      try{
        if(!audio||audio.state==='closed'){
          const Context=window.AudioContext||window.webkitAudioContext;
          if(!Context)throw Error('Audio unavailable');
          audio=new Context();master=audio.createGain();master.gain.value=1;master.connect(audio.destination);observeRemoval();
        }
        const current=audio;await current.resume();
        if(token!==generation||!root.isConnected||document.hidden)return;
        const start=current.currentTime+.015;
        const peak=.18/Math.sqrt(selected.length);
        selected.forEach(midi=>{
          const osc=current.createOscillator(),gain=current.createGain(),voice={osc,gain};
          osc.type='triangle';osc.frequency.setValueAtTime(440*Math.pow(2,(midi-69)/12),start);
          gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(peak,start+.02);gain.gain.exponentialRampToValueAtTime(.0001,start+.7);
          osc.connect(gain);gain.connect(master);voices.add(voice);
          keys.get(midi)?.classList.add('is-playing');
          osc.onended=()=>{voices.delete(voice);osc.disconnect();gain.disconnect();if(!voices.size)keys.forEach(key=>key.classList.remove('is-playing'));};
          osc.start(start);osc.stop(start+.72);
        });
        root.dataset.audioState=current.state;
        root.dataset.lastPlayed=selected.join(',');
      }catch(error){status.textContent='Audio is unavailable in this browser.';closeAudio();}
    }
    function visibility(){if(document.hidden)closeAudio();}
    document.addEventListener('visibilitychange',visibility);
    rootSelect.addEventListener('change',()=>{closeAudio();update();});
    quality.addEventListener('change',()=>{closeAudio();update();});
    playButton.addEventListener('click',()=>play(notes()));
    update();
  }
  boot(document.getElementById('plugin_chords'));
})();
