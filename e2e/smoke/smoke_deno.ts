// Deno smoke entry — Deno reads `npm:` specifiers via the local node_modules populated by pnpm install.
// Per CONTEXT.md user decision: workaround path (no bootstrap publish, no npm: registry lookup).
// nodeModulesDir: "auto" in deno.json + the import map make this resolve to the file: tarball pnpm installed.
import { createClient } from '@wardbox/whisper/core';
import * as lol from '@wardbox/whisper/lol';
import * as tft from '@wardbox/whisper/tft';
import * as val from '@wardbox/whisper/val';
import * as lor from '@wardbox/whisper/lor';
import * as riftbound from '@wardbox/whisper/riftbound';
import * as riot from '@wardbox/whisper/riot';
import '@wardbox/whisper';

const client = createClient({ apiKey: 'test-key-never-hits-network' });
if (typeof client !== 'object' || client === null) {
  console.error('smoke[deno]: createClient did not return an object');
  Deno.exit(1);
}

void lol;
void tft;
void val;
void lor;
void riftbound;
void riot;

console.log('smoke[deno]: ok — all 8 subpaths resolved + createClient initialized');
