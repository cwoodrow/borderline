import test from 'node:test';import assert from 'node:assert/strict';
import {createScores,scoreKey} from './scores.js';
const config={id:'europe',selected:new Set(['FR','DE']),scoreTolerance:25};
function storage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
test('scores are saved per map and survive a new session',()=>{
  const disk=storage(),scores=createScores(disk),other={...config,id:'france'};
  assert.equal(scores.get(config),null);scores.record(config,62);scores.record(other,84);
  const fresh=createScores(disk);assert.equal(fresh.get(config),62);assert.equal(fresh.get(other),84);
});
test('only the highest score is retained, including a valid zero',()=>{
  const scores=createScores(storage());scores.record(config,0);assert.equal(scores.get(config),0);
  scores.record(config,52);scores.record(config,20);assert.equal(scores.get(config),52);
  scores.record(config,100);assert.equal(scores.get(config),100);
});
test('another tab cannot replace a higher score with a lower one',()=>{
  const disk=storage(),a=createScores(disk),b=createScores(disk);
  a.record(config,40);b.record(config,90);a.record(config,60);assert.equal(createScores(disk).get(config),90);
});
test('corrupt saved data is ignored and unavailable storage still allows play',()=>{
  for(const raw of ['broken','null','"99"','101','-1','{}']){const disk=storage();disk.setItem(scoreKey(config),raw);assert.equal(createScores(disk).get(config),null);}
  const scores=createScores({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});
  scores.record(config,75);assert.equal(scores.get(config),75);assert.equal(scores.persistent,false);
});
test('changed map scope or scoring starts a separate record',()=>{
  const scores=createScores(storage());scores.record(config,90);
  assert.equal(scores.get({...config,scoreTolerance:12}),null);
  assert.equal(scores.get({...config,selected:new Set(['FR'])}),null);
});
test('invalid scores cannot be saved',()=>{
  const scores=createScores(storage());for(const value of [-1,101,NaN,Infinity,'90',null,42.5])assert.throws(()=>scores.record(config,value),RangeError);
});
