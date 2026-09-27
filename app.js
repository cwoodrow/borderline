import {zoomAt,toWorld} from './viewport.js';
import {decodeTopology,SELECTED,project,BOUNDS,scoreDrawing,borderProgress} from './geometry.js';
const $=id=>document.getElementById(id),canvas=$('map'),ctx=canvas.getContext('2d');
let map,strokes=[],active=null,revealed=false,transform,width,height,toastTimer;
let fitTransform,panMode=false,gesture=null;
const pointers=new Map();
function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6000);}
function resize(){
  const center=transform?toWorld(transform,[width/2,height/2]):null;
  const zoom=fitTransform?transform.scale/fitTransform.scale:1;
  const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;
  const dpr=window.devicePixelRatio||1;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  const a=project([BOUNDS[0],BOUNDS[3]]),b=project([BOUNDS[2],BOUNDS[1]]);
  const scale=Math.min((width-30)/(b[0]-a[0]),(height-100)/(b[1]-a[1]));
  fitTransform={scale,x:(width-(b[0]-a[0])*scale)/2-a[0]*scale,y:(height-(b[1]-a[1])*scale)/2-a[1]*scale-10};
  transform=center&&zoom>1?{scale:scale*zoom,x:width/2-center[0]*scale*zoom,y:height/2-center[1]*scale*zoom}:{...fitTransform};
  updateView();render();
}
function updateView(){
  if(!transform)return;
  const zoom=transform.scale/fitTransform.scale;
  $('zoom-level').textContent=`${Math.round(zoom*100)}%`;
  $('zoom-in').disabled=zoom>=8-1e-6;
  $('zoom-out').disabled=zoom<=1+1e-6;
  $('pan').setAttribute('aria-pressed',String(panMode));
  canvas.style.cursor=gesture?.type==='pan'?'grabbing':panMode||revealed?'grab':'crosshair';
  $('mode-label').textContent=revealed?'BORDERS REVEALED':panMode?'PAN MODE':'FREEHAND MODE';
}
function changeZoom(factor,point=[width/2,height/2]){
  if(!transform||active)return;
  transform=zoomAt(transform,factor,point,fitTransform.scale,fitTransform.scale*8);
  if(transform.scale===fitTransform.scale)transform={...fitTransform};
  updateView();render();
}
$('zoom-in').onclick=()=>changeZoom(1.4);
$('zoom-out').onclick=()=>changeZoom(1/1.4);
$('reset-view').onclick=()=>{if(active)return;transform={...fitTransform};updateView();render();};
$('pan').onclick=()=>{panMode=!panMode;updateView();};
function screen(p){return [p[0]*transform.scale+transform.x,p[1]*transform.scale+transform.y];}
function path(line){line.forEach((p,i)=>{const [x,y]=screen(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});}
function drawLines(lines,color,lineWidth,dash=[]){ctx.beginPath();for(const line of lines)path(line);ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.lineJoin='round';ctx.lineCap='round';ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
// Hand-placed anchors keep country codes on the mainland.
const countryLabels = [
  {name:'PT',at:[-8.1,39.6]},
  {name:'ES',at:[-3.2,40.1]},
  {name:'FR',at:[2.2,46.6]},
  {name:'BE',at:[4.6,50.8]},
  {name:'NL',at:[5.4,52.8]},
  {name:'LU',at:[6.1,49.8]},
  {name:'DE',at:[10.3,51.1]},
  {name:'CH',at:[8.1,46.7]},
  {name:'AT',at:[13.4,47.5]},
  {name:'IT',at:[12.5,43.1]},
  {name:'DK',at:[9.4,56.3]},
  {name:'UK',at:[-2.7,54.1]},
  {name:'IE',at:[-8,53.4]},
];
function drawCountryLabels(){
  const fontSize=Math.max(9,Math.min(12,width/70));
  ctx.save();
  ctx.font=`500 ${fontSize}px "DM Sans", sans-serif`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(const label of countryLabels){
    const [x,y]=screen(project(label.at));
    const lines=label.name.split('\n');
    lines.forEach((line,i)=>{
      const lineY=y+(i-(lines.length-1)/2)*(fontSize+3);
      ctx.strokeStyle='#e4ebd6';ctx.lineWidth=3;ctx.lineJoin='round';
      ctx.strokeText(line,x,lineY);
      ctx.fillStyle='#617153';ctx.fillText(line,x,lineY);
    });
  }
  ctx.restore();
}
function render(){if(!transform)return;ctx.clearRect(0,0,width,height);ctx.fillStyle='#eaf0ed';ctx.fillRect(0,0,width,height);
  const grid=[];for(let lon=-20;lon<=30;lon+=5)grid.push([project([lon,25]),project([lon,70])]);for(let lat=30;lat<=65;lat+=5)grid.push([project([-25,lat]),project([35,lat])]);drawLines(grid,'#dae4df',.65);
  if(!map)return;
  for(const selected of [false,true]){ctx.beginPath();for(const country of map.countries.filter(c=>SELECTED.has(c.id)===selected))for(const polygon of country.polygons)for(const ring of polygon){path(ring);ctx.closePath();}ctx.fillStyle=selected?'#dce5c8':'#e2e6dc';ctx.fill('evenodd');}
  drawLines(map.coasts,'#b4c3a8',.8);
  ctx.save();ctx.font='9px "DM Sans", sans-serif';ctx.fillStyle='#98ada7';ctx.textAlign='center';
  for(const [name,at] of [['NORTH ATLANTIC OCEAN',[-10,46]],['NORTH SEA',[3,56]],['MEDITERRANEAN SEA',[7,37.5]]]){const [x,y]=screen(project(at));ctx.fillText(name,x,y);}
  ctx.restore();
  drawCountryLabels();
  drawLines(strokes,'#d5834c',2.8);if(active)drawLines([active],'#d5834c',2.8);
  if(revealed)drawLines(map.borders.map(b=>b.points),'#427c65',1.8,[5,4]);
}
function update(){
  const disabled=!strokes.length||revealed;
  $('undo').disabled=disabled;$('clear').disabled=disabled;$('check').disabled=disabled;
  if(map){
    const {remaining}=borderProgress(strokes,map.borders);
    $('border-count').textContent=remaining;
    $('border-count-label').textContent=revealed
      ? (remaining===1?'border not recognised':'borders not recognised')
      : (remaining===1?'land border left':'land borders left');
  }
}
function localPoint(event){const rect=canvas.getBoundingClientRect();return [event.clientX-rect.left,event.clientY-rect.top];}
function pinchState(){const [a,b]=[...pointers.values()];return {center:[(a[0]+b[0])/2,(a[1]+b[1])/2],distance:Math.max(1,Math.hypot(a[0]-b[0],a[1]-b[1]))};}
canvas.addEventListener('pointerdown',event=>{
  if(!map||![0,1].includes(event.button))return;
  event.preventDefault();canvas.setPointerCapture(event.pointerId);
  const point=localPoint(event);pointers.set(event.pointerId,point);
  if(pointers.size>=2){active=null;gesture={type:'pinch',...pinchState()};render();return;}
  if(panMode||revealed||event.button===1)gesture={type:'pan',last:point};
  else {active=[toWorld(transform,point)];gesture={type:'draw'};}
  updateView();
});
canvas.addEventListener('pointermove',event=>{
  if(!pointers.has(event.pointerId))return;
  const point=localPoint(event);pointers.set(event.pointerId,point);
  if(pointers.size>=2){
    const next=pinchState();
    transform=zoomAt(transform,next.distance/gesture.distance,gesture.center,fitTransform.scale,fitTransform.scale*8);
    transform.x+=next.center[0]-gesture.center[0];transform.y+=next.center[1]-gesture.center[1];
    gesture={type:'pinch',...next};updateView();render();
  }else if(gesture?.type==='pan'){
    transform.x+=point[0]-gesture.last[0];transform.y+=point[1]-gesture.last[1];gesture.last=point;render();
  }else if(active){const p=toWorld(transform,point),last=active.at(-1);if(Math.hypot(p[0]-last[0],p[1]-last[1])*transform.scale>=1.5){active.push(p);render();}}
});
function finish(event){
  if(!pointers.has(event.pointerId))return;
  if(active&&event.type!=='pointercancel'&&active.length>1)strokes.push(active);
  active=null;pointers.delete(event.pointerId);
  gesture=pointers.size>=2?{type:'pinch',...pinchState()}:pointers.size?{type:'pan',last:[...pointers.values()][0]}:null;
  update();updateView();render();
}
canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);canvas.addEventListener('lostpointercapture',finish);
canvas.addEventListener('wheel',event=>{
  event.preventDefault();if(pointers.size)return;
  const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?height:1);
  changeZoom(Math.exp(-Math.max(-200,Math.min(200,delta))*.003),localPoint(event));
},{passive:false});
function undo(){if(!revealed){strokes.pop();update();render();}}
$('undo').onclick=undo;$('clear').onclick=()=>{strokes=[];update();render();};
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();undo();}});
$('help').onclick=()=>notify('Drag to draw borders. Scroll or use +/− to zoom. Switch to Pan to move the map, or drag with the middle mouse button. On touchscreens, pinch with two fingers to zoom and move. Fit restores the full map.');
$('check').onclick=()=>{if(!strokes.length||revealed)return;revealed=true;const result=scoreDrawing(strokes,map.borders.map(b=>b.points));$('score').innerHTML=`${result.score}<span>/100</span>`;for(const metric of ['coverage','accuracy']){$(metric).textContent=`${Math.round(result[metric]*100)}%`;$(metric+'-bar').style.width=`${result[metric]*100}%`;}$('verdict').textContent=result.score>=85?'A cartographer at heart.':result.score>=60?'You know your way around.':result.score>=30?'A promising sense of direction.':'A new perspective on Europe.';$('result-note').textContent='The dashed green lines reveal the real borders. Missing borders reduce coverage; stray lines reduce accuracy.';$('play-info').hidden=true;$('results').hidden=false;$('check').hidden=true;$('retry').hidden=false;$('truth-legend').hidden=false;$('mode-label').textContent='BORDERS REVEALED';$('action-hint').textContent='Every attempt makes the map a little more familiar.';update();updateView();render();};
$('retry').onclick=()=>{strokes=[];active=null;revealed=false;$('results').hidden=true;$('play-info').hidden=false;$('check').hidden=false;$('retry').hidden=true;$('truth-legend').hidden=true;$('mode-label').textContent='FREEHAND MODE';$('action-hint').textContent='No timer. Just your mental map.';panMode=false;transform={...fitTransform};update();updateView();render();};
new ResizeObserver(resize).observe(canvas);
document.fonts.ready.then(render);
try{const response=await fetch('./data/countries-50m.json');if(!response.ok)throw new Error(`HTTP ${response.status}`);map=decodeTopology(await response.json());update();$('loading').hidden=true;resize();}catch(error){$('loading').textContent='The map could not load. Refresh to try again.';console.error(error);}
