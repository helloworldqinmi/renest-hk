# ReNest HK

**Move what matters. Fit what works.**

ReNest HK is an interactive hackathon prototype for furniture migration and spatial planning in compact Hong Kong homes. The demo guides you from a 380 sq ft Kowloon apartment into a 310 sq ft Northern Metropolis home.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production verification:

```bash
npm run build
npm start
```

## Demo flow

1. Run an animated old-home scan and review seven detected furniture items.
2. Toggle what to keep and mark priority furniture.
3. Scan the new home and convert lifestyle language into measurable constraints.
4. Compare three dimension-scaled, geometry-checked SVG layouts.
5. Inspect furniture placement reasoning and watch the migration animation.
6. Try dimension-matched tables in the room and prepare the old table for resale.
7. Review the final move plan and circular-move impact.

Use the **Restart** control in the interactive demo to return to the opening scan.

## Project structure

```text
app/                  Next.js App Router screens
components/common/    Header, progress, dialogs, and shared controls
components/floor-plan SVG plan renderer and furniture interactions
components/planning/  Furniture migration experience
components/scanning/  RoomPlan-style scan sequence
lib/demo-data.ts      Deterministic rooms, plans, products, and preferences
lib/geometry.ts       Boundaries, overlap, clearance, area, and scoring helpers
lib/roomplan.ts       RoomPlan JSON normalization adapter
public/data/          Sample RoomPlan-compatible JSON
types/                Spatial and furniture domain types
```

## Mocked integrations

- Room scanning is a deterministic browser animation. A sample RoomPlan JSON adapter is included at `lib/roomplan.ts`.
- Lifestyle interpretation is deterministic and runs locally. An LLM can replace the parser behind `interpretPreferences` in `components/state-provider.tsx`.
- Product recommendations and resale publication use local mock data. Marketplace APIs can replace `marketplaceProducts` and the listing action without changing the UI flow.
- No authentication, payment, external API key, or database is required.
