# Alert Rules / Claims Settings Prototype — Active Context

**Last updated:** 2026-07-08

## Why this exists
Claims/Invoice matching settings (`/partner-promotions/invoice-management/settings`) needed 3 new master-data upload surfaces — Catalogue Attributes, Line Item Lookup Attributes, Invoice Detail Validation Attributes — to replace the old Plum SKU-catalogue dependency. This prototype models those upload flows and their edge cases so engineering has a concrete reference instead of a blank-slate ticket.

## Where it lives
`projects/partners-promotions/alert-rules-app/` — Vite + React, sits next to `auto-approval-app` and `push-notification-app`.
**Repo:** https://github.com/saksham-xo/partner-promotions-prototypes (public)
**Run:** `npm install && npm run dev` — settings page at `/partner-promotions/invoice-management/settings`, add `?default=true` for the empty/default state.

## Key data model (`src/data/store.jsx`)
- **Catalogue Attributes** (`catalogueRecords`) — fixed schema `reference_id, product_code, product_name`. No `active` field, no toggle — **records can never be deactivated once uploaded, via UI or file.** Seeded with 8 records.
- **Lookup Attributes** (`matchKeys[].records`) — dynamic key name (e.g. "Batch ID" / `batch_id`) + `skuCode` + `active`. Has a UI toggle (no file-level deactivation).
- **Invoice Attributes** (`invoiceAttributes[].records`) — dynamic key name (e.g. "Stockist Name") + `active` only, no second field. Has a UI toggle. `status=U` is structurally meaningless for this type since there's nothing else to update.

## `isDefaultMode` pattern
`AlertRules.jsx` reads `?default=true` from the URL to force all 3 attribute sections into an empty/disabled state regardless of seeded data — used for stakeholder walkthroughs of the "nothing uploaded yet" state. Applied consistently to Lookup, Invoice, and (as of this session) Catalogue's "View Catalogue" button.

## Sample file downloads
All 3 upload modals now generate real client-side CSVs (blob download) instead of a toast-only fake:
- Catalogue → `AlertRules.jsx` `downloadCatalogueSample()`
- Lookup → `ManageLookupAttribute.jsx` `downloadSample()`
- Invoice → `ManageInvoiceAttribute.jsx` `downloadSample()`

**Current filenames** (went through several naming-convention iterations before settling): `sample_catalogue_attributes.csv`, `sample_lookup_attributes.csv`, `sample_invoice_attributes.csv` — `sample_` prefix, static per attribute *type* (not per dynamic key). Mirrored as static files in `public/samples/` for reference.

## JIRA

**Parent:** [GF-15672 — Enable using Batch ID for Line Item Product Code Analysis](https://giftxoxo.atlassian.net/browse/GF-15672) (Lupin) — Batch ID master list is the Lookup Attributes use case.
**Child tickets** (created this engagement, all linked to GF-15672 via "Relates"):
- [GF-16123](https://giftxoxo.atlassian.net/browse/GF-16123) — Claims Settings Master Data Ingestion (the 3 upload surfaces)
- [GF-16124](https://giftxoxo.atlassian.net/browse/GF-16124)
- [GF-16125](https://giftxoxo.atlassian.net/browse/GF-16125)
- [GF-16126](https://giftxoxo.atlassian.net/browse/GF-16126) — File naming convention, sample formats, upload history. **User has since rewritten this ticket's description directly in Jira** (fetched 2026-07-08) — now specifies: filenames must *end with* `_catalogue_attributes.csv` / `_lookup_attributes.csv` / `_invoice_attributes.csv`; uploads tracked via **Data Exports (Logs) UI + Audit Trail** (not a standalone per-attribute panel as originally drafted); failure/nothing-happens scenarios explicitly modeled "same as CPD uploads" (duplicate N/U in one file, re-upload of same filename, non-CSV, >25k rows, pre-existing record with status N → ignored + others processed, inactive Lookup record needs manual toggle, duplicate rows → second ignored).

**Note:** the prototype's current filenames (`sample_` prefix) do not yet match GF-16126's latest spec (suffix `_attributes.csv`, no `sample_` prefix mentioned) — reconcile before next handoff if GF-16126's convention is final.

## Proposed GF-15672 update (drafted in chat 2026-07-08, not applied to Jira)
GF-15672 predates GF-16126's detail and should reference it rather than leave "master list management" vague:
- **Dependencies:** add GF-16126 (defines the Batch ID master list's upload naming convention + Logs/Audit Trail tracking).
- **Expected Behaviour / Functional Flow:** note the Batch ID master list is uploaded as a Lookup Attribute per GF-16123/GF-16126, filename ending `_lookup_attributes.csv`.
- **Acceptance Criteria:** add that uploads follow GF-16126's convention and surface in Data Exports (Logs) + Audit Trail.

## Open loops
- Reconcile prototype's `sample_` prefix filenames against GF-16126's latest suffix-based convention.
- Decide whether to implement Data Exports (Logs) + Audit Trail surfacing in the prototype (GF-16126's now-current spec) vs. the earlier per-attribute Upload History panel concept (superseded).
- Catalogue Attributes has no deactivation path at all (UI or file) — confirm with Manoj/engineering whether this is intentional before GF-16123 is estimated.
- Apply the proposed GF-15672 description update in Jira once confirmed with Saksham.
