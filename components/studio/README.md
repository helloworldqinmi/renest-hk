# ReNest Moving Studio

The homepage starts the complete capture flow at `/demo?step=old`, beginning with the old home. `/demo?step=quick` remains an optional direct link for three choices with a live preset preview. Quick planning also opens by default in the preferences phase; users can opt into `living-onboarding.tsx` for the full questionnaire. Quick defaults do not mark detailed sections as confirmed. Moving between quick and detailed planning retains answers. Explicit `/demo?step=preferences` visits restore the in-session brief; explicit `step=quick` starts a fresh example.

Results use `plan-insights.ts` for actual placement counts, purchase cost, staged pieces and checks. `plan-decision.tsx` exposes reasons and trade-offs; `plan-comparison.tsx` compares all three current arrangements in a table. Change needs previews additions/removals/moves and cost differences before replacing the three presets; a one-step undo restores the previous brief and all layout edits. This remains deterministic preset planning, not unconstrained AI generation.

`move-report.tsx` renders a localized report with the current floor plan, furniture destinations, dimensions, packing boxes and outstanding checks. It provides a dedicated print portal and A4 stylesheet; the browser print dialog can save a PDF. CSV remains available. Furniture parked outside is excluded from in-home reuse counts; selected-piece reuse and reuse across the full original inventory have separate denominators. Mobile results lead with the decision and price, followed by a compact expandable scene and sticky actions.

The optional detailed questionnaire has five confirmed core sections and four branches for hobbies/storage, pets, restrictions and style. `lib/living-profile.ts` validates its versioned profile, and `lib/profile-planning.ts` applies purchase, mounting and reuse constraints. Profiles retain legacy-compatible v2 plan storage. The homepage hides an empty archive and only offers a saved-plan continuation when a saved version exists.

The current flow includes a detailed living brief, English/Simplified/Traditional locale controls, dual area units, a built-in example floor plan or simulated scanning, and distinct family/gathering/focus trade-offs. In results, floor-plan furniture dragging and nudge/rotate controls update the same placements used by the live scene, comparison, cost totals, CSV and saved history. Background dragging still pans. `lib/studio-placement.ts` checks basic boundaries, wall segments and footprint overlaps; it does not certify door clearance or accessibility.

`renest-spatial-history-v1` keeps the latest 20 saved versions on the current browser/origin, exposed by the homepage archive. Optional v2 save fields retain the living brief, per-layout edits and home source without breaking older saves. Resale estimates and editable pending posts are local demo drafts (`renest-resale-drafts`), never automatic marketplace publications. `npm run check:studio` validates geometry and storage compatibility.

The `/demo` route is the canonical moving flow. Older `/scan-old`, `/inventory`, `/scan-new`, `/preferences`, `/optimize`, `/move-plan`, and `/impact` bookmarks redirect here. `/shop` redirects to the existing product collection. The original models and generation source remain in `v2-home-models/`.

The stages are old-home capture, furniture selection, new-home capture / unfinished shell, preferences, AI-style design brief / truck migration, three arrangements, and visual impact. LiDAR capture and arrangement generation are explicitly demo simulations. Preferences rank three supplied arrangements; selected furniture genuinely controls the rendered objects.

`home-scene.tsx` owns the single persistent Three.js canvas, per-mode lazy model loading, semantic furniture transforms, scan clipping, point cloud, fixed world-up camera transitions, lighting and folding hinges. `scene-props.ts` builds the Dynamic Island phone and cutaway moving truck. The phone turns its rear sensor toward the scanning plane; beams originate at the LiDAR sensor. Selected objects shrink into the cargo bay, travel with the truck, and unload to the chosen arrangement. Objects not selected remain in the old home.

`moving-studio.tsx` owns the workflow, selection, preferences, product dialog, saved plans and impact. `lib/studio-data.ts` reads the shared geometry manifest and matches new products to the existing catalogue. The impact view computes actual selection/layout reuse and new-item cost; it does not invent emissions or unverified savings. The moving list downloads a UTF-8 CSV including reused/new/not-included decisions, estimated dimensions, final placements, budget and a packing column.

Both the studio and standalone preview keep camera up fixed at `(0,1,0)`. Floor-plan transitions interpolate camera position/target without changing up. OrbitControls is resynchronized after the transition to clear residual damping. Floor-plan dragging pans; 3D dragging rotates with bounded pitch. Reduced motion skips sweeps and furniture flights and disables autoplay.

Storage is versioned: `renest-spatial-session-v2` in sessionStorage, `renest-spatial-plan-v2` in localStorage. Missing or corrupt storage is tolerated. The product pages return to the saved in-session studio.

