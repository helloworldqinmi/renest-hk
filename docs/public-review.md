# Public repository review

Review date: **13 October 2026**. Baseline: `38ae11e`. This record covers the public repository, reviewer documentation, dependency hygiene, delivery integrity and a targeted browser walkthrough. It is not a production security certification or exhaustive device-compatibility test.

## Changes prepared

- Added a GitHub Actions workflow for a clean npm installation, type/planning/delivery checks, runtime dependency audit and production build. Actions are pinned to commit hashes and use read-only repository permissions.
- Standardised the recommended review environment on Node.js 24 through `.nvmrc`.
- Updated Next.js from 16.3.6 to 16.3.8, sharp from 0.35.4 to 0.35.5, and source-map-js from 1.2.1 to 1.2.2. The lockfile records exact resolutions; Next.js stays on the 16.3 patch line.
- Removed the unused legacy demo context provider from the root layout. No pages consumed its context; current studio saves use separate, versioned storage. Existing browser data is not deleted.
- Stopped tracking the generated `next-env.d.ts`, following the installed Next.js guide. Type generation recreates it for local development and CI.
- Aligned search/share descriptions with the actual bundled-apartment prototype, and added a reviewer walkthrough and complete clone instructions.
- Corrected singular furniture counts in English (for example, `1 piece`), including purchase and resale summaries.

## Verification evidence

| Area | Result |
| --- | --- |
| Public access | Repository and live demo opened without signing in. Canonical repository name is `helloworldqinmi/renest-hk`. |
| TypeScript and planning | `npm run check` passed, including save compatibility, geometry, planning, interior and film-motion checks. |
| Deliverables | All 10 registered artifacts passed size and SHA-256 checks; delivery files remain eligible for Git tracking. |
| Production build | `npm run build` passed with Next.js 16.3.8 and generated all 30 static pages. |
| Clean installation | A separate local Git clone with the staged review patch passed `npm ci`, `npm run check` and `npm run build` on Windows / Node.js 24.13.0. The final singular-count copy change was subsequently rebuilt in the main checkout. Linux CI has not run until this commit is pushed. |
| Hosted walkthrough | Old-home capture, 18-piece inventory, example floor-plan reconstruction, arrangement generation, floor-plan selection and collision feedback, moving report, CSV download, named save and homepage restoration completed. No browser console errors were recorded during that walkthrough. |
| Updated local runtime | Production server started on Next.js 16.3.8. Homepage, About page, quick brief, 3D arrangement and named save worked after removing the unused provider. Corrected `1 piece` copy was visible; no browser console errors were recorded. The current flow uses bundled models and browser storage, with no application API or external data service to configure. |
| Filenames | Printable-ASCII filename check passed. |
| Documentation | Relative file links in current Markdown documentation were checked; historical archive documents were excluded. |
| Credential patterns | Scanned 661 text blobs below 1 MB across all locally reachable Git refs. No matches for the selected private-key, provider-token and credential-assignment patterns; no matching credential filenames. This does not rule out arbitrary secrets or sensitive content inside media. |

The hosted walkthrough checks the deployed baseline. Dependency and source changes in this review require pushing and redeployment before they are reflected in that hosted version.

The downloaded layout-A CSV contained the furniture identifiers, metric dimensions, move decisions and placement columns shown in the report. A 1265-pixel desktop viewport was used for visual inspection. The browser's attempted narrow-screen override did not take effect, so mobile responsiveness is not claimed as verified here.

## Dependency follow-up

The runtime-only npm audit reported **0 advisories** after patching. The full audit still reported **8 affected development packages: 6 high and 2 moderate**, stemming from two dependency families. These are package counts, not eight distinct flaws.

| Dependency family | Review decision |
| --- | --- |
| `braces` through build/model tooling | The [reviewed advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists no patched version. Track the upstream fix; do not downgrade the model toolchain merely to silence npm's suggested major-version resolution. |
| `postcss-selector-parser` through Tailwind CSS 3 and PostCSS Nested | The [reviewed advisory](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) identifies the selector-parser issue. Resolving the installed dependency ranges requires a separately validated toolchain migration; do not force an unsupported override immediately before evaluation. |

These tools process repository-controlled source and asset inputs in the current workflow. Do not treat the absence of runtime audit findings as proof that development dependencies are risk-free. Re-run `npm audit` before extending the build pipeline to untrusted input. The CI runtime audit fails on high or critical findings; the full development audit remains a documented follow-up.

## Remaining repository settings and ownership decisions

The public GitHub **About** panel still showed the old `hackathon-topaz-seven-69.vercel.app` address and no description during review. Suggested settings:

- **Description:** `Furniture reuse and spatial planning for compact Hong Kong homes. Interactive 3D layouts, moving plans and reuse decisions.`
- **Website:** `https://renest-hk.vercel.app/`
- **Topics:** `spatial-planning`, `furniture-reuse`, `threejs`, `nextjs`, `hong-kong`, `hackathon`.

These are GitHub repository settings, not files controlled by this commit. After pushing, confirm the new verification workflow and deployment succeed, then repeat the short [review walkthrough](review-guide.md) on the public URL.

No project-wide licence has been selected. Existing third-party notices are preserved; no new redistribution licence is assigned by this review. Project owners should settle code and media licensing before offering broader reuse. Team attribution and contact details are intentionally omitted.

A tagged evaluation release can freeze the exact reviewed revision once the final public checks pass. No release, tag, repository setting or deployment is published by this local review commit.
