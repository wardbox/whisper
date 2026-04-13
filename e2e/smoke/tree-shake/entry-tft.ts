// Tree-shake fixture: imports ONLY @wardbox/whisper/tft.
// After bundling with esbuild, the output should contain TFT symbols + shared core
// (rate limiter, cache, errors) but ZERO LoL, Val, LoR, or Riftbound game-specific symbols.
//
// The shared client-*.js chunk WILL appear in the bundle -- that's correct.
// The assertion is about cross-game leaks, not bundle minimality.
import * as tft from '@wardbox/whisper/tft';

// Touch the namespace so esbuild can't tree-shake it away
console.log(Object.keys(tft));
