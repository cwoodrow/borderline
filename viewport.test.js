import test from 'node:test';
import assert from 'node:assert/strict';
import {zoomAt,toWorld} from './viewport.js';

test('zoom keeps the geographic point under the cursor fixed',()=>{
  const view={scale:.4,x:50,y:120},cursor=[280,350];
  const before=toWorld(view,cursor);
  const after=toWorld(zoomAt(view,2,cursor,.4,3.2),cursor);
  assert.deepEqual(after,before);
});
test('zoom respects the full-map and maximum scales',()=>{
  const view={scale:1,x:30,y:40};
  assert.equal(zoomAt(view,.01,[100,100],1,8).scale,1);
  assert.equal(zoomAt(view,100,[100,100],1,8).scale,8);
});
test('drawn points retain their geography after zooming and panning',()=>{
  const original={scale:.5,x:30,y:40},point=toWorld(original,[100,200]);
  const moved=zoomAt(original,4,[300,300],.5,4);
  moved.x+=120;moved.y-=70;
  const screen=[point[0]*moved.scale+moved.x,point[1]*moved.scale+moved.y];
  assert.deepEqual(toWorld(moved,screen),point);
});
