# ReNest design system

ReNest helps people move the furniture they already own. The homepage is editorial; the demo is a calm spatial workspace. The supplied ReNest redesign brief is the design reference.

## Foundations

Tokens live in `app/globals.css`. Use semantic tokens for new work: `--background`, `--surface`, `--surface-subtle`, `--foreground`, `--foreground-muted`, `--border`, `--accent`, `--success`, `--warning`, and `--danger`. The original color names are aliases so existing routes inherit the same foundation.

Locally hosted Newsreader carries editorial headings; Geist Sans handles interface and body text; Geist Mono is reserved for measurements and compact technical labels. Font licenses live alongside the files in `app/fonts`.

Controls use a 5 px radius, imagery 6 px. Keep the interface editorial and clear. Spatial stages can be expressive: immersive camera moves, luminous topology and an illustrated Hong Kong journey demonstrate the product's work. Give each stage a distinct visual language, keep furniture and the actual plan central, and honor reduced-motion preferences.

## Surfaces

- `app/home.module.css`: photographic hero, furniture migration story, lifestyle, reuse benefit, final invitation.
- `components/studio/studio.module.css`: capture, selection, planning and results in the current moving studio.
- `components/studio/home-scene.tsx`: shared live 3D scene and orthographic floor plan, using the same furniture placements.
- `app/recommendations/recommendations.module.css`: product collection and recommendation presentation. The old shop URL redirects here.
- `components/common/modal.tsx`: Radix/shadcn dialog composition with ReNest styling, focus trapping, Escape handling, and semantic title.

## Asset continuity

The existing apartment and furniture photographs remain the shared asset set. `spatial-room.webp` is derived from the existing `layout-planning.webp`, with the cyan route treatment neutralized. `oak-floor.webp` uses a low-contrast crop of the existing apartment floor. No runtime image service is required.

Historical room photographs are illustrations. The current studio presents editable live geometry; optional Photo view uses the supplied offline Cycles renders and does not represent arbitrary manual edits.

## Interaction contract

Natural oak, warm chalk, linen, muted eucalyptus and graphite form the room palette. Live scenes share AgX tone mapping. Surface relief stays subtle at room distance; geometry stripes are hidden before batching. Normalize GLTF node names from underscores before applying detail rules. The homepage canvas remains transparent over the shared `--home-scene-background` token to avoid a visible seam.

Capture moves from a model overview to an eye-level acquisition, then returns. Points dominate acquisition; triangles follow; material surfaces only appear at the end. Reconstruction starts as a pure floor plan, then raises walls without an advance structure preview. Moving cuts from a focused loading scene to a geographically grounded Kowloon-to-Northern-Metropolis illustration, then returns to a separate unloading scene. Arrival assembles batched architectural topology while the lens descends into the furnished room; collision-checked room chapters continue in real 3D. Photo view offers exact-layout Cycles stills separately.

Use native multisample antialiasing and local baked AO for stable motion. Avoid stochastic full-screen shading, cap phone resolution and shadow budgets, and lower resolution after sustained slow frames. Pause background WebGL while maps or dialogs cover it; static scenes stop drawing until their image changes.

Inventory selection updates the inspector. Layout choices update placements, reuse counts, recommendation, and clearance together. Cost and reuse figures come from the current placements and demo catalogue. Geometry checks are basic footprint constraints, not a delivery-access or accessibility certification.

Save stores a versioned arrangement in the current browser. Past arrangements on the homepage restores saved work. Product choices update shared placements and the moving report. Resale preparation remains a local draft requiring manual publication.
