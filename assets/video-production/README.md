# Video production source snapshot

`v1.11.1/` preserves the authored source files from the earlier film's local production workspace: scene composition, narration and word timings, captions, editorial decisions, rendering helpers and export scripts. These files were previously hidden by the blanket `output/` ignore rule.

This is a **source reference snapshot**, not a self-contained rendering package. It retains historical relative paths and comments so the production logic can be inspected without silently changing its provenance. The original workspace is `output/playwright/renest-video/v1.11.1-polish/`.

Rebuilding the historical cut requires that original workspace, including earlier-version clip libraries, source screenshots, generated audio, Python media dependencies and FFmpeg. The snapshot does not include those large inputs or downloaded executables. Do not run its export scripts from this directory expecting a complete render, and do not delete the local workspace solely because this snapshot exists.

For technical review, start with `edit-decisions.json`, `narration.json`, `captions.json` and `paragraphs.json`. The final v1.13 playable export and submission package are identified in [deliverables](../../deliverables/README.md). The v1.11.1 subtitles and production record remain available as earlier reference material. The application build has no dependency on this production snapshot.
