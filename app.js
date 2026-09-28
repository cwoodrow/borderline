import {createScores} from './scores.js';
import {createLocale} from './i18n.js';
import {zoomAt,toWorld} from './viewport.js';
import {decodeTopology,scoreDrawing,borderProgress} from './geometry.js';
import {MAPS,projection} from './maps.js';
const $=id=>document.getElementById(id),canvas=$('map'),ctx=canvas.getContext('2d');
let map,strokes=[],active=null,revealed=false,transform,width,height,toastTimer;
let fitTransform,panMode=false,gesture=null;
const pointers=new Map();
let config=MAPS[new URLSearchParams(location.search).get('map')]||MAPS.europe;
let project=projection(config.latitude);
const mapCache=new Map(),rounds=new Map();
let loadVersion=0;
let scoreStorage;try{scoreStorage=window.localStorage;}catch{}
const highScores=createScores(scoreStorage);
const menuItems=new Map();
for(const item of [...Object.values(MAPS).filter(m=>!m.fantasy),...Object.values(MAPS).filter(m=>m.fantasy)]){
  const button=document.createElement('button');button.type='button';button.className='map-menu-item';button.dataset.map=item.id;
  const name=document.createElement('span');name.className='map-menu-name';
  const best=document.createElement('span');best.className='map-menu-best';
  button.append(name,best);button.addEventListener('click',()=>{if(config.id!==item.id||loadFailed)loadMap(item.id);});
  $('map-menu').append(button);menuItems.set(item.id,{button,name,best});
}
function updateMapMenu(){
  const fr=document.documentElement.lang==='fr';
  for(const [id,{button,name,best}] of menuItems){
    const item=MAPS[id],score=highScores.get(item);
    name.textContent=item.names[fr?1:0];
    best.textContent=`${fr?'Record':'Best'} ${score===null?'—':score+'%'}`;
    button.setAttribute('aria-label',`${name.textContent}, ${score===null?(fr?'pas encore de score':'no score yet'):(fr?'record':'best score')+' '+score+'%'}`);
    if(config.id===id)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');
  }
  $('scores-note').textContent=highScores.persistent?(fr?'Records personnels · ce navigateur':'Personal bests · this browser'):(fr?'Records personnels · cette session':'Personal bests · this session');
}
window.addEventListener('storage',updateMapMenu);
let lastScore=null,loadFailed=false;
const t=createLocale(()=>{update();updateView();translateState();render();});
function translateState(){
  const fr=document.documentElement.lang==='fr',locale=fr?1:0;
  updateMapMenu();
  $('region-title').textContent=config.names[locale];
  $('unit-count').textContent=config.selected.size;
  $('unit-label').textContent=config.units[locale];
  $('scope-note').textContent=config.scope[locale];
  $('scope-rules').textContent=config.scope[locale];
  $('map-name').textContent=config.names[locale].toUpperCase();
  $('map-scale').textContent=fr?'TRACEZ LES LIMITES':'DRAW THE BORDERS';
  $('recognition-rule').textContent=fr
    ?`Une frontière est reconnue si au moins 60 % de sa longueur se trouve à environ ${config.recognitionTolerance} km ou moins de votre tracé. Le compteur s’actualise après chaque trait. Un trait peut couvrir plusieurs frontières ; plusieurs traits peuvent en couvrir une.`
    :`A border is recognised when at least 60% of its length is within about ${config.recognitionTolerance} km of your drawing. The counter updates after each stroke. One stroke can cover several borders; several strokes can cover one.`;
  $('score-rule').textContent=fr
    ?`La couverture mesure la part des vraies frontières à moins d’environ ${config.scoreTolerance} km de vos traits ; la précision mesure la part de votre tracé à cette distance d’une vraie frontière. Le score est leur moyenne harmonique. Les distances et les limites sont simplifiées. Les îles sans frontière commune n’exigent aucun trait.`
    :`Coverage measures the share of real borders within about ${config.scoreTolerance} km of your lines; accuracy measures the share of your drawing that close to a real border. The score is their harmonic mean. Distances and boundaries are simplified. Islands without shared borders need no lines.`;
  $('action-hint').textContent=t(revealed?'resultHint':'hint');
  $('loading').textContent=t(loadFailed?'error':'loading');
  $('result-note').textContent=config.fantasy
    ? (fr?'Les pointillés révèlent les limites du jeu. Le score compare votre tracé à cette carte schématique.':'The dashed lines reveal the game boundaries. Your score compares your drawing with this schematic map.')
    :t('resultNote');
  $('truth-legend').innerHTML=`<i class="true-line"></i> ${config.fantasy?(fr?'Limites du jeu':'Game boundaries'):(fr?'Vraies frontières':'Actual borders')}`;
  if(config.fantasy){
    $('map-scale').textContent=fr?'CARTE SCHÉMATIQUE':'SCHEMATIC MAP';
    $('recognition-rule').textContent=fr?'Une limite est reconnue quand au moins 60 % de son tracé est suffisamment proche de votre dessin. Les distances sont mesurées dans les unités de cette carte fictive.':'A boundary is recognised when at least 60% of it lies close to your drawing. Distances are measured in this fictional map’s own units.';
    $('score-rule').textContent=fr?'La couverture et la précision sont comparées aux limites inventées pour ce jeu, avec une tolérance plus stricte que le compteur. Les montagnes et le fleuve donnent des repères.':'Coverage and accuracy compare your drawing with the boundaries invented for this game, using a stricter tolerance than the counter. Mountains and the river provide landmarks.';
  }
  if(lastScore!==null)$('verdict').textContent=t('verdicts')[lastScore>=85?3:lastScore>=60?2:lastScore>=30?1:0];
  if(!$('toast').hidden)$('toast').textContent=t('help');
}
translateState();
function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6000);}
function resize(){
  const center=transform?toWorld(transform,[width/2,height/2]):null;
  const zoom=fitTransform?transform.scale/fitTransform.scale:1;
  const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;
  const dpr=window.devicePixelRatio||1;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  const a=project([config.bounds[0],config.bounds[3]]),b=project([config.bounds[2],config.bounds[1]]);
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
  $('mode-label').textContent=t(revealed?'revealed':panMode?'pan':'draw');
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
function drawCountryLabels(){
  const fontSize=Math.max(9,Math.min(12,width/70));
  ctx.save();
  ctx.font=`500 ${fontSize}px "DM Sans", sans-serif`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(const label of config.labels){
    const [x,y]=screen(project(label.at));
    const lines=(document.documentElement.lang==='fr'&&label.nameFr?label.nameFr:label.name).split('\n');
    lines.forEach((line,i)=>{
      const lineY=y+(i-(lines.length-1)/2)*(fontSize+3);
      ctx.strokeStyle='#e4ebd6';ctx.lineWidth=3;ctx.lineJoin='round';
      ctx.strokeText(line,x,lineY);
      ctx.fillStyle='#617153';ctx.fillText(line,x,lineY);
    });
  }
  ctx.restore();
}
function render(){if(!transform)return;ctx.clearRect(0,0,width,height);ctx.fillStyle=config.fantasy?'#e5e3d4':'#eaf0ed';ctx.fillRect(0,0,width,height);
  const grid=[];for(let lon=-180;lon<=180;lon+=5)grid.push([project([lon,-85]),project([lon,85])]);for(let lat=-85;lat<=85;lat+=5)grid.push([project([-180,lat]),project([180,lat])]);if(!config.fantasy)drawLines(grid,'#dae4df',.65);
  if(!map)return;
  for(const selected of [false,true]){ctx.beginPath();for(const country of map.countries.filter(c=>config.selected.has(c.id)===selected))for(const polygon of country.polygons)for(const ring of polygon){path(ring);ctx.closePath();}ctx.fillStyle=selected?(config.fantasy?'#eee3c5':'#dce5c8'):'#e2e6dc';ctx.fill('evenodd');}
  drawLines(map.coasts,'#b4c3a8',.8);
  ctx.save();ctx.font='9px "DM Sans", sans-serif';ctx.fillStyle='#98ada7';ctx.textAlign='center';
  if(config.id==='europe')for(const [name,at] of [[t('seas')[0],[-10,46]],[t('seas')[1],[3,56]],[t('seas')[2],[7,37.5]]]){const [x,y]=screen(project(at));ctx.fillText(name,x,y);}
  ctx.restore();
  if(config.fantasy){
    drawLines(config.rivers.map(line=>line.map(project)),'#9bafb0',1.5);
    ctx.save();ctx.strokeStyle='#afa184';ctx.lineWidth=1;
    for(const point of config.mountains){const [x,y]=screen(project(point));const size=4*Math.min(2,transform.scale/fitTransform.scale);ctx.beginPath();ctx.moveTo(x-size,y+size);ctx.lineTo(x,y-size);ctx.lineTo(x+size,y+size);ctx.stroke();}
    ctx.fillStyle='#9c9179';ctx.font='italic 11px Georgia';ctx.textAlign='center';const [x,y]=screen(project([1.3,10]));ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/2);ctx.fillText('BELEGAER',0,0);ctx.restore();ctx.restore();
  }
  drawCountryLabels();
  drawLines(strokes,'#d5834c',2.8);if(active)drawLines([active],'#d5834c',2.8);
  if(revealed)drawLines(map.borders.map(b=>b.points),'#427c65',1.8,[5,4]);
}
function update(){
  const disabled=!map||!strokes.length||revealed;
  $('undo').disabled=disabled;$('clear').disabled=disabled;$('check').disabled=disabled;
  if(map){
    const {remaining}=borderProgress(strokes,map.borders,config.recognitionTolerance);
    $('border-count').textContent=remaining;
    $('border-count-label').textContent=revealed
      ? t(remaining===1?'missingOne':'missingMany')
      : t(remaining===1?'leftOne':'leftMany');
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
$('help').onclick=()=>notify(t('help'));
$('check').onclick=()=>{if(!map||!strokes.length||revealed)return;revealed=true;const result=scoreDrawing(strokes,map.borders.map(b=>b.points),config.scoreTolerance);$('score').innerHTML=`${result.score}<span>%</span>`;for(const metric of ['coverage','accuracy']){$(metric).textContent=`${Math.round(result[metric]*100)}%`;$(metric+'-bar').style.width=`${result[metric]*100}%`;}lastScore=result.score;highScores.record(config,result.score);$('play-info').hidden=true;$('results').hidden=false;$('check').hidden=true;$('retry').hidden=false;$('truth-legend').hidden=false;translateState();update();updateView();render();};
function syncRound(){
  $('results').hidden=!revealed;$('play-info').hidden=revealed;
  $('check').hidden=revealed;$('retry').hidden=!revealed;$('truth-legend').hidden=!revealed;
  if(revealed&&map){const result=scoreDrawing(strokes,map.borders.map(b=>b.points),config.scoreTolerance);lastScore=result.score;
    $('score').innerHTML=`${result.score}<span>%</span>`;
    for(const metric of ['coverage','accuracy']){$(metric).textContent=`${Math.round(result[metric]*100)}%`;$(metric+'-bar').style.width=`${result[metric]*100}%`;}
  }
  translateState();update();updateView();render();
}
$('retry').onclick=()=>{strokes=[];active=null;revealed=false;lastScore=null;panMode=false;transform={...fitTransform};syncRound();};
async function loadMap(id){
  const version=++loadVersion;
  if(map)rounds.set(config.id,{strokes,revealed,lastScore});
  config=MAPS[id];project=projection(config.latitude);
  const saved=rounds.get(id)||{strokes:[],revealed:false,lastScore:null};
  ({strokes,revealed,lastScore}=saved);
  active=null;gesture=null;pointers.clear();panMode=false;map=null;loadFailed=false;transform=null;fitTransform=null;
  $('loading').hidden=false;$('border-count').textContent='…';$('toast').hidden=true;
  syncRound();resize();
  const url=new URL(location.href);url.searchParams.set('map',id);history.replaceState(null,'',url);
  try{
    if(!mapCache.has(config.file)){
      const file=config.file;
      mapCache.set(file,fetch(`./data/${file}`).then(response=>{if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json();}).catch(error=>{mapCache.delete(file);throw error;}));
    }
    const topology=await mapCache.get(config.file);
    if(version!==loadVersion)return;
    map=decodeTopology(topology,{...config,project});$('loading').hidden=true;syncRound();
  }catch(error){if(version!==loadVersion)return;loadFailed=true;translateState();console.error(error);}
}
new ResizeObserver(resize).observe(canvas);
document.fonts.ready.then(render);
await loadMap(config.id);
