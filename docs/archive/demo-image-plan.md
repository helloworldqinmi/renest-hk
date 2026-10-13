# ReNest HK Demo Image Plan

The demo should use static, pre-generated assets only. Geometry and furniture decisions stay code-native; images communicate context and visualize a plan after it has passed geometry checks.

## Reuse Now

| Demo moment | Asset | Status | Notes |
| --- | --- | --- | --- |
| Landing migration story | `public/photos/hero-migration.webp` | Reuse | Clearly shows old home, extracted furniture, and empty new home in one frame. |
| Current-home scan | `public/photos/old-home.webp` | Reuse | Strong lived-in Hong Kong context with the furniture visible in situ. |
| Empty new home | `public/photos/empty-new-home.webp` | Reuse | Establishes the smaller apartment before any planning result. |
| Reuse & Relax result | `public/photos/final-reuse-relax.png` | Final | Reuse-first layout balancing the lounge, light work and casual dining. |
| Work From Home result | `public/photos/final-work-from-home.png` | Final | Desk-first layout with the full work zone placed at the brightest window. |
| Host & Dine result | `public/photos/final-host-and-dine.png` | Final | Four-seat dining layout that deliberately trades open floor area for hosting. |
| Verified compact table | `public/photos/recommend-folding-table.webp` | Reuse | Correct product category and visually consistent with the apartment. |

## Independent Furniture Model Outputs

These assets are presented as detected, separated objects. They should remain selectable and linked to dimensions and fit status.

| Object | Asset | Current interaction |
| --- | --- | --- |
| Sofa | `public/photos/furniture-sofa.webp` | Inventory selection and fit-test queue |
| Dining table | `public/photos/furniture-dining-table.webp` | Inventory selection, conflict inspection, and replacement trigger |
| Coffee table | `public/photos/furniture-coffee-table.webp` | Inventory selection and fit-test queue |
| Bookshelf | `public/photos/furniture-bookshelf.webp` | Inventory selection and fit-test queue |
| Cabinet | `public/photos/furniture-cabinet.webp` | Used for the wardrobe/storage object |
| Desk chair | `public/photos/furniture-chair.webp` | Used to represent the detected work zone |
| Floor lamp | `public/photos/furniture-floor-lamp.webp` | Available for an expanded model-output tray |

## Generated Matched Set

The three generated results preserve the architecture, windows, mountain/city view, materials, daylight and camera position of `empty-new-home.webp`. They are mapped to the lifestyle goals their visible furniture arrangements actually communicate rather than being forced into the original labels.

- `Reuse & Relax`: densest reuse result, retaining the sofa, coffee table, work corner, vertical storage and compact dining surface.
- `Work From Home`: the desk, monitor and ergonomic chair claim the brightest window zone; dining folds away after use.
- `Host & Dine`: the main-room desk and coffee table leave the plan so a verified four-seat dining zone can take priority.

## Optional Product Assets

The existing folding-table image is sufficient for the demo. If each objective later needs a distinct product recommendation, generate matching catalog images for a slim wall-adjacent folding table and a dual-purpose work/dining table. Keep the same oak tone, daylight, apartment material palette, and plain photographic treatment as `recommend-folding-table.webp`.
