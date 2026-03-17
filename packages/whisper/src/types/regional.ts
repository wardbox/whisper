/** All Riot API regional routing values */
export type RegionalRoute = 'americas' | 'europe' | 'asia' | 'sea';

/** Regional routing constants for IDE discoverability */
export const REGIONAL = {
  AMERICAS: 'americas',
  EUROPE: 'europe',
  ASIA: 'asia',
  SEA: 'sea',
} as const satisfies Record<string, RegionalRoute>;
