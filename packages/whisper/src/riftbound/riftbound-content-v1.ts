import type { WhisperClient } from '../core/client.js';
import type { RiftboundContent } from '../types/generated/riftbound.js';
import type { RegionalRoute } from '../types/regional.js';

/**
 * Riftbound Content API (v1).
 *
 * Retrieve game content including card sets and card data for Riftbound.
 *
 * All methods require a {@link RegionalRoute} (americas, europe, asia, sea).
 * Riftbound content is available on americas, asia, and europe regions.
 *
 * @example
 * ```typescript
 * import { riftboundContentV1 } from '@wardbox/whisper/riftbound';
 *
 * const content = await riftboundContentV1.getContent(client, 'americas');
 * console.log(content.version, content.sets.length);
 * ```
 */
export const riftboundContentV1 = {
  /**
   * Get all game content for Riftbound.
   *
   * Returns the full content catalog including card sets, cards, and version info.
   * Optionally specify a locale for localized content.
   *
   * @param client - WhisperClient instance
   * @param route - Regional routing value (e.g., 'americas', 'asia', 'europe')
   * @param options - Optional parameters
   * @param options.locale - Locale for content (e.g., 'en_US', 'ko_KR'). Defaults to 'en' on Riot's side if omitted.
   * @returns Full Riftbound content data with card sets
   *
   * @example
   * ```typescript
   * const content = await riftboundContentV1.getContent(client, 'americas');
   * for (const set of content.sets) {
   *   console.log(`${set.name}: ${set.cards.length} cards`);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Get localized content
   * const content = await riftboundContentV1.getContent(client, 'asia', { locale: 'ko_KR' });
   * ```
   */
  async getContent(
    client: WhisperClient,
    route: RegionalRoute,
    options?: { locale?: string },
  ): Promise<RiftboundContent> {
    const params: Record<string, string> = {};
    if (options?.locale !== undefined) {
      params.locale = options.locale;
    }
    const response = await client.request<RiftboundContent>(
      route,
      '/riftbound/content/v1/contents',
      'riftbound-content-v1.getContent',
      Object.keys(params).length > 0 ? { params } : undefined,
    );
    return response.data;
  },
} as const;
