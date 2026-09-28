import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {MAPS,projection} from '../maps.js';
import {decodeTopology} from '../geometry.js';
const games={};
for(const config of Object.values(MAPS)){
  const project=projection(config.latitude);
  const {borders}=decodeTopology(JSON.parse(readFileSync(`data/${config.file}`)),{...config,project});
  const rules={borders:borders.map(b=>b.points),tolerance:config.scoreTolerance,bounds:[project([config.bounds[0],config.bounds[3]]),project([config.bounds[2],config.bounds[1]])]};
  games[config.id]={...rules,revision:createHash('sha256').update(JSON.stringify(rules)+readFileSync('geometry.js','utf8')).digest('hex').slice(0,20)};
}
mkdirSync('supabase/functions/leaderboard',{recursive:true});
writeFileSync('supabase/functions/leaderboard/game-data.json',JSON.stringify(games));
writeFileSync('supabase/functions/leaderboard/geometry.js',readFileSync('geometry.js'));
