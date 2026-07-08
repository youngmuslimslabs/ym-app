# YM NN Master List — Cleanup Log

Source: `YM NN Master List - SOURCE OF TRUTH (1).xlsx` (sheet "NN Data", 118 NeighborNet rows, 11 columns)
Raw copy preserved at: `docs/geography/source-of-truth-raw.xlsx`
Branch: `feature/geo-data`

This chat = **data cleaning only**. No migrations, no seed.sql. Output = one cleaned CSV that becomes the source of truth.

## Confirmed structure
- 118 data rows (parser saw 1045 rows; 927 were trailing blanks from the Excel table range).
- Hierarchy: Region → SR (subregion) → NN (neighbor net).
- Columns: Region, is_region_expansion, SR, is_sr_expansion, NN, is_nn_expansion, LOCATION, Address, Day, NNC, Fundraising Link.

## Operating principle (confirmed)
Sheet is authoritative (SME-owned reporting structure). Clean unambiguous mechanical defects silently
(stringified "null" → empty, trailing whitespace, "Fridays"→"Friday", numeric coercion like 75.0).
Anything that changes meaning is surfaced for discussion, never auto-decided. Never regroup/invent regions.

## Decisions (append as we go)
### Issue 1 — Region = "null" on 24 rows — DECIDED
- Keep the 7 affected subregions **region-less** (orphan subregions are valid; nullable region FK downstream).
- Convert the literal string `"null"` in the Region column → **true empty cell**. No regrouping, no invented regions.
- (Matching `is_region_expansion="null"` on the same rows handled in Issue 2.)

### Issue 2 — Expansion flags — DECIDED
Result: every subregion ends up with ONE uniform `is_sr_expansion`, and every region uniform `is_region_expansion`.
1. `is_region_expansion "null" → blank` — 24 region-less rows. (2a)
2. `is_region_expansion 1 → 0` — 5 New York West rows (Brooklyn, Westchester, White Plains, Stamford, Rockland).
   Northeast is NOT an expansion region; New York West stays an expansion SR via `is_sr_expansion=1`. (2b)
3. `is_sr_expansion 1 → 0` — Dallas East `75`; Dallas West Irving, Colleyville, Southlake (4 rows).
   Dallas East & Dallas West are NOT expansion SRs. (2c)
4. `is_sr_expansion 0 → 1` — Minnesota/Blaine (1 row) AND West/LV,AZ,LA (3 rows). Both ARE expansion SRs.
   → Full expansion-SR set becomes: New York West, Northern Virginia, Central/South Virginia, Maryland,
     Washington, West Virginia, Minnesota, West.

### Issue 5 (partial) — Numeric NN names — DECIDED
- `75` (Dallas East, venue Masjid Salahuddin) and `571` (New Jersey South, venue MCGP) are REAL NeighborNets, not junk.
- Fix the float artifact and store as **text**: NN `75.0 → "75"`, `571.0 → "571"`.
- Still open for Issue 5: `LV`/`AZ`/`LA` abbreviations in the West subregion (expand or keep?).

### Issue 4 — Stray numbers in LOCATION/Address — DECIDED: DISCARD
- Forensics: these are a distinct field that slid into whichever of LOCATION/Address was empty (never both).
  - LARGE values (82–503) climb monotonically with row position across the whole sheet → a source-system
    sort-order/row-ID artifact. No geographic meaning.
  - SMALL values (15/20/35/48; twenty×22, fifteen×13) repeat and don't climb → look like a count/size bucket,
    but unidentifiable without an SME.
- Decision: **blank all 59 stray numbers** out of LOCATION/Address. Raw values remain preserved in the
  committed `source-of-truth-raw.xlsx`, so recovery is possible if an SME later identifies the 15/20-type values.
- No hidden column / comment in the xlsx named the field (table declares exactly the 11 known columns).

### Issue 5 — Placeholder / abbreviation NN names — DECIDED
- `75.0 → "75"`, `571.0 → "571"` (text) — done under Issue 2.
- Keep as-is (legit, venue-anchored acronyms / street): `NYIT`, `IFN`, `ICWS`, `4th St`.
- Keep as-is (per user): `LV`, `AZ`, `LA` (West subregion) — early-stage expansion abbreviations, not expanded.

