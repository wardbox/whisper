// Node ESM smoke entry — exercises every subpath via the dual-export 'import' condition.
import { createClient } from '@wardbox/whisper/core';
import * as lol from '@wardbox/whisper/lol';
import * as lor from '@wardbox/whisper/lor';
import * as riftbound from '@wardbox/whisper/riftbound';
import * as riot from '@wardbox/whisper/riot';
import * as tft from '@wardbox/whisper/tft';
import * as val from '@wardbox/whisper/val';

// Root import — Phase 1 locked decision says no top-level barrel,
// but the path MUST resolve (no ERR_PACKAGE_PATH_NOT_EXPORTED).
import '@wardbox/whisper';

const client = createClient({ apiKey: 'test-key-never-hits-network' });
if (typeof client !== 'object' || client === null) {
  console.error('smoke[esm]: createClient did not return an object');
  process.exit(1);
}

// Touch each namespace import so tree-shakers don't eliminate them
void lol;
void tft;
void val;
void lor;
void riftbound;
void riot;

console.log('smoke[esm]: ok — all 8 subpaths resolved + createClient initialized');
