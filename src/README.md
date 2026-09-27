# /src

The Next.js application (App Router, TypeScript, Tailwind — ADR-001). Static export
(`output: "export"` in `next.config.ts`, per ADR-002/RG-2) — every route is fully
static-generated at build time, no server runtime, no API routes yet.

- `app/page.tsx` — homepage, lists Groves and repos from `/content`.
- `app/grove/[slug]/page.tsx`, `app/repo/[slug]/page.tsx` — statically generated for
  every Grove/repo found in `/content` (`generateStaticParams`), not hand-listed routes.
- `lib/content.ts` — the `/content` loader. See its doc comment and `tests/lib/
  content.test.ts` for the validation contract.
