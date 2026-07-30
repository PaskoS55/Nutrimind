# NutriMind unified design system

## Visual sources

The unified frontend was compared against all five supplied sources:

1. Original dark home page — hero composition, compact navigation, in-hero lockup, two-column balance and analysis preview.
2. Original compact questionnaire — input/control proportions, restrained content width, field rhythm and action placement.
3. Original demonstration report — report hierarchy, tag alignment, safety strip, tabs, summary and metric proportions.
4. Original nine-section questionnaire — header, progress line, grouped options, selected state and safety panel.
5. Approved NutriMind brand board — flowing A–M–leaf symbol, wordmark, byline, warm off-white and sage palette.

The unrelated light interface was not used.

## Visual inconsistency audit

Before this pass, the home page used a later oversized editorial composition, a questionnaire-style preview, a separate large-logo header and different section/card rhythms. The questionnaire retained a desktop step rail absent from the supplied product screen, and its account-like exit control was not truthful. The report was closest to the source but its tab interaction did not support arrow-key navigation. Header proportions, containers, radii, spacing and responsive breakpoints were not fully shared.

## Global tokens

`app/globals.css` now defines shared variables for:

- near-black page background (`--nm-page`);
- two elevated surfaces (`--nm-elevated`, `--nm-elevated-2`);
- primary, secondary and muted text;
- sage accent and sage selected surface;
- normal and strong borders;
- shared container width and header height;
- small, medium and large radii;
- three responsive title scales;
- shared section spacing.

All routes use these tokens, the same focus outline, header height, logo proportions, button geometry, eyebrow treatment, borders and breakpoints.

## Shared components

- `Brand` renders the approved local A–M–leaf SVG with the NutriMind wordmark and `by Pasko` label, linked to `/`.
- `ProductHeader` supplies the shared header shell for the home page, questionnaire and demonstration report while allowing route-specific actions.

No full brand-board raster, remote image, metallic effect, glow or unrelated logo is used.

## Page changes

### `/`

The hero now follows the original composition: compact shared navigation, visible in-hero brand lockup, specified eyebrow and headline, sage-highlighted “вас.”, original CTA language, three trust statements and a right-side analysis preview. The preview is explicitly demonstration-only and uses only existing demo ranges: energy `3550–4050`, protein `155–172` and beverage intake `1.5–2.0`. The circular visualization is qualitative and contains no invented score.

Lower approach, process, safety, audience and CTA sections use restrained rules and lists instead of generic bright marketing cards.

### `/questionnaire`

The approved nine-section data and local-state behavior remain unchanged. The page now uses the shared header, reference-aligned central width, progress line, grouped dark options, visible radio/check markers, sage selection state and contextual safety panel. The misleading account-style action was replaced with truthful Next.js navigation to the home page.

### `/report-demo`

The report retains the supplied hierarchy and existing demo data: compact header, report eyebrow and heading, athlete tags, safety strip, tabs, summary, demo metrics, priorities and rationale labels. Tabs now support Left/Right, Home and End keys in addition to pointer activation.

## Demonstration-only boundary

No page performs nutrition calculations or sends API requests. Home-preview and report values are identified as belonging only to the existing fictional demonstration profile. They are not recommendations for the visitor or medical conclusions. No authentication or fake user account was added.

## Accessibility

- Visible keyboard focus uses the shared sage outline.
- Questionnaire options expose radio roles and `aria-checked` states, with check/radio characters in addition to color.
- Report tabs expose tab roles, selected state and roving `tabIndex`; arrow, Home and End navigation was verified.
- Logo links have descriptive accessible names.
- Mobile controls retain usable sizes and layouts.

## Responsive QA

Rendered QA covered `1920×1080`, `1440×900`, `1024px`, `768px` and `390px` across `/`, `/questionnaire` and `/report-demo`.

- Desktop keeps the home hero within the first viewport and preserves the wide two-column composition.
- Tablet stacks the home preview and report hero only when needed while retaining hierarchy.
- Mobile renders text before previews, uses full-width primary actions, keeps questionnaire controls legible and exposes horizontally scrollable report tabs.
- At every checked route and width, document `scrollWidth` equalled `clientWidth`; no page-level horizontal overflow was found.

## Remaining differences from references

