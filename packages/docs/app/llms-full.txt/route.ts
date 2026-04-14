import { getLLMText } from '@/lib/get-llm-text';
import { source } from '@/lib/source';

export const revalidate = false;

export function GET() {
  const pages = source.getPages();
  const texts = pages.map(getLLMText);
  return new Response(texts.join('\n\n---\n\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
