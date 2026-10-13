# Repository naming conventions

Use names that describe a file's responsibility and make related files easy to find. The repository uses English, printable-ASCII paths. Application translations and historical source text may remain multilingual.

## Source files

| Category | Convention | Example |
| --- | --- | --- |
| TypeScript and React modules | Lowercase `kebab-case`; use the feature or responsibility. | `locale-provider.tsx`, `motion-tokens.ts` |
| Component styles | Match the component stem when the styles belong to one feature. | `reimagine-panel.tsx` and `reimagine-panel.module.css` |
| Shared UI | Name a collection of basic controls explicitly. | `ui-primitives.tsx` |
| Hooks | Prefix with `use-`. | `use-studio-history.ts` |
| Domain types | Name the domain rather than using an unexplained root barrel. | `types/demo-planning.ts` |
| JavaScript build tools | Use a verb and the generated resource. | `generate-home-models.mjs`, `generate-plan-previews.cjs` |
| Python modules | Use conventional `snake_case` so imports remain natural. | `interior_surfaces.py` |
| Reports and manifests | State the artifact's role; distinguish outputs from configuration. | `model-refinement-report.json`, `manifest.json` |
| Documentation | Topic-based `kebab-case`, except conventional entry files. | `product-scope.md`, `README.md` |

Keep `.ts`, `.tsx`, `.mjs` and `.cjs` aligned with the actual parser/module system. Do not rename extensions for visual consistency. Shared style sheets such as `studio.module.css` may use the feature name when several components consume them.

## Changes applied in the naming review

| Previous path | Current path | Reason |
| --- | --- | --- |
| `components/state-provider.tsx` | Renamed, then removed in the public review | The follow-up usage audit found no consumers of its legacy context. Current studio persistence is independent. |
| `components/common/ui.tsx` | `components/common/ui-primitives.tsx` | Describes the shared buttons, labels, metrics and modal export. |
| `types/index.ts` | `types/demo-planning.ts` | Names the reference planning model explicitly; current studio types remain in `lib/studio-data.ts`. |
| `lib/motion.ts` | `lib/motion-tokens.ts` | Identifies shared timing and easing constants. |
| `components/studio/decision.module.css` | `components/studio/plan-decision.module.css` | Gives the shared decision/report styles their planning context. |
| `components/studio/reimagine.module.css` | `components/studio/reimagine-panel.module.css` | Matches the consuming component. |
| `assets/home-models/src/generate.mjs` | `assets/home-models/src/generate-home-models.mjs` | Makes the generation target clear in searches and commands. |
| `assets/home-models/viewer.js` | `assets/home-models/model-viewer.js` | Pairs the standalone viewer script with its stylesheet. |
| `assets/home-models/style.css` | `assets/home-models/model-viewer.css` | Identifies the styled interface. |
| `docs/model-refinement.json` | `docs/model-refinement-report.json` | Identifies the generated measurement report. |

Imports, CSS references, viewer HTML, generation/check scripts and current documentation were updated together. These changes do not change exported symbols, application behaviour or stored data.

## Names intentionally retained

- **Framework and tool entry points:** `page.tsx`, `layout.tsx`, `template.tsx`, `next-env.d.ts`, `AGENTS.md`, `CLAUDE.md` and standard configuration filenames.
- **Public routes:** `/demo`, `/store/[slug]` and the existing redirect routes. Route-directory renames would change bookmarks and links.
- **Stable model identities:** `F01`–`F18`, `N01`–`N04`, layout keys `a`/`b`/`c` and `public/models/v2/`. These names participate in manifests, dynamic asset lookup and saved-plan compatibility.
- **Third-party distribution and licence files:** preserve upstream names and attribution.
- **Delivery revisions:** `v1.11.1` identifies an actual film revision. It is not a temporary working suffix.
- **Historical video source:** preserve source-snapshot filenames and dependency references. That directory is a production record, not the current application module structure.
- **Published photos and render frames:** preserve existing public URLs. Any later reorganisation must update dynamic lookup, render manifests and generation scripts together.

## New assets and future work

Use semantic subjects and roles, such as `<product>-product.png`, `<product>-lifestyle.png` or `<layout>-<room>-<lighting>.jpg`. Sequential presentation clips use `01-<feature>.mp4`. Versioned delivery media use `<project>-<purpose>-v<revision>-<format>.<extension>`.

Avoid names such as `final-final`, `new-copy`, `test2` or a bare `utils` module with unrelated responsibilities. Existing legacy photo names containing `final-` describe a completed-room illustration; they do not select the submission's latest revision. The delivery manifest identifies the selected submission assets.

Before a rename, inspect static imports, dynamic URL construction, generation outputs, manifests, tests and documentation. Run `npm run check`; use a production build when application paths change. Update delivery metadata if an actual delivery path changes.
