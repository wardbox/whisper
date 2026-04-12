// TypeScript type-check entry — proves every subpath has resolvable .d.ts/.d.cts.
import { createClient } from '@wardbox/whisper/core';
import * as lol from '@wardbox/whisper/lol';
import * as tft from '@wardbox/whisper/tft';
import * as val from '@wardbox/whisper/val';
import * as lor from '@wardbox/whisper/lor';
import * as riftbound from '@wardbox/whisper/riftbound';
import * as riot from '@wardbox/whisper/riot';
import '@wardbox/whisper';

const client: object = createClient({ apiKey: 'test-key-never-hits-network' });

void client;
void lol;
void tft;
void val;
void lor;
void riftbound;
void riot;
