# Product experience verification — 2026-10-08

The current implementation follows the latest accepted direction: a hidden-room
opening, increasing coloured samples, fine progressive mesh, a short furniture
identification transition, then solid interactive furniture. Earlier experiments with
a permanently meshed inventory or a steering cartoon truck are superseded.

| Requirement | Current implementation and inspected evidence |
| --- | --- |
| No old-room preview or premature fragments | First ready frame hides architecture, furniture and reconstruction effects; `phone-solid-front.png` shows only the opaque device. |
| Device does not clip through hidden room | Independent depth-preserving device scene, outside-room travel; `phone-solid-scanning.png` inspected. |
| Fixed scan start | Real drag changed camera from `[9.2,11.3,13.5]` to `[15.9979,5.6109,-10.158]`; Start restored the original exact pose. |
| Increasing point density | 260k desktop / 120k phone material-coloured samples, per-point smooth visibility; `coloured-cloud.png` inspected. |
| Dense progressive triangles | Precomputed world-scale subdivision, per-triangle ranks and antialiased edges; `coloured-mesh.png` inspected. No runtime geometry rebuilding. |
| Continuous colour and single-direction camera | Source colours persist from points through mesh fusion; shared camera azimuth, sofa-to-TV pan and monotonic orbit tested in `check:studio`. |
| Fast identification finish | Short recognition and surface fronts; `extraction-colour-complete.png` inspected at82%, all18 furniture groups identified. |
| Solid inventory with one-piece highlight | Runtime selection F01→F02, keep/leave and collection switching passed without errors; unified canvas/list hit testing. |
| Clear headings and reconstruction progress | Immediate headings, explicit dark/light contrast, native accessible4px progress track plus percentage; `reconstruction-progress-final.png` inspected. |
| Pure2D start | No advance roof/structure guide; supplied plan stays flat before walls rise. Paper is not tone-mapped grey. |
| Geographic moving sequence | OSM coastline, stored OSRM road geometry, stable route dot; `audit-map-overview.png` inspected. No runtime map request. |
| Cinematic map transitions | Departure street view pulls out to geography, destination pulls in; different loading/unloading angles and matching settled-result azimuth. Runtime opening scale0.021 and stationary final camera verified. |
| No route-hidden or SVG-unmount exceptions | Native capture transitions replaced by cancellable WAAPI entrance; background-tab navigation and complete map exit returned zero page errors. |
| Opaque closed entrance and mountain outlook | Live and24 offlinev35 views inspected; `audit-internal-jambs.png`, dining and bedroom Cycles images. |
| Stable interior door/window joinery |57 jamb/rail/sill elements corrected; no touching duplicate joinery or moving trim self-shadow. Runtime study camera inspected. |
| No early lights or artwork | Finished decorations hidden during topology reveal; `interior-wire-no-decor.png` inspected. |
| Original closing thanks | “Thank you for choosing ReNest.” restored; `audit-thanks-mobile.png` inspected at390×844 with no overflow. |
| Sharpness and performance | Pixel density never below1CSS pixel; frozen interior batches255 meshes into25 batches, current study49–55 total draws, observed60fps at2048×1152 on this machine. |
| Static/hidden rendering | Paused scan phases measured zero extra draws; hidden/canvas-offscreen/map-covered renderers pause. Default results do not continuously rotate or fold. |
| Responsive and reduced motion |390×844 home and tour fit checks, screenshots, no horizontal overflow; reduced-motion tour starts paused. |
| Asset and placement invariants | Blender output metadata/bounds validated;3 complete offline layout sets ×4 rooms ×2 light states, version35,1440px/64samples. Save/layout/collision tests passed. |

Screenshots and browser audit scripts are local under `output/playwright/` and
`output/audit-*.js`. They are ignored tooling artifacts, not shipped assets.
The frame-rate observations describe this Windows/Edge session, not a universal
hardware guarantee. The experience remains a labelled simulation based on local
apartment assets.
