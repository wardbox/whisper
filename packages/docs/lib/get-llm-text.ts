import type { InferPageType } from 'fumadocs-core/source';
import type { source } from '@/lib/source';

type PageType = InferPageType<typeof source>;

export function getLLMText(page: PageType): string {
  const data = page.data as unknown as Record<string, unknown>;
  // Use processed markdown if available (requires includeProcessedMarkdown in source.config.ts)
  const markdown = typeof data._markdown === 'string' ? data._markdown : null;

  if (markdown) {
    return `# ${page.data.title} (${page.url})\n\n${markdown}`;
  }

  // Fallback to description only
  return `# ${page.data.title} (${page.url})\n\n${page.data.description ?? ''}`;
}