The homepage uses the same live scene engine for a restrained vignette containing only the original sofa, coffee table and floor lamp. A bounded, pausable camera drift shows the furniture without revealing either apartment or the moving animation. Rendering pauses off-screen. All active brand surfaces share `components/common/brand-logo.tsx`; the favicon, share image and standalone viewer use the matching house mark.

Validation commands: `npx --no-install tsc --noEmit` and `npm run build -- --webpack`. Webpack is the local build fallback because Turbopack's CSS worker port binding is restricted in this environment. Browser verification covers scans, true furniture exclusion, three layouts, camera endpoints/yaw, product preview, impact, CSV, save/restore, and mobile layouts.

Old-home capture progressively reveals the furnished room as the LiDAR sweep runs: depth points, then clipped surfaces with their original materials. Unscanned geometry and its shadows remain hidden; the full solid room is not shown at the start. Only the completed inventory stage applies the green detection tint to movable furniture. The inventory can switch between the room and an extracted 3D collection; the selected piece lifts and enlarges, with a direct keep/leave control. Architecture, original poses, material colours and scales are restored before replaying, migrating or showing the new home. New-home and result scenes use normal materials unless the user explicitly enables their optional reuse overlay.

The phone now shares one position and scale between ready and scan states. It turns in place before moving along a smooth path, and beams start only after that turn. Geometry and shadow clipping follow scan progress together. Device identity and capture progress share one HUD during scanning; narrow scan views include the phone in the camera framing, and mobile scan actions scroll back to the canvas.

The Reimagine stage gives the design brief a wider panel, one-click lifestyle prompts and editable priorities. Entering the stage eases into the orthographic floor plan; Generate returns to 3D and retains the complete packing, driving and unloading animation alongside simulated design progress. Camera transitions interpolate spherical orbit angles to avoid an abrupt azimuth snap at the top-view pole. The result keeps the original brief available for refinement. The experience remains explicitly simulated.

Rendering uses shared, small procedural grain/weave/plaster surface maps, material-specific finishes, a neutral daylight key and fill, and lamp-positioned warm practicals at night. Floor plan mode smoothly raises the key light and reduces shadow contrast; it returns to daylight for legibility. Soft furniture contact shading follows each piece, stays clipped during scans, and is hidden on moving-truck copies. Mobile canvases cap pixel density and use 1024px shadow maps. Most original rounded furniture geometry is retained; the beds use the offline Blender refinement described below, while the sofa retains its original appearance. No heavy screen-space postprocessing is required.

Impact gives the live room its own unobstructed framing, with an original-home reference card, live reuse/addition counts, a reuse highlight toggle and a slow, pausable room tour. Direct manipulation and switching to Floor plan stop the tour; reduced-motion settings disable it.

Scan timing is shared in `lib/scan-timeline.ts`: an 18-second sequence gives device alignment, increasing surface samples, progressive triangle reconstruction and finished materials distinct reading time. The phone travels outside the room before acquisition. Samples retain actual material colours; the counter reports acquired simulated samples.

Homepage demo links explicitly start at the old-home opening. After Generate, the full truck sequence leads into a short room reveal: furniture lands, lighting rises and the camera settles before layout controls appear. Reduced motion bypasses the reveal delay, and Skip animation opens the result immediately. Existing-room photography is shown uncropped below the hero; no completed new-home layout is previewed there.

The scanning phone now turns for 6% of the scan (about 1s) and remains outside the apartment boundary. Moving furniture uses dimension-fitted, non-overlapping cargo slots and lift/travel/lower paths. The truck follows a straight minimum-jerk drive with distance-based wheel rotation; its rear gate closes after loading and opens after stopping, before unloading. Scene readiness is keyed by mode to prevent the reveal completion race; results also provide an immediate skip and bounded timeout.

The live V2 assets include Blender-refined bed upholstery with separate
UV1 local-occlusion atlases. Rebuild them with `npm run build:refined-models`;
see `docs/blender-refinement.md` for the pipeline, invariants, and measured size
tradeoffs. The sofa also uses refined upholstery and a baked local AO atlas. Source models remain under `v2-home-models/models/`.

### Interior tour

The default tour is live Three.js with collision-checked room paths, a topology-to-room entrance, smooth day/evening lighting and drag-to-look controls. The entrance has a closed oak door; windows overlook layered mountain scenery. Matching offline Cycles frames remain an optional Photo view, with DIY edits always live. Reduced motion bypasses travel.

Scanning uses 260k desktop / 120k mobile material-coloured samples. Fixed pixel dots gradually increase in density; no room or furniture outlines appear before acquisition. Fine triangles assemble through precomputed geometry and shader uniforms, with silver-blue antialiased edges and a gradual fusion into material colours. A depth-only pass keeps back surfaces out of the point cloud.

Moving follows the truck into an overhead map transition and down into unloading. The bundled Hong Kong coastline and OSRM road route require no runtime map network request.
