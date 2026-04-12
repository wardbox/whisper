// Node CJS smoke entry — exercises the dual-export 'require' condition.
const { createClient } = require('@wardbox/whisper/core');
const lol = require('@wardbox/whisper/lol');
const tft = require('@wardbox/whisper/tft');
const val = require('@wardbox/whisper/val');
const lor = require('@wardbox/whisper/lor');
const riftbound = require('@wardbox/whisper/riftbound');
const riot = require('@wardbox/whisper/riot');

// Root require — must resolve via the require condition.
require('@wardbox/whisper');

const client = createClient({ apiKey: 'test-key-never-hits-network' });
if (typeof client !== 'object' || client === null) {
  console.error('smoke[cjs]: createClient did not return an object');
  process.exit(1);
}

void lol;
void tft;
void val;
void lor;
void riftbound;
void riot;

console.log('smoke[cjs]: ok — all 8 subpaths resolved + createClient initialized');
