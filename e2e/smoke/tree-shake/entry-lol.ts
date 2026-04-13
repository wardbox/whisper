// Tree-shake fixture: imports ONLY @wardbox/whisper/lol.
// After bundling, output should NOT contain TFT, Val, LoR, or Riftbound game-specific symbols.
import * as lol from '@wardbox/whisper/lol';

console.log(Object.keys(lol));
