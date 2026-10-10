import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapsLinks } from './maps-links';

test('coordinates open a pin in the maps app, then fall back to the web', () => {
  assert.deepEqual(mapsLinks('12.971599,77.594566'), [
    'geo:12.971599,77.594566?q=12.971599%2C77.594566',
    'https://www.google.com/maps/search/?api=1&query=12.971599%2C77.594566',
  ]);
  assert.equal(mapsLinks(' -33.8688 , 151.2093 ')[0], 'geo:-33.8688,151.2093?q=-33.8688%2C151.2093');
});

test('typed places and out-of-range numbers search by text', () => {
  assert.equal(mapsLinks('Phoenix Mall')[0], 'geo:0,0?q=Phoenix%20Mall');
  assert.equal(mapsLinks('95,200')[0], 'geo:0,0?q=95%2C200');
});

test('an empty location has no links', () => {
  assert.deepEqual(mapsLinks(null), []);
  assert.deepEqual(mapsLinks('  '), []);
});
