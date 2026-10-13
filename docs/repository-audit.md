# Repository readiness audit

Audit date: **13 October 2026**. Scope: local repository structure, delivery materials, ignore rules, redundant code and review documentation. This is a packaging and maintainability review, not a claim of production certification.

## Baseline

The starting Git worktree was clean and contained **353 tracked files**, approximately **156.18 MiB** in the current checkout, excluding Git history and ignored files. Application code, source models, Chinese-named presentation clips and design notes shared the repository root. The entire `output/` tree was ignored, including the selected full-length film.

The largest ignored groups were approximately 6,785 MiB under `output/playwright/` and 1,277 MiB under `output/tools/`. These contain multiple film revisions, intermediate media, screenshots and downloaded tooling. They were not bulk-added or bulk-deleted.

## Applied structure and naming changes

| Previous location | Current location | Reason |
| --- | --- | --- |
| Root-level versioned home-model directory | `assets/home-models/` | Name the source package by responsibility; retain `public/models/v2/` for runtime compatibility. |
| Root-level Chinese-named presentation directory | `deliverables/presentation-clips/` | English, ordered filenames and a presentation-specific entry point. |
| Selected film under ignored production output | `deliverables/demo-film/` | Make the accepted film, subtitles and evidence visible to Git. |
| Selected production scripts under ignored output | `assets/video-production/v1.11.1/` | Preserve authored source for inspection with explicit dependency limitations. |
| `DESIGN_SYSTEM.md` | `docs/design-system.md` | Consolidate current design guidance. |
| `DEMO_IMAGE_PLAN.md` | `docs/archive/demo-image-plan.md` | Mark superseded asset planning as historical. |
| `docs/living-onboarding-proposal.md` | `docs/archive/living-onboarding-proposal.md` | Preserve the original proposal as an English historical record. |

Model imports, source references, refinement scripts and studio checks were updated to the new path. The root README now provides an English review route, local setup, verification commands, architecture links and explicit implementation boundaries.

### Naming convention

The subsequent [global naming review](naming-conventions.md) records ten responsibility-based renames and the full conventions for new files. Historical paths in audit tables identify the state at the time of each change.

- Use descriptive English `kebab-case` for new directories, documents and presentation files.
- Preserve framework conventions such as `page.tsx`, `layout.tsx`, `README.md` and `AGENTS.md`.
- Retain established Python `snake_case`, licence filenames, stable furniture IDs and public URL paths.
- Put the revision in versioned media or source-snapshot names, not in general application directory names. Avoid `final-final`, `new-copy` and unnamed numbered exports.
- Repository filenames use printable ASCII. Application translation content remains multilingual; historical production comments and the standalone model viewer retain their original language where relevant.

## Redundancy decisions

An import-graph review, direct reference search and subsequent TypeScript/build compilation identified **17 obsolete files**, approximately **184.95 KiB**, which were removed:

- Retired `components/demo/` implementation and its three stylesheet pairs.
- Retired `components/floor-plan/`, `components/planning/` and `components/scanning/` implementations and associated styles.
- Unused `lib/geometry.ts`, `lib/interactive-demo.ts` and `lib/migration-heading.ts`.
- Unused `app/shop/shop.module.css`; the shop route redirects to the current collection.

The canonical `components/studio/` implementation and legacy redirect routes remain. Removed tracked content is recoverable from Git history. Empty local exploration/tool directories were removed without deleting their contents recursively.

The baseline hash audit found **31 exact duplicate groups**, representing approximately **8.25 MiB** of additional copies. Most are furniture assets, model previews and modelling references shared by source and runtime packages. The remaining cases include independent icon copies and separate redirect route files. These are intentionally retained: identical bytes do not imply identical ownership or lifecycle.

The RoomPlan reference adapter, older scan-model generation pipeline and checked film-motion helper were also retained. They are documented support material, even when not reachable from an application page. Legacy photos and older public models are candidates for a separate asset-usage review; string searches alone are insufficient to establish that every dynamically selected resource is unused.

## Git ignore decisions

| Material | Decision |
| --- | --- |
| Selected full film, English subtitles and production verification | Promote into `deliverables/demo-film/`; keep original local copies. |
| Five presentation clips | Retain in Git under English delivery paths; media bytes unchanged. |
| Clip edit decisions and verification | Promote with English filenames and descriptions. |
| Final film's authored scripts, captions, narration and timing data | Preserve in `assets/video-production/`; document external media dependencies. |
| `node_modules/`, `.next/`, `out/`, TypeScript cache | Continue ignoring reproducible dependencies and build output. |
| `.playwright-cli/`, `output/` | Continue ignoring local sessions, raw recordings, historical renders and downloaded tools. |
| Python cache, `.venv/`, `.vercel/` | Ignore local runtime and deployment metadata. |
| `.env*` | Continue ignoring local configuration; `.env.example` remains eligible for tracking. |
| Font, map and bundled Three.js licences | Retain and index in the third-party notices. |

The final film is **77,730,588 bytes** (approximately **74.13 MiB**); the five clips total **40,983,245 bytes** (approximately **39.08 MiB**). They are kept as ordinary repository binaries for a directly available review package. Their hashes are recorded in `deliverables/manifest.json`. Repeatedly replacing large binaries will grow Git history; reconsider release hosting or a managed large-file workflow if this becomes a long-running project.

The source snapshot is not a complete film rebuild backup. Original raw material, generated speech, older clip libraries and local tools remain under `output/`; preserve or separately back up that workspace before any disk cleanup. One-off mutation scripts and old build logs were not promoted.

## Verification and delivery status

`npm run check` combines Next.js route-type generation, TypeScript, the existing studio/joinery checks and delivery integrity validation. `npm run check:delivery` checks all 10 registered artifacts, their SHA-256 hashes and byte counts, ignore status, and ASCII repository filenames. The film is additionally matched against its original production checksum.

The obsolete `next lint` command was removed; it is unsupported in the installed Next.js version. Type checking is not presented as linting. The TypeScript configuration now excludes local output and the historical video-source snapshot.

Verification completed during this audit:

| Check | Result |
| --- | --- |
| Next.js route types and TypeScript | Passed. |
| Existing studio and interior-joinery checks | Passed. |
| Delivery checksums, Git visibility and ASCII paths | Passed for all 10 registered artifacts. |
| Production build with `npm run build -- --webpack` | Passed; all 30 static pages generated. |
| Model/resource/clip migration integrity | 58 moved files matched the original bytes. |
| Local Markdown links | No broken file links found. |
| Git whitespace validation | Passed. |

No new visual browser review or media re-encoding was performed for this structural cleanup. The application rendering code was not redesigned, and the original production media evidence is preserved separately.

The reorganisation includes the selected delivery files alongside the source and documentation changes. A repository commit preserves this package; pushing a branch, publishing a release and deploying the website are separate operations.
