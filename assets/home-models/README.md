# Home model source package

This package contains the original metric apartment geometry, furniture manifests and a standalone Three.js viewer. It is the source package for the main application's V2 deployment assets.

## Open the standalone viewer

From the repository root:

```bash
python -m http.server 4174 --bind 127.0.0.1 --directory assets/home-models
```

Open [localhost:4174](http://localhost:4174/). Use HTTP rather than opening the HTML file directly. This historical modelling viewer retains its original Chinese interface labels; the submitted web application defaults to English and includes Chinese localisation.

Switch between the old home and three new-home arrangements. Drag to orbit, scroll to zoom and right-drag to pan. The viewer supports orthographic top views, wall cutaways, furniture selection, reuse highlighting, selected folding mechanisms, GLB downloads and PNG captures. `?layout=new-home-b&view=top` selects a scene; `capture=1` hides the interface.

## Package contents

| Path | Responsibility |
| --- | --- |
| `src/generate-home-models.mjs` | Deterministic geometry, materials, furniture and source layout generation. |
| `model-viewer.js`, `model-viewer.css` | Standalone model viewer behaviour and presentation. |
| `models/` | Original scenes, architectural shells and individual furniture GLBs. |
| `data/furniture.json` | Stable identifiers, estimated dimensions, origin and product mapping. |
| `data/layouts.json` | Source scene placements and retained/added furniture lists. |
| `previews/` | Perspective and top-view reference renders. |
| `references/` | Original illustrative plans used as modelling references. |
| `vendor/` | Local Three.js distribution and licence for the standalone viewer. |

The source scenes contain 18 original furniture groups and four initial additional product models. The live application applies its own current planning rules; source-viewer counts are not the specification for every interactive arrangement.

## Regeneration

```bash
node assets/home-models/src/generate-home-models.mjs
npm run build:refined-models
```

The first command uses the repository's installed Three.js dependency and writes source assets. The second requires Blender and refines selected runtime models. See [Blender refinement](../../docs/blender-refinement.md) before regenerating deployment files. Existing assets run without Blender.

Units are metres, with Y up. Floor-plan coordinates use X to the right and Z down; dimension arrays are width, depth and height. GLB node extras carry furniture IDs, origin, product slugs and selection flags. `foldAxis` and `foldAngle` identify movable hinges; `wall` and `upper` support cutaway views. Keep these identifiers stable.

## Source and runtime copies

`assets/home-models/models/` preserves original geometry. `public/models/v2/` holds runtime copies, including refined upholstery and baked occlusion. Some files intentionally match byte for byte; others differ. Both sets are retained so the standalone viewer, refinement pipeline and application remain reproducible within their documented dependencies.

## Modelling assumptions

The plans were interpreted using room positions, openings, outlines and common furniture dimensions. They are not a surveyed CAD reconstruction. The old-home room labels total 44 m². The new-home reference has room labels totalling 48 m² but a nominal title of approximately 45 m²; the application uses the nominal figure as contextual information.

Furniture is conceptual geometry, not supplier-certified CAD. The package does not certify construction dimensions, full door travel, ergonomics or accessibility. Real purchasing and delivery decisions require measured inputs and independent checks.
