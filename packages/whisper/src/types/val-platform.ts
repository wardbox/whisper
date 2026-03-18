/**
 * Valorant-specific platform routing values.
 *
 * Valorant uses its own routing system distinct from the standard
 * {@link import('./platform.js').PlatformRoute | PlatformRoute} (na1, euw1...)
 * and {@link import('./regional.js').RegionalRoute | RegionalRoute} (americas, europe...).
 * All Valorant API endpoints use these routing values.
 *
 * @example
 * ```typescript
 * import { VAL_PLATFORM, type ValPlatformRoute } from '@wardbox/whisper/val';
 *
 * const route: ValPlatformRoute = 'na';
 * // or use the constant:
 * const route2 = VAL_PLATFORM.NA; // 'na'
 * ```
 */
export type ValPlatformRoute = 'ap' | 'br' | 'eu' | 'kr' | 'latam' | 'na' | 'esports';

/** Valorant platform routing constants for IDE discoverability */
export const VAL_PLATFORM = {
  /** Asia Pacific */
  AP: 'ap',
  /** Brazil */
  BR: 'br',
  /** Europe */
  EU: 'eu',
  /** Korea */
  KR: 'kr',
  /** Latin America */
  LATAM: 'latam',
  /** North America */
  NA: 'na',
  /** Esports (global tournaments) */
  ESPORTS: 'esports',
} as const satisfies Record<string, ValPlatformRoute>;
