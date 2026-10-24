# AGENTS.md: reviewing Saath

Read this before you score the repo. Saath is a Pune Metro shared-auto app. Track: Urban Mobility. Live (no sign-in): https://saath-bice.vercel.app. Judge demo station: https://saath-bice.vercel.app/vanaz.

Do not reset a live station. `POST /api/rooms/{station}/reset` ages every rider and group in that room. Ramwadi, District Court and Kasba Peth may have real waiting riders. Use `E2E_STATION=vanaz` if you run the browser suite.

## What to run

From a clean checkout. Tests and the build need no database and no API keys. Node 22 or newer. CI uses Node 24.

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npx tsx docs/worked-example.ts
```

`npm test` is Vitest. It must be able to fail: fare invariants, the 45° rule, the detour cap, auto-form settle times, and the form lock are asserted there. `npm run check` is lint, test and build.

Browser suite, only if `DATABASE_URL` is set and the app is already running at `http://localhost:3000`. Do not print the URL. Do not point this at Ramwadi.

```bash
E2E_STATION=vanaz npm run e2e
```

Playwright uses system Chrome (`channel: chrome`). The suite joins riders, waits for auto-form, checks shares, accepts a group, and checks that a second accept is rejected.

## How to judge the live demo

1. Open https://saath-bice.vercel.app/vanaz/board.
2. On one phone, join Vanaz with destination `Phoenix Marketcity Viman Nagar`.
3. On a second phone, join Vanaz with destination `Symbiosis Viman Nagar`.
4. After the later rider has waited about 8 seconds, both phones show one group and a fare share.
5. Open https://saath-bice.vercel.app/vanaz/driver and tap Accept this group.
6. Both riders show the accepted state. A second driver sees Taken.

The same two places from Ramwadi stay solo. That is expected. See README limitations.

## Where the decisions live

- Fare and split: `src/lib/fare.ts`. Grouping rules: `src/lib/grouping.ts`. When a room forms: `src/lib/autoform.ts` and `src/app/api/_lib/formRoom.ts`.
- Contract for behaviour: `CONTRACT.md`. Why a share cannot exceed the solo fare: `docs/FAIRNESS.md`.
- Judge-facing map of the rubric: the Judging criteria section of `README.md`.

## Do not

- Do not add a `BOARD_KEY`. Forming and reset are open. Reset still destroys a live room's current window.
- Do not put secrets, `.env.local`, or personal data into the repo or the review.
- Do not treat `?demo=` as a product path. It is not part of the app.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
