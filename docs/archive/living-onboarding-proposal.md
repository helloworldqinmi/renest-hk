# Living onboarding: original design proposal

Historical design record, translated into English for repository review. The current implementation is described in [product scope](../product-scope.md) and the [studio guide](../../components/studio/README.md).

## Intent and implementation status

Build a household brief progressively, using one topic per screen with choice cards, counters and tags. Core selections, four optional branches, conditional questions, the summary card and save/restore were implemented in the moving studio. Budget, second-hand preferences, mounting permissions and keep/sell decisions feed the preset planning rules. Unmet or unmodelled needs are disclosed.

## Five core topics and four optional branches

| Topic | Priority | Proposed content |
| --- | --- | --- |
| Household | Core | People, double/single beds, children and overnight guests. |
| Budget | Core | HK$0, below 3,000, 3,000–6,000, 6,000–10,000 or custom; delivery/assembly reserve; purchase timing and second-hand preference. |
| Work and dining | Core | Work frequency, simultaneous desks, workspace location, everyday dining and hosting. |
| Accessibility | Core | Older adults, wheelchair or stroller needs; circulation and bedside requirements; an unsure option. |
| Priorities and existing furniture | Core | One main priority, up to two secondary priorities, and must-keep/replace/sell decisions. |
| Hobbies and storage | Optional | Reading, coffee, music, projection, exercise and crafts; area preferences and storage categories. |
| Pets | Optional | Species, number, resting, feeding, hygiene and storage needs. |
| Renovation permissions | Optional | Ownership/rental and permissions for drilling, wall mounting, fixed cabinetry and wall changes. |
| Style | Optional | Colour, material and style preferences, including an undecided option. |

## Interaction principles

- Clearly distinguish core and optional topics and preserve answers when returning to a previous screen.
- Do not treat system defaults as user-confirmed answers.
- Use explicit checked states rather than colour alone; separate primary and secondary priorities.
- Reveal only relevant questions. Cat owners see cat-related facilities; mounting restrictions influence recommendations.
- State provisional assumptions when the user is unsure.
- Show area in square metres and square feet. Shared activity spaces should not be naively added together.
- Do not request an exact home address; resale preparation can begin with an area and collection availability.

A pet example starts with none/cat/dog/bird/other, then reveals relevant tags such as scratching furniture, litter space, water and supplies. The demo uses preset rules, not live AI search. A future retrieval service should distinguish suggested needs from confirmed choices.

## Review card

An editable summary might read: two people, double bed, occasional overnight guests, two simultaneous workspaces, HK$6,000 furniture budget excluding delivery/assembly, second-hand accepted, no drilling, one cat, and sofa/desk marked must-keep.

Offer Edit, Add optional details and Generate layout. Save this brief with the arrangement.

## Effect on planning

The proposal distinguished hard constraints, ranking preferences and contextual notes. In the current three-preset demo, document which answers affect planning and which are recorded for future work. Explain conflicts explicitly, such as a second workspace competing with a required single bed. Accessibility, fixed installation, styling and pet facilities still need measured validation and manual review; recording a requirement does not mean the layout fulfils it.
