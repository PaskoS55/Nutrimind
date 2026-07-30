# NutriMind public UI preview report

## Design decisions

- Replaced the exported multi-screen client prototype with one statically rendered public product page.
- Preserved the `NutriMind by Pasko` name, deep-green palette, calm health-tech character, and the existing continuous-line/leaf brand idea in a compact CSS mark.
- Used a light neutral canvas, restrained green gradients, rounded cards, editorial serif display type, and accessible high-contrast body type.
- Built the page from semantic sections with native anchor navigation; no client state, authentication, requests, calculations, or remote imagery were added.
- Made the mobile layout single-column where needed, kept touch targets generous, and disabled smooth scrolling when reduced motion is requested.
- Kept the public preview honest: the questionnaire and calculation module are explicitly described as not yet connected to this interface.
- Did not publish or deploy the project.

## Changed files

- `app/page.tsx` — new Russian landing page, safety explanation, four-step process, demo report preview, audience section, CTA, and medical disclaimer.
- `app/globals.css` — new responsive visual system for the public page.
- `app/layout.tsx` — Russian document language and NutriMind-specific title and description; removed starter preview metadata.
- `UI_PREVIEW_REPORT.md` — this implementation and verification record.

No calculation, safety, database, worker, API, specification, demo-data, dependency, or Vercel configuration files were changed.

## Demo-only content

Everything inside the report and dashboard previews is labeled **«Демонстрационный пример»** or described as demo-profile content. It uses only facts already present in:

- `data/demo-athlete-profile.json`: adult athlete, age 28, professional hockey, 5–6 sessions per week, performance/recovery goal, peanut allergy, and a post-training meal later than 90 minutes.
- `data/demo-report.json`: hard peanut exclusion, post-training meal priority, protein distribution priority, and the 14-day calibration window.

The preview does not display the demo energy or macro scenarios as a visitor result and does not implement or claim production calculation behavior. Demo observations are not recommendations to the visitor.

## Verification results

### `npm.cmd test`

- Exit code: `0`
- Result: `39 passed / 0 failed / 0 skipped` (the current suite contains 39 tests, although `AGENTS.md` still states an older expectation of 31).

### `npm.cmd run typecheck`

- Exit code: `0`
- Result: TypeScript completed with no diagnostics.

### `npx.cmd next build`

- Exit code: `0`
- Result: production build compiled successfully; `/` and `/_not-found` were generated as static content.

### `git diff --check`

- Exit code: `0`
- Result: no whitespace errors. Git emitted informational LF-to-CRLF working-copy warnings for the three edited app files.
