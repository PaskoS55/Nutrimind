# NutriMind design restoration and home page

## Final route structure

- `/` — public NutriMind home page.
- `/questionnaire` — the restored local-state nine-section questionnaire.
- `/report-demo` — the restored demonstration report.

The questionnaire was moved from `app/page.tsx` to `app/questionnaire/page.tsx` without redesigning its interface or changing its nine sections, local answer state, demo-athlete population action, safety notices, responsive layout, or completion link to the demo report.

## Home-page sections

The public home page includes the approved horizontal NutriMind SVG logo, anchored product navigation, hero and restrained interface preview, brand statement, four-step process, safety boundaries, audience groups, links to the questionnaire and report previews, a final call to action, and a medical-disclaimer footer.

Its visual language follows the restored product: near-black canvas, warm off-white type, muted sage accents, fine borders, editorial heading scale, generous spacing, and no gradients or stock photography.

## Navigation changes

- Home-page “Начать анализ” actions link to `/questionnaire`.
- Home-page demo-report actions link to `/report-demo`.
- The questionnaire and report logo links return to `/` through Next.js navigation.
- Questionnaire completion links to `/report-demo`.
- Report “Изменить ответы” links to `/questionnaire`.

## Demo-only boundaries and safety

The home-page preview is explicitly described as an interface demonstration and performs no calculation. Report previews and values are labelled as demonstration-only and are not recommendations for a real person.

The page states that allergies are hard exclusions before product ranking; celiac disease requires strict gluten-free handling; NutriMind does not diagnose or confirm deficiencies without numeric laboratory results; minors receive no numeric KBJU; and the medical gateway may require specialist review.

No authentication, API request, nutrition calculation, production recommendation generation, or deployment was added.

## Changed files

- `app/page.tsx` — new public home page.
- `app/questionnaire/page.tsx` — moved questionnaire (created at the new route).
- `app/report-demo/page.tsx` — corrected questionnaire navigation.
- `app/components/Brand.tsx` — clarified the existing home-linked brand label.
- `app/globals.css` — scoped responsive home-page styles added; restored questionnaire/report styles preserved.
- `DESIGN_RESTORATION_REPORT.md` — route, content, boundary, file, and verification documentation updated.

No calculation, safety-contract, specification, database, API, worker, demo JSON, dependency, or deployment configuration file was changed.

## Verification

- `npm.cmd test` — exit code 0; 39 passed, 0 failed, 0 skipped.
- `npm.cmd run typecheck` — exit code 0; TypeScript completed with no diagnostics.
- `npx.cmd next build` — exit code 0; production build compiled successfully and statically prerendered `/`, `/questionnaire`, and `/report-demo`.
- `git diff --check` — exit code 0; no whitespace errors (only informational LF-to-CRLF working-copy warnings).