- The home status ring is qualitative rather than the screenshot’s numeric score because that score is not present in the approved demo JSON.
- The approved questionnaire remains nine sections and preserves its current question content; the compact five-step screenshot is used only for visual form language.
- Browser-native scrollbar appearance varies by platform.

## Changed files

- `app/page.tsx`
- `app/questionnaire/page.tsx`
- `app/report-demo/page.tsx`
- `app/components/ProductHeader.tsx`
- `app/globals.css`
- `DESIGN_SYSTEM_REPORT.md`

`app/components/Brand.tsx` was audited and reused without further change in this pass.

## Verification

- `npm.cmd test` — exit code 0; 39 passed, 0 failed, 0 skipped.
- `npm.cmd run typecheck` — exit code 0; no TypeScript diagnostics.
- `npx.cmd next build` — exit code 0; production compilation succeeded and `/`, `/questionnaire`, and `/report-demo` were statically prerendered.
- `git diff --check` — exit code 0; no whitespace errors (informational LF-to-CRLF working-copy warnings only).
- Browser QA — all 15 route/viewport combinations had no page-level horizontal overflow; report arrow-key navigation advanced the selected tab; browser console contained no errors.

## Final visual polish

This final pass preserved the approved dark tokens, A–M–leaf identity, interface copy, routes, questionnaire behavior and demonstration values. The changes were limited to layout, spacing and secondary-text contrast in `app/globals.css`.

### Home page

- The shared header now uses a non-wrapping flex layout with a fixed action group and responsive horizontal padding. The “Начать анализ” control remained fully inside the viewport at every requested size; its measured right edge left 64 px at 1920, 58 px at 1440, 41 px at 1024, and 18 px at both 768 and 390 CSS pixels (accounting for the browser scrollbar where present).
- The analysis preview is 6% narrower on the wide two-column layout and aligned to the right edge of its grid area. Secondary preview labels, explanation text, safety text and demo-boundary text use a slightly brighter neutral while remaining below primary text.
- Hero vertical padding and the trust-row offset were reduced. At 1440×900 the trust row ended at 784 px, so all three statements remained visible in the first viewport.

### Questionnaire

- The desktop question title scale was reduced from a 62 px maximum to 57 px (about 8%). Mobile sizing remains unchanged.
- Option notes, safety-panel copy and the disabled back control have higher contrast. The disabled state retains reduced opacity and a not-allowed cursor while remaining readable.
- The introduction-to-options, options-to-safety, and safety-to-navigation gaps were tightened without changing fieldset, option, button, selection or focus behavior.
- The current nine-step UI contains option controls and no text inputs (`0` inputs/textarea elements at every checked step). Existing option fields retain the approved 82 px minimum height, shared border treatment, 8 px grid gap and legend hierarchy; no new field type or questionnaire logic was introduced.

### Demonstration report

- The space below the shared header was reduced from 68 px to 54 px (about 20.6%), and the report heading maximum was reduced from 62 px to 57 px while preserving its explicit two-line desktop composition.
- The athlete-tag column is closer to the introduction, and tags remain aligned with the hero baseline. Tag text, safety-filter details, metric labels and supporting explanations have increased contrast.
- The safety-strip top gap, strip-to-tabs gap and tabs-to-card gap were reduced. At 1440×900 the first report cards began at 558 px and were visibly present in the initial viewport.

### Final QA and verification results

- Responsive browser QA: `1920×1080`, `1440×900`, `1024×768`, `768×1024`, and `390×844` on `/`, `/questionnaire`, and `/report-demo` (15 combinations). In every case `scrollWidth === clientWidth`; no horizontal overflow was detected.
- `npm.cmd test` — exit code 0; 39 passed, 0 failed, 0 skipped.
- `npm.cmd run typecheck` — exit code 0; no TypeScript diagnostics.
- `npx.cmd next build` — exit code 0; compiled successfully and statically prerendered `/`, `/questionnaire`, and `/report-demo`.
- `git diff --check` — exit code 0; no whitespace errors. Git emitted informational LF-to-CRLF working-copy warnings for existing tracked files.
- Source review confirmed that no questionnaire content/order/branches/local state, report data, calculations, safety rules, routes, API, database, worker, Vercel configuration or demo JSON changed in this pass.
