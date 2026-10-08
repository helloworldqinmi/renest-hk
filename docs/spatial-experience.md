# Spatial experience

Each stage has its own visual language. Capture acquires points, creates triangles,
then reveals surfaces. The opening shows only the scanning device. Acquired samples appear behind the
sensor, with no unscanned furniture creases or completed-room preview. An 18-second
sequence gives acquisition, triangle construction and material reveal separate
reading time. The lens translates at eye level, then orbits the reconstructed room. Projection matrices are blended
with matched scale so switching camera types does not snap the image.

Plan reconstruction starts with the supplied flat plan. No floating roof outline or
vertical structure preview appears before walls rise. Moving uses three shots: loading
at the old home, a Hong Kong journey, and unloading at the new home. The map fades over
the camera cut; covered WebGL rendering pauses during the drive.

Arrival assembles batched topology above the exact arrangement, then descends into
the room. Individual chapters have level cameras and collision-checked paths. Live
day/evening lighting interpolates smoothly. Matching Cycles stills are available through
Photo view; a manually edited arrangement always uses the live scene.

## Geography and assets

The illustrated map uses simplified real Hong Kong land polygons from
[bmkor/hk_osm_map](https://github.com/bmkor/hk_osm_map), derived from OpenStreetMap.
The software/data extraction license is preserved in `hong-kong-map-MIT-LICENSE.txt`.
OpenStreetMap data is credited in the map with a link to its ODbL attribution page.
Rebuild with `node scripts/generate-migration-map.cjs`, or pass a local GeoJSON path.
The SVG geometry is bundled locally, without an online map service.

The OSRM road geometry follows Kowloon, the Lion Rock/Sha Tin corridor, Tai Po and
the North District toward Kwu Tung North. The demo does not specify a real street
address, so this journey does not claim turn-by-turn navigation. Northern Metropolis
location reference: [official regional map](https://www.nm.gov.hk/en/map).

## Stability and budgets

Native multisample antialiasing replaces stochastic screen-space AO. Local 512px AO
atlases travel with refined upholstery. High-frequency decorative stripes are hidden
before batching, and GLTF underscores are normalized for semantic mesh rules. Small
seams, leaves and glazing do not cast flickering realtime shadows. Texture relief and
repeats remain low at room distance.

Desktop motion targets 60 Hz; phone rendering caps at 30 Hz and 1.25 pixel density, with a one-pixel-per-CSS-pixel sharpness floor.
The pixel budget reduces density after sustained slow frames, without repeatedly
raising and lowering it during a shot. Static views skip draws, shadow maps update
only when their image changes, and hidden/covered canvases pause.

Blender lives in the ignored project-local `output/tools/` directory. Furniture rebuild:
`npm run build:refined-models`. Interior renders: `npm run render:interior -- --samples 64
--width 1440 --skip-existing`. Windows uses OptiX/CUDA when available; other platforms
can use Metal/HIP or CPU. Model metadata and dimensions are verified before delivery.

The map now follows the actual road geometry with a simple position dot, without vehicle steering or bobbing. The reconstruction progress uses a native accessible progress element styled as a 4px track with a numeric percentage. Framebuffer size is limited by actual pixel count as well as pixel density, including large high-DPI displays.

Offline Photo view render version 35 matches the live entrance geometry (closed oak door, distinct frame and threshold) and mountain-only window scenery. Original entrance jambs and threshold are hidden before adding the replacement, preventing overlapping joinery. All three curated arrangements have four day/evening room pairs at 1440px, rendered with 64 Cycles samples. Photo view remains a still image; the default tour uses live 3D camera movement.

Dense triangle reconstruction is precomputed in `capture-mesh.ts`. Per-triangle rank and smooth shader coverage increase density without rebuilding geometry each frame. Silver-blue antialiased edges blend toward source material colours before the final surface pass. Paused acquisition and maps stop drawing.

Route entry uses a short Web Animations entrance, skipped in hidden documents and reduced-motion mode. Native view-transition capture was removed to prevent recoverable hidden-document errors.

The closing scan emphasizes movable furniture with deeper warm-neutral mesh lines during the animation, then returns to normal materials for the interactive inventory. Single-item selection lifts and highlights the chosen piece. The capture-to-overview camera shares one angular direction, pans from sofa toward TV and stops without reversing. Every new scan resets its initial camera pose; stage titles and contrast update immediately.
