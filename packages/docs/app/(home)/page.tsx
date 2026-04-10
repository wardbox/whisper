import Link from 'next/link';

const features = [
  {
    title: 'Zero Dependencies',
    description:
      'Uses native fetch. No polyfills. Works in Node, Deno, Bun, and edge runtimes out of the box.',
  },
  {
    title: 'Proactive Rate Limiting',
    description:
      "Parses Riot's rate limit headers and queues requests before hitting limits. No more 429s.",
  },
  {
    title: 'Tree-Shakeable',
    description:
      'Import only the game you need. @wardbox/whisper/lol, @wardbox/whisper/tft, and more.',
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center">
      {/* Hero Section */}
      <section className="flex w-full max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Speak to every Riot API endpoint
        </h1>
        <p className="max-w-2xl text-lg text-fd-muted-foreground sm:text-xl">
          A typed, zero-dependency TypeScript wrapper for every Riot Games API
          endpoint.
        </p>

        {/* Install command */}
        <div className="mt-4 w-full max-w-md">
          <pre className="rounded-lg border border-fd-border bg-fd-secondary px-6 py-3 text-sm font-mono">
            <span className="text-fd-muted-foreground select-none">$ </span>
            npm install @wardbox/whisper
          </pre>
        </div>

        {/* CTA buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/docs/quickstart"
            className="rounded-lg bg-fd-primary px-6 py-2.5 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
          >
            Get Started
          </Link>
          <Link
            href="/docs/api/lol"
            className="rounded-lg border border-fd-border px-6 py-2.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
          >
            View API Reference
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="w-full max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-fd-border bg-fd-card p-6"
            >
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-fd-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
