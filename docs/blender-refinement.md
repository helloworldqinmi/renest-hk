# Blender refinement for the live studio

The deployed V2 models use Blender-refined upholstery for F01 (sofa), F09 (double bed)
and F13 (single bed). The sofa keeps its clean silhouette without added piping;
relaxed upholstery and local contact shading add depth without bulky seams.
The original models under
`assets/home-models/models/` remain the source of truth for placement, dimensions,
architecture and interaction metadata.

## Rebuild

```sh
npm run build:refined-models
```

The command locates project-local portable Blender on Windows, common installations
on Windows and macOS, then `blender` on PATH. Set `BLENDER_BIN` to an absolute
executable path to use another installation. It uses six CPU threads, Cycles, a fixed
sampling seed and 1024px occlusion atlases, delivered as 512px PNGs for smaller downloads.
No model downloads or external addons are required.

1. Blender welds split vertices, relaxes and subdivides soft parts, preserving
   their bounding dimensions. Cushion piping follows the actual mesh surface.
2. Local ambient occlusion is baked into a separate UV1 atlas. UV0 remains
   available for the website's procedural wood and fabric surface maps. Lighting
   itself remains live: the bake does not fix the furniture to a room or time of day.
3. The Node pipeline copies the refined children into the original furniture
   roots of all four furnished scenes. It welds duplicate vertices and removes
   unused resources without flattening the hierarchy.
4. It validates exported/reloaded models before installing them under
   `public/models/v2/`. Checks cover selectable IDs, dimensions, root transforms,
   wall-cut metadata, fold pivots, AO UVs, bounding boxes and file-size budgets.
   The run writes the measured sizes to `docs/model-refinement-report.json`.

For iterating on the integration without rebaking, pass `--baked /absolute/path`
to `node scripts/refine-models.mjs`; that directory must contain the two bed exports. Intermediate files live in the OS temporary directory.

## Runtime

The homepage and studio keep their existing asset URLs, camera controls and
placement logic. The runtime 0.55-strength AO maps accompany moving furniture rather than
painting room shadows onto it. Millimetre-scale piping does not cast realtime
shadows, avoiding aliasing at mobile shadow-map resolutions. The site's material
palette still applies; tailored seams receive a subtle darker finish.

Texture cleanup includes the newly introduced AO textures. The first shadow map
is rendered before relying on manual shadow updates.

## Tradeoffs

Complete room downloads shrink through geometry deduplication, while individual
refined furniture assets grow because they contain additional geometry and an
embedded AO atlas. The actual size comparison is in `model-refinement-report.json`.
This is a focused refinement of a sofa and two beds, not a complete
photorealistic remodel. The original estimated footprint metadata is preserved;
Blender refinement does not make those measurements survey-accurate.
