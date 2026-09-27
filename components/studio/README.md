# ReNest Moving Studio

The `/demo` route is the canonical moving flow. Older `/scan-old`, `/inventory`, `/scan-new`, `/preferences`, `/optimize`, `/move-plan`, and `/impact` bookmarks redirect here. `/shop` redirects to the existing product collection. The original models and generation source remain in `v2-home-models/`.

The stages are old-home capture, furniture selection, new-home capture / unfinished shell, preferences, truck migration / generation, three arrangements, and visual impact. LiDAR capture and arrangement generation are explicitly demo simulations. Preferences rank three supplied arrangements; selected furniture genuinely controls the rendered objects.

`home-scene.tsx` owns the single persistent Three.js canvas, per-mode lazy model loading, semantic furniture transforms, scan clipping, point cloud, fixed world-up camera transitions, lighting and folding hinges. `scene-props.ts` builds the Dynamic Island phone and cutaway moving truck. The phone turns its rear sensor toward the scanning plane; beams originate at the LiDAR sensor. Selected objects shrink into the cargo bay, travel with the truck, and unload to the chosen arrangement. Objects not selected remain in the old home.

`moving-studio.tsx` owns the workflow, selection, preferences, product dialog, saved plans and impact. `lib/studio-data.ts` reads the shared geometry manifest and matches new products to the existing catalogue. The impact view computes actual selection/layout reuse and new-item cost; it does not invent emissions or unverified savings. The moving list downloads a UTF-8 CSV including reused/new/not-included decisions, estimated dimensions, final placements, budget and a packing column.

Both the studio and standalone preview keep camera up fixed at `(0,1,0)`. Floor-plan transitions interpolate camera position/target without changing up. OrbitControls is resynchronized after the transition to clear residual damping. Floor-plan dragging pans; 3D dragging rotates with bounded pitch. Reduced motion skips sweeps and furniture flights and disables autoplay.

Storage is versioned: `renest-spatial-session-v2` in sessionStorage, `renest-spatial-plan-v2` in localStorage. Missing or corrupt storage is tolerated. The product pages return to the saved in-session studio.

The homepage uses the same live scene engine, a slow orbital camera and a three-chapter story. Rendering pauses off-screen. All active brand surfaces share `components/common/brand-logo.tsx`; the favicon, share image and standalone viewer use the matching house mark.

Validation commands: `npx --no-install tsc --noEmit` and `npm run build -- --webpack`. Webpack is the local build fallback because Turbopack's CSS worker port binding is restricted in this environment. Browser verification covers scans, true furniture exclusion, three layouts, camera endpoints/yaw, product preview, impact, CSV, save/restore, and mobile layouts.

Old-home capture now keeps the furnished room visible in its normal materials while the LiDAR sweep runs. Only the completed inventory stage applies the green detection tint to movable furniture. The inventory can switch between the room and an extracted 3D collection; the selected piece lifts and enlarges, with a direct keep/leave control. Architecture, original poses, material colours and scales are restored before replaying, migrating or showing the new home. New-home and result scenes use normal materials unless the user explicitly enables their optional reuse overlay.
