import test from 'node:test';
import assert from 'node:assert/strict';
import {messages,resolveLanguage} from './i18n.js';
test('French and English cover the same dynamic game states',()=>{
  assert.deepEqual(Object.keys(messages.fr).sort(),Object.keys(messages.en).sort());
  assert.equal(messages.fr.verdicts.length,messages.en.verdicts.length);
  assert.equal(messages.fr.seas.length,messages.en.seas.length);
});
test('shareable language overrides saved preference and browser language',()=>{
  assert.equal(resolveLanguage('?lang=fr','en','en-US'),'fr');
  assert.equal(resolveLanguage('?lang=en','fr','fr-FR'),'en');
  assert.equal(resolveLanguage('','en','fr-FR'),'en');
  assert.equal(resolveLanguage('',null,'fr-FR'),'fr');
  assert.equal(resolveLanguage('?lang=unknown',null,'de'),'en');
});
