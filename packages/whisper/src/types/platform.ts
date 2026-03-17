/** All Riot API platform routing values */
export type PlatformRoute =
  | 'na1' | 'br1' | 'la1' | 'la2'
  | 'jp1' | 'kr'
  | 'me1' | 'eun1' | 'euw1' | 'tr1' | 'ru'
  | 'oc1' | 'ph2' | 'sg2' | 'th2' | 'tw2' | 'vn2'

/** Platform routing constants for IDE discoverability */
export const PLATFORM = {
  NA1: 'na1',
  BR1: 'br1',
  LA1: 'la1',
  LA2: 'la2',
  JP1: 'jp1',
  KR: 'kr',
  ME1: 'me1',
  EUN1: 'eun1',
  EUW1: 'euw1',
  TR1: 'tr1',
  RU: 'ru',
  OC1: 'oc1',
  PH2: 'ph2',
  SG2: 'sg2',
  TH2: 'th2',
  TW2: 'tw2',
  VN2: 'vn2',
} as const satisfies Record<string, PlatformRoute>