### Issue 6 — Split meeting day out of LOCATION — DECIDED (lossless)
- 17 LOCATION cells lose their `- <Day>` suffix; venue text otherwise untouched.
- Day moves sideways into the SAME row's `Day` cell: 7 fill an empty Day, 10 already matched (redundant copy dropped).
- 0 conflicts. Plurals normalized: `Fridays→Friday`, `Thursdays→Thursday`. Day filled count 59 → 66.

### Issue 7 — NNC coordinator column — DECIDED
- Casing: title-case all names INCLUDING the particle → `Saif al Dean → Saif Al Dean`; also
  `sabeeh hassany→Sabeeh Hassany`, `Zaid syed→Zaid Syed`, `areeb siddiqui→Areeb Siddiqui`, `hanzalah qamar→Hanzalah Qamar`.
- Placeholders → blank: `TBD` (Valley Stream, Wayne), `NA` (New Britain).
- Trailing spaces trimmed: `Shujah Malhi `, `Qasim Choudhary `.
- Multi-coordinator → split into fixed columns. NNC keeps the FIRST person; add TWO new columns right after NNC:
  `Core Team Member 1`, `Core Team Member 2` (max extra people = 2, driven by Burke's 3 total). Extra names fill them.
  Sheet grows from 11 → 13 columns. The 7 affected NNs: Gainesville-FL, Burke, Glen Allen, Gaithersburg,
  Whitemarsh, Lanham, Charleston. All other 111 rows: new columns blank.

### Issue 8/9 — Whitespace + Fundraising Link — DECIDED
- Trim trailing whitespace: NN (Valley Stream, Valley Ranch), LOCATION (10 cells), NNC (2, via Issue 7). Trim all cells defensively.
- Bear Creek (Houston): strip stray trailing text `" by it you "` → keep clean URL `…NPDUHRQX…`.
- Devon (Pennsylvania): `Done above` → blank (not a URL).
- Duplicate link `…NWWDFSXY…` on NY Westchester + PA West Chester (copy-paste artifact behind the dup name):
  **blank the link on BOTH** rows (per user).
- 13 existing blank links → leave blank. (Blank-link total becomes 16 after Devon + both Westchesters.)

### Issue 3 — Duplicate "Westchester" NN — DECIDED
- Two different real places collided on one name. Keep the New York one (Westchester Muslim Center, Mt Vernon NY).
- Rename the **Pennsylvania** row (Islamic Society of Chester County, West Chester PA 19380):
  NN `Westchester → West Chester`. Evidenced by its own address + Pennsylvania subregion.

## OUTPUT — cleaned file
- `docs/geography/nn-master-cleaned.csv` — 118 rows, **14 columns** (was 11; +Coordinator Email, +Core Team Member 1/2).
- Final columns: Region, is_region_expansion, SR, is_sr_expansion, NN, is_nn_expansion, LOCATION, Address, Day,
  NNC, Coordinator Email, Core Team Member 1, Core Team Member 2, Fundraising Link.
- Verified by 33 automated assertions (all pass): structure, no literal "null", expansion uniformity + expected
  expansion-SR set, numeric-name fixes, Westchester rename, no numeric LOCATION/Address, no LOCATION placeholders,
  no numeric NNC, day-split (Day 59→66), NNC casing + core-team split, 51 coordinator emails, fundraising href
  recovery, link cleanups, no URLs in Address, zero stray whitespace.
- Raw input preserved at `docs/geography/source-of-truth-raw.xlsx` (nothing is irrecoverable).

### Late discovery — HYPERLINK LAYER (stdlib text parse had dropped it)
The xlsx cells carried hyperlinks the display text hid. Reconciled all of them:
- **Fundraising Link**: the href is authoritative. Recovered 12 links that displayed blank (Blackwood, Woodbridge,
  Irving, 75, Colleyville, Southlake, East Cobb, Lexington, 4th St, LV, AZ, LA) and fixed 2 rows whose display URL
  disagreed with the real link (Chesterfield, Glen Allen). Blank fundraising links dropped 13 → 4
  (Westchester + West Chester blanked per user; Devon "Done above" no href; North Hudson genuinely none).
- **NNC**: 51 coordinator emails (`first.last@youngmuslims.com`) extracted into new **Coordinator Email** column.
- **Address**: 10 cells were Google-Maps links (venue name + Place ID, NO street address). Per user: dropped the
  URL, kept the venue-name display text. (Cannot derive street addresses without resolving Place IDs via Google API.)

### Issue 4 extension + late audit fixes (found via output preview)
- Numeric junk also in NNC: Irving `242`, 75 `245` → blanked (same Dallas sequence artifact as Issue 4).
- Placeholders also in LOCATION: Queens Village `TBD`, Valley Stream `TBD`, South Brunswick `N/A` → blanked.

## Open issues queue  (ALL RESOLVED ✅)
1. Region = "null" on 24 rows (7 orphan subregions) — assign regions. **[current]**
2. Expansion flags inconsistent/denormalized (is_region_expansion, is_sr_expansion self-contradict within a subregion).
3. Westchester duplicate — PA one is actually "West Chester, PA".
4. Numeric junk in LOCATION + Address (15/20/499… — meaning unknown).
5. Placeholder NN names: "75.0" (Dallas East), "LV"/"AZ"/"LA" (West).
6. LOCATION has meeting day baked in (17 rows) — split into Day; normalize plurals.
7. NNC: casing ("sabeeh hassany"), placeholders ("TBD"×2, "NA"), 23 blanks.
8. Whitespace trims (NN, LOCATION, NNC trailing spaces — 13 cells).
9. Fundraising Link — 13 blanks.

## DB load  (2026-07-07)
Loaded into Supabase (project `todqvyzdvpnwuuonxwch`, us-east-2) as seed:
- **Schema** (`00001_initial_schema.sql` baseline): `subregions.region_id` made
  nullable (7 region-less expansion SRs), `neighbor_nets` +location/address/
  meeting_day/fundraising_link, `cabinet_teams (department_id, name)` UNIQUE.
- **Data**: `seed_geography.sql` (generated by `generate-geo-seed.mjs` from
  `nn-master-cleaned.csv` → 4 regions / 22 subregions / 118 NNs) + cabinet
  (6 depts / 16 teams) in `seed.sql`.
- **Live parity**: the live DB was ALTERed + seeded out-of-band via psql (the
  baseline is consolidated, not a forward migration), so a fresh `db reset`
  from the baseline reproduces the same schema. The two must stay in sync.
- **NNCs seeded (post-sync)**: after `bun run sync:google` (1,826 users), the
  resolver assigned **85 / 118** NeighborNet Coordinators from the roster's
  `Coordinator Email` column. 35 of those emails were **name-resolved** against
  the synced directory (30 unique first+last matches + 5 spelling variants, e.g.
  `Mohammad Eljack → mohamed.eljack@`) and back-filled into `nn-master-cleaned.csv`
  so the roster is email-complete. `match-nnc-names.mjs` is the one-time enrichment
  that found them; its output now lives in the CSV, so routine seeding uses only
  `generate-nnc-assignments.mjs`. Remaining 33 need roster fixes: 12 name-only
  unmatched (incl. `Ayan` = 4 people, `Shakir Shanawaz` ≠ the only `Mohammed
  Shanawaz`), 20 with no coordinator listed, 1 dead email (NYIT `hamza.khan2@`).
- **Core-team** still deferred (`Core Team Member 1/2` — owner hasn't provided).

### Rebuild / re-sync order
People-dependent rows can't be canonical seed (users don't exist at `db reset`).
Full rebuild is **three ordered steps**:
1. `supabase db reset` → schema + `seed.sql` (role_types, cabinet) + `seed_geography.sql`. **No users.**
2. `bun run sync:google` → users appear (fresh UUIDs each wipe).
3. `psql … -f supabase/seed/nnc_assignments.sql` → NNC `role_assignments`,
   **re-resolved by email** at apply time. Idempotent (`NOT EXISTS` = one NNC/NN)
   and durable across wipes precisely because it stores emails, never UUIDs.
