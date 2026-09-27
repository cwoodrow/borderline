export const SELECTED = new Set(['620','724','250','056','528','442','276','756','040','380','208','826','372']);
const COS = Math.cos(48 * Math.PI / 180);
export const project = ([lon, lat]) => [lon * 111.32 * COS, -lat * 111.32];
export const BOUNDS = [-12, 35, 18, 59.5];
export const BORDER_TOLERANCE = 25;
// Recognition is forgiving; the score retains its stricter 25 km tolerance.
export const BORDER_RECOGNITION_TOLERANCE = 75;
export const BORDER_COMPLETION_THRESHOLD = 0.6;
// Join shared pieces so dashed reveals stay continuous across source arc boundaries.
function joinBorders(borders){
  const groups=new Map();
  for(const border of borders){if(!groups.has(border.key))groups.set(border.key,[]);groups.get(border.key).push(border);}
  const result=[];
  for(const group of groups.values()){
    const endpoints=new Map(),used=new Set();
    const key=p=>p.join(',');
    group.forEach((border,i)=>{for(const point of [border.points[0],border.points.at(-1)]){const k=key(point);if(!endpoints.has(k))endpoints.set(k,[]);endpoints.get(k).push(i);}});
    group.forEach((border,i)=>{
      if(used.has(i))return;
      used.add(i);let points=[...border.points];
      for(const end of [false,true]){
        while(true){
          const point=end?points.at(-1):points[0];
          const next=(endpoints.get(key(point))||[]).find(j=>!used.has(j));
          if(next===undefined)break;
          used.add(next);let line=group[next].points;
          if(key(end?line[0]:line.at(-1))!==key(point))line=[...line].reverse();
          points=end?[...points,...line.slice(1)]:[...line.slice(0,-1),...points];
        }
      }
      result.push({...border,points});
    });
  }
  return result;
}
export function decodeTopology(topology, options={}) {
  const {selected=SELECTED,bounds=BOUNDS,project:projectPoint=project,object='countries',remap={}}=options;
  const {scale,translate}=topology.transform||{};
  const arcs = topology.arcs.map(arc => {
    if(!scale)return arc.map(projectPoint);
    let x=0,y=0;
    return arc.map(p => {x+=p[0];y+=p[1];return projectPoint([x*scale[0]+translate[0],y*scale[1]+translate[1]]);});
  });
  const owners = arcs.map(()=>[]);
  const countries = topology.objects[object].geometries.map(g => {
    const polygons = g.type === 'Polygon' ? [g.arcs] : g.arcs;
    const id=remap[g.properties.name]||String(g.id??g.properties.name).padStart(3,'0');
    const used=new Set(polygons.flat(2).map(a=>a<0?~a:a));
    used.forEach(a=>{if(!owners[a].includes(id))owners[a].push(id);});
    return {id,name:g.properties.name,polygons:polygons.map(p=>p.map(ring=>ring.flatMap((a,i)=>{
      const points=a<0?[...arcs[~a]].reverse():arcs[a];
      return i?points.slice(1):points;
    })))};
  });
  const topLeft=projectPoint([bounds[0],bounds[3]]), bottomRight=projectPoint([bounds[2],bounds[1]]);
  const visible=p=>p[0]>=topLeft[0]&&p[0]<=bottomRight[0]&&p[1]>=topLeft[1]&&p[1]<=bottomRight[1];
  const borders=arcs.flatMap((points,i)=>owners[i].length===2&&owners[i].every(id=>selected.has(id))&&points.some(visible)?[{points,ids:owners[i],key:[...owners[i]].sort().join('-')}]:[]);
  const references=arcs.map(()=>0);
  for(const g of topology.objects[object].geometries){const polygons=g.type==='Polygon'?[g.arcs]:g.arcs;for(const a of new Set(polygons.flat(2).map(a=>a<0?~a:a)))references[a]++;}
  // Keep nearby geographic context; distant polygons crossing the date line can
  // otherwise create spurious lines across a regional rectangular projection.
  const contextA=projectPoint([bounds[0]-15,bounds[3]+10]),contextB=projectPoint([bounds[2]+15,bounds[1]-10]);
  const nearby=p=>p[0]>=contextA[0]&&p[0]<=contextB[0]&&p[1]>=contextA[1]&&p[1]<=contextB[1];
  for(const country of countries)country.polygons=country.polygons.filter(polygon=>polygon[0].some(nearby));
  return {countries,borders:joinBorders(borders),coasts:arcs.filter((points,i)=>references[i]===1&&points.some(nearby))};
}
export function sampleLines(lines, step=4) {
  const samples=[];
  for(const line of lines) for(let i=1;i<line.length;i++) {
    const a=line[i-1],b=line[i],distance=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(!distance)continue;
    const n=Math.ceil(distance/step);
    for(let j=0;j<n;j++) {const t=(j+.5)/n;samples.push({point:[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],weight:distance/n});}
  }
  return samples;
}
export function distanceToSegment(p,a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy;
  const t=d?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/d)):0;
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
}
function indexLines(lines,tolerance) {
  const grid=new Map();
  for(const line of lines)for(let i=1;i<line.length;i++){
    const a=line[i-1],b=line[i];
    for(let x=Math.floor((Math.min(a[0],b[0])-tolerance)/tolerance);x<=Math.floor((Math.max(a[0],b[0])+tolerance)/tolerance);x++)
      for(let y=Math.floor((Math.min(a[1],b[1])-tolerance)/tolerance);y<=Math.floor((Math.max(a[1],b[1])+tolerance)/tolerance);y++){
        const key=`${x},${y}`;if(!grid.has(key))grid.set(key,[]);grid.get(key).push([a,b]);
      }
  }
  return p=>(grid.get(`${Math.floor(p[0]/tolerance)},${Math.floor(p[1]/tolerance)}`)||[]).some(([a,b])=>distanceToSegment(p,a,b)<=tolerance);
}
// Combine every arc belonging to the same country pair before measuring coverage.
export function borderProgress(drawing, borders, tolerance=BORDER_RECOGNITION_TOLERANCE) {
  const nearDrawing=indexLines(drawing,tolerance);
  const pairs=new Map();
  for(const border of borders){
    if(!pairs.has(border.key))pairs.set(border.key,{covered:0,length:0});
    const pair=pairs.get(border.key);
    for(const sample of sampleLines([border.points])){
      pair.length+=sample.weight;
      if(nearDrawing(sample.point))pair.covered+=sample.weight;
    }
  }
  const completed=[...pairs.values()].filter(pair=>pair.length>0&&pair.covered/pair.length>=BORDER_COMPLETION_THRESHOLD).length;
  return {total:pairs.size,completed,remaining:pairs.size-completed};
}
export function scoreDrawing(drawing, truth, tolerance=BORDER_TOLERANCE) {
  const drawnSamples=sampleLines(drawing),trueSamples=sampleLines(truth);
  const nearDrawing=indexLines(drawing,tolerance),nearTruth=indexLines(truth,tolerance);
  const ratio=(samples,near)=>{let hit=0,total=0;for(const s of samples){total+=s.weight;if(near(s.point))hit+=s.weight;}return total?hit/total:0;};
  const coverage=ratio(trueSamples,nearDrawing),accuracy=ratio(drawnSamples,nearTruth);
  return {coverage,accuracy,score:coverage+accuracy?Math.round(100*2*coverage*accuracy/(coverage+accuracy)):0};
}
