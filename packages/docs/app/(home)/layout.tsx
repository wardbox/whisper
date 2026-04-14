import { HomeLayout } from 'fumadocs-ui/layouts/home';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout
      nav={{
        title: 'Whisper',
      }}
      links={[
        { text: 'Docs', url: '/docs' },
        { text: 'API Reference', url: '/docs/api/lol' },
        {
          text: 'GitHub',
          url: 'https://github.com/wardbox/whisper',
          external: true,
        },
      ]}
    >
      {children}
    </HomeLayout>
  );
}
