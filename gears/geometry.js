(function(factory){
  if(typeof module==='object' && module.exports)module.exports=factory();
  else {const root=document.getElementById('plugin_gears');if(root)root.gearsGeometry=factory();}
})(function(){
  const moduleSize=3.6,pressureAngle=20*Math.PI/180;
  function profile(teeth){
    const pitch=teeth*moduleSize/2,base=pitch*Math.cos(pressureAngle),outer=pitch+moduleSize,root=pitch-1.25*moduleSize;
    const involute=r=>{const t=Math.sqrt(Math.max(0,r*r/(base*base)-1));return t-Math.atan(t);};
    // Involute flanks have half a circular pitch of thickness at the pitch circle,
    // less a small clearance. Identical module and pressure angle permit meshing.
    const halfTooth=Math.PI/(2*teeth)-.1*moduleSize/pitch;
    const flank=r=>halfTooth+involute(pitch)-involute(Math.max(base,r));
    const points=[];
    const point=(r,a)=>points.push([r*Math.cos(a),r*Math.sin(a)]);
    for(let tooth=0;tooth<teeth;tooth++){
      const a=tooth*2*Math.PI/teeth,start=Math.max(root,base);
      point(root,a-Math.PI/teeth);point(root,a-flank(start));
      for(let j=0;j<=8;j++){const r=start+(outer-start)*j/8;point(r,a-flank(r));}
      for(let j=1;j<=4;j++)point(outer,a-flank(outer)+2*flank(outer)*j/4);
      for(let j=7;j>=0;j--){const r=start+(outer-start)*j/8;point(r,a+flank(r));}
      point(root,a+flank(start));point(root,a+Math.PI/teeth);
    }
    return {teeth,pitch,base,outer,root,points,path:'M'+points.map(p=>p.map(v=>v.toFixed(3)).join(' ')).join('L')+'Z'};
  }
  function drivenAngle(inputAngle,inputTeeth,outputTeeth){return Math.PI+Math.PI/outputTeeth-inputAngle*inputTeeth/outputTeeth;}
  return {moduleSize,pressureAngle,profile,drivenAngle};
});
