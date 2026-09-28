import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAPS,projection} from './maps.js';
import {decodeTopology,scoreDrawing,borderProgress} from './geometry.js';
const counts={europe:19,africa:14,'south-america':25,usa:13,france:23};
const decoded={};
for(const config of Object.values(MAPS)){
  const map=decodeTopology(JSON.parse(readFileSync('data/'+config.file)),{...config,project:projection(config.latitude)});decoded[config.id]=map;
  test(`${config.id}: every selected area exists, borders are unique pairs, and scoring is consistent`,()=>{
    const ids=new Set(map.countries.map(c=>c.id));
    for(const id of config.selected)assert.ok(ids.has(id),`Missing ${id}`);
    assert.equal(new Set(map.borders.map(b=>b.key)).size,counts[config.id]);
    for(const b of map.borders){assert.equal(b.ids.length,2);assert.notEqual(b.ids[0],b.ids[1]);assert.ok(b.ids.every(id=>config.selected.has(id)));}
    const drawing=map.borders.map(b=>b.points);
    assert.equal(scoreDrawing(drawing,drawing,config.scoreTolerance).score,100);
    assert.equal(borderProgress(drawing,map.borders,config.recognitionTolerance).remaining,0);
    assert.equal(borderProgress([],map.borders,config.recognitionTolerance).remaining,counts[config.id]);
  });
}
test('French regions use current merged regions with expected shared boundaries',()=>{
  const keys=new Set(decoded.france.borders.map(b=>b.key));
  assert.ok(keys.has('011-032')); // Île-de-France / Hauts-de-France
  assert.ok(keys.has('075-076')); // Nouvelle-Aquitaine / Occitanie
  assert.ok(keys.has('084-093')); // Auvergne-Rhône-Alpes / PACA
  assert.ok(![...keys].some(key=>key.includes('094'))); // Corsica
});
test('Northeast includes exactly New England, New York, New Jersey and Pennsylvania',()=>{
  assert.deepEqual([...MAPS.usa.selected].sort(),['009','023','025','033','034','036','042','044','050']);
  const keys=new Set(decoded.usa.borders.map(b=>b.key));
  assert.ok(keys.has('036-042'));
  assert.ok(keys.has('009-025'));
  assert.ok(!keys.has('006-032'));
});
test('Maghreb selection excludes distant African borders and includes neighbouring countries',()=>{
  assert.deepEqual([...MAPS.africa.selected].sort(),['012','434','466','478','504','562','732','788','818']);
  const keys=new Set(decoded.africa.borders.map(b=>b.key));
  assert.ok(keys.has('012-504'));
  assert.ok(keys.has('434-818'));
  assert.ok(!keys.has('710-716'));
});
test('South America includes French Guiana',()=>{
  assert.ok(decoded['south-america'].borders.some(b=>b.key==='076-250'));
});
