# Product scope and data handling

## Implemented experience

The demonstration dataset represents a 44 m² old home, a nominal 45 m² new home and 18 existing furniture groups. Dimensions and area labels are illustrative. Users select furniture, set household needs, compare three curated arrangements, edit placements, inspect costs and reuse counts, save their work and export a moving handover.

Quick preferences and the detailed living questionnaire share the same planning state. Detailed questions cover people and beds, purchasing budget, work and dining, accessibility preferences, priorities, and optional hobbies, pets, renovation permissions and style. Recorded preferences do not imply that every requested facility is present in the model.

## Implementation boundaries

| Area | Current behaviour | Further work before operational use |
| --- | --- | --- |
| Capture | Timed browser animation using known geometry. | Device capture, calibration and reconstruction. |
| New-home input | Example floor plan or local file validation/preview. | Geometry extraction and measured validation. |
| Planning | Deterministic rules over three supplied arrangements. | Broader layout search, evaluation and optional AI integration. |
| Fit | Basic bounds, walls and furniture footprint checks. | Door swings, access paths, delivery access and surveyed geometry. |
| Cost | Demonstration catalogue prices and resale estimates. | Supplier quotes, inventory, taxes and service charges. |
| Resale | Editable local drafts and manual publication. | Consented marketplace integration and transaction lifecycle. |
| Logistics | Moving CSV and printable report. | Carrier APIs, booking, quotations, tracking and service eligibility. |
| Impact | Counts derived from the current selection and arrangement. | Independently validated environmental and operational metrics. |

No live LiDAR, generative AI, marketplace posting, payment, account system, carrier booking or community pilot is implemented. Film scenarios are illustrative; they should not be read as measured outcomes or deployed integrations.

## Local data model

| Storage key | Storage | Purpose |
| --- | --- | --- |
| `renest-spatial-plan-v2` | localStorage | Latest arrangement. |
| `renest-spatial-history-v1` | localStorage | Up to 20 saved versions. |
| `renest-spatial-session-v2` | sessionStorage | Current workflow progress. |
| `renest-resale-drafts` | localStorage | Resale drafts and local pending items. |
| `renest-language` | localStorage | Language preference. |

Plans preserve supported versioned profile fields, placements and input metadata. Invalid or missing stored data is handled by the application. Browser storage belongs to the current origin and browser; clearing browser data removes these records. A different deployment URL or device has a separate store.

Uploaded room images and scan files are not sent to an application reconstruction service or included in saved plans. Only the selected input method and filename are retained. Users must reselect a source file to preview its contents after revisiting. Downloaded CSV and PNG files are actual exports; the printable report can be saved as PDF through the browser.

## Evaluation priorities

Before a production pilot, validate measured inputs and delivery access, define a consented data lifecycle and cloud persistence model, integrate real catalogue/carrier services, and evaluate planning quality with representative households. Any claimed cost, reuse or environmental benefit would require a defined baseline and measurement method.
