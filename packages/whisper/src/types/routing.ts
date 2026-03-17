import type { PlatformRoute } from './platform.js';
import type { RegionalRoute } from './regional.js';

const PLATFORM_TO_REGIONAL: Record<PlatformRoute, RegionalRoute> = {
  na1: 'americas',
  br1: 'americas',
  la1: 'americas',
  la2: 'americas',
  jp1: 'asia',
  kr: 'asia',
  me1: 'europe',
  eun1: 'europe',
  euw1: 'europe',
  tr1: 'europe',
  ru: 'europe',
  oc1: 'sea',
  ph2: 'sea',
  sg2: 'sea',
  th2: 'sea',
  tw2: 'sea',
  vn2: 'sea',
};

/** Map a platform route to its corresponding regional route */
export function toRegional(platform: PlatformRoute): RegionalRoute {
  return PLATFORM_TO_REGIONAL[platform];
}
