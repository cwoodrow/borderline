// Original SVG silhouettes derived from the bundled geography. Run from the repo root.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {MAPS,projection} from '../maps.js';
import {decodeTopology} from '../geometry.js';
mkdirSync('assets/maps',{recursive:true});
for(const config of Object.values(MAPS)){
  const project=projection(config.latitude),map=decodeTopology(JSON.parse(readFileSync(`data/${config.file}`)),{...config,project});
  const a=project([config.bounds[0],config.bounds[3]]),b=project([config.bounds[2],config.bounds[1]]);
  const scale=Math.min(220/(b[0]-a[0]),145/(b[1]-a[1]));
  const xy=p=>[(p[0]-(a[0]+b[0])/2)*scale+125,(p[1]-(a[1]+b[1])/2)*scale+80];
  let path='';
  for(const country of map.countries.filter(c=>config.selected.has(c.id)))for(const polygon of country.polygons)for(const ring of polygon){
    let last;const points=[];
    for(let i=0;i<ring.length;i++){const point=xy(ring[i]);if(!last||i===ring.length-1||Math.hypot(point[0]-last[0],point[1]-last[1])>.55){points.push(point);last=point;}}
    path+=points.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('')+'Z';
  }
  writeFileSync(`assets/maps/${config.id}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 160"><path fill="#9aaf81" fill-rule="evenodd" d="${path}"/></svg>\n`);
}
