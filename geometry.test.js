import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeTopology,scoreDrawing,borderProgress} from './geometry.js';
const truth=[[[0,0],[100,0]]];
test('a perfect border scores 100',()=>assert.deepEqual(scoreDrawing(truth,truth),{coverage:1,accuracy:1,score:100}));
test('an empty map scores zero',()=>assert.equal(scoreDrawing([],truth).score,0));
test('distant drawings get no credit',()=>assert.equal(scoreDrawing([[[0,100],[100,100]]],truth).score,0));
test('missing borders reduce coverage',()=>{const s=scoreDrawing([[[0,0],[20,0]]],truth);assert.ok(s.coverage<.5);assert.equal(s.accuracy,1);});
test('extra lines reduce accuracy even with full coverage',()=>{const s=scoreDrawing([...truth,[[0,200],[1000,200]]],truth);assert.equal(s.coverage,1);assert.ok(s.score<20);});
test('retracing a partial border cannot increase coverage',()=>{const line=[[[0,0],[20,0]]];assert.equal(scoreDrawing(line,truth).score,scoreDrawing([...line,...line],truth).score);});
test('real geographic targets are shared western European borders',()=>{const map=decodeTopology(JSON.parse(readFileSync('data/countries-50m.json')));const keys=new Set(map.borders.map(b=>b.key));assert.ok(keys.has('250-724'));assert.ok(keys.has('372-826'));assert.ok(keys.has('056-528'));assert.ok(!keys.has('040-348'));assert.ok(map.borders.length>15);assert.equal(scoreDrawing(map.borders.map(b=>b.points),map.borders.map(b=>b.points)).score,100);});

const borders=[
  {key:'A-B',points:[[0,0],[1000,0]]},
  {key:'B-C',points:[[1000,0],[2000,0]]},
];
test('one continuous stroke can complete two distinct borders',()=>{
  assert.deepEqual(borderProgress([[[0,0],[2000,0]]],borders),{total:2,completed:2,remaining:0});
});
test('multiple strokes combine and retracing never counts twice',()=>{
  const drawing=[[[0,0],[500,0]],[[500,0],[1000,0]]];
  assert.equal(borderProgress(drawing,borders).completed,1);
  assert.equal(borderProgress([...drawing,...drawing],borders).completed,1);
});
test('a brief crossing or distant stroke does not complete a border',()=>{
  assert.equal(borderProgress([[[500,-100],[500,100]]],borders).remaining,2);
  assert.equal(borderProgress([[[0,100],[2000,100]]],borders).remaining,2);
});
test('partial coverage must reach the completion threshold',()=>{
  assert.equal(borderProgress([[[0,0],[500,0]]],borders).completed,0);
  assert.equal(borderProgress([[[0,0],[550,0]]],borders).completed,1);
});
test('country-pair arcs are combined and weighted by length',()=>{
  const split=[{key:'A-B',points:[[0,0],[100,0]]},{key:'A-B',points:[[500,0],[1400,0]]}];
  assert.deepEqual(borderProgress([split[0].points],split),{total:1,completed:0,remaining:1});
  assert.deepEqual(borderProgress([split[1].points],split),{total:1,completed:1,remaining:0});
});
test('removing strokes restores remaining borders',()=>{
  const drawing=borders.map(b=>b.points);
  assert.equal(borderProgress(drawing,borders).remaining,0);
  drawing.pop();assert.equal(borderProgress(drawing,borders).remaining,1);
  drawing.pop();assert.equal(borderProgress(drawing,borders).remaining,2);
});
test('the real map has 19 unique borders, all detected by a perfect drawing',()=>{
  const map=decodeTopology(JSON.parse(readFileSync('data/countries-50m.json')));
  assert.deepEqual(borderProgress([],map.borders),{total:19,completed:0,remaining:19});
  assert.deepEqual(borderProgress(map.borders.map(b=>b.points),map.borders),{total:19,completed:19,remaining:0});
});

test('an approximate attempt is recognised without relaxing the accuracy score',()=>{
  const drawing=[[[0,60],[1000,60]]];
  assert.equal(borderProgress(drawing,borders).completed,1);
  assert.deepEqual(scoreDrawing(drawing,[borders[0].points]),{coverage:0,accuracy:0,score:0});
});
test('recognition still rejects a parallel attempt outside its wider tolerance',()=>{
  assert.equal(borderProgress([[[0,80],[1000,80]]],borders).completed,0);
});
