import type { WhisperClient } from '../core/client.js';
import type { Content } from '../types/generated/val.js';
import type { ValPlatformRoute } from '../types/val-platform.js';

/**
 * Valorant Content API (v1).
 *
 * Retrieve game content including agents, maps, game modes, and cosmetics.
 *
 * All methods require a {@link ValPlatformRoute} (e.g., 'na', 'eu', 'ap').
 *
 * @example
 * ```typescript
 * import { valContentV1 } from '@wardbox/whisper/val';
 *
 * const content = await valContentV1.getContent(client, 'na');
 * console.log(content.characters.length, 'agents available');
 * ```
 */
export const valContentV1 = {
  /**
   * Get all game content for the given region.
   *
   * Returns agents, maps, game modes, cosmetics, and other content items.
   * Optionally filter by locale to get localized names.
   *
   * @param client - WhisperClient instance
   * @param route - Valorant platform routing value (e.g., 'na', 'eu', 'ap')
   * @param options - Optional locale filter
   * @returns All Valorant game content
   *
   * @example
   * ```typescript
   * // Get content with default locale
   * const content = await valContentV1.getContent(client, 'na');
   *
   * // Get content in a specific locale
   * const contentJp = await valContentV1.getContent(client, 'ap', { locale: 'ja-JP' });
   * ```
   */
  async getContent(
    client: WhisperClient,
    route: ValPlatformRoute,
    options?: { locale?: string },
  ): Promise<Content> {
    const params: Record<string, string> | undefined = options?.locale
      ? { locale: options.locale }
      : undefined;
    const response = await client.request<Content>(
      route,
      '/val/content/v1/contents',
      'val-content-v1.getContent',
      params ? { params } : undefined,
    );
    return response.data;
  },
} as const;
