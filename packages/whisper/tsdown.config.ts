import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'lol/index': 'src/lol/index.ts',
    'tft/index': 'src/tft/index.ts',
    'val/index': 'src/val/index.ts',
    'lor/index': 'src/lor/index.ts',
    'riftbound/index': 'src/riftbound/index.ts',
    'riot/index': 'src/riot/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  platform: 'neutral',
});
