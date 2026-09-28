import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {validateDrawing,validateNickname,validateUUID} from './supabase/functions/leaderboard/validation.js';
import {MAPS,projection} from './maps.js';import {decodeTopology,scoreDrawing} from './geometry.js';
const games=JSON.parse(readFileSync('supabase/functions/leaderboard/game-data.json'));
test('server target maps and scoring code match the client exactly',()=>{
 assert.equal(readFileSync('geometry.js','utf8'),readFileSync('supabase/functions/leaderboard/geometry.js','utf8'));
 for(const config of Object.values(MAPS)){
  const map=decodeTopology(JSON.parse(readFileSync('data/'+config.file)),{...config,project:projection(config.latitude)});
  assert.deepEqual(games[config.id].borders,map.borders.map(b=>b.points));assert.equal(games[config.id].tolerance,config.scoreTolerance);
  assert.equal(scoreDrawing(validateDrawing(games[config.id].borders,games[config.id]),games[config.id].borders,config.scoreTolerance).score,100);
 }
});
test('server rejects unsafe or excessive geometry',()=>{
 const game={bounds:[[0,0],[100,100]]};for(const data of [null,[],[[[NaN,0],[0,1]]],[[[0,0],[1e20,0]]],[[[0,0],[0,0]]],Array.from({length:1001},()=>[[0,0],[1,1]])])assert.throws(()=>validateDrawing(data,game));
});
test('nicknames support French and reject markup and control characters',()=>{
 assert.equal(validateNickname('  Éloïse  '),'Éloïse');assert.equal(validateNickname('Jean-Luc'),'Jean-Luc');
 for(const name of ['', '<script>', 'A\nB','x'.repeat(21),null])assert.throws(()=>validateNickname(name));
});
test('claim tokens must be UUIDs',()=>{assert.equal(validateUUID('550e8400-e29b-41d4-a716-446655440000'),'550e8400-e29b-41d4-a716-446655440000');assert.throws(()=>validateUUID('injected'));});
