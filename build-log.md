# Build log

## r3 M1: Core rebuild

- `app/src/cover.js`: Rebuilt the canvas renderer with eight layouts, edge-to-edge photo fitting inside each cell, top-biased sample portrait framing, five posterized color grades, texture switches, and the full print treatment. The wide photo region spans about 75% of the cover height with the title across its lower edge.
- `app/src/shots.js`: Defined the Mosaic, Three and Grid defaults with six, three and four crops. All sizes share AFTERGLOW, the same script subtitle, the same tagline and original press and production copy.
- `app/src/main.js`: Added the six-slot photo bank, caption and crop editing, history, Auto-fill, Spread, Surprise me and PNG export in one or three sizes.
- `app/index.html` and `app/style.css`: Added the workflow and editor controls and constrained the desktop preview independently of the scrollable tools. Retained the two r1 sample payloads.
- `app/fonts/fonts-greatvibes.ttf` and `app/fonts/fonts-greatvibes-OFL.txt`: Bundled Great Vibes Regular under SIL OFL 1.1. Existing DejaVu fonts provide the fallback.
- `verify-m1.cjs`: Added the requested normalized coverage, overlap, pixel geometry, default crop count, cover fit and portrait zone assertions. Sample dimensions come from the embedded WebP headers.

Ran one syntax check for each of the four changed JavaScript files, one `git diff --check`, and one assertion run: all passed. The static network scan found no network references in the app; its broad `ws:` alternative flagged CSS `grid-template-rows:`. The forbidden-copy scan found no app matches, and the new copy had no matches in the Top 20 analysis.

M2 still needs the four staged photos, their credits, and a cover-fit and motel sign check across all formats. M3 still needs the README update and polish. Browser visual review, including headroom, title overlap, editor fit at 1280 × 720 and interactive export behavior, remains pending. No captures, commits or submission were made.

## r3 M2: Six-photo bank — implemented, verification incomplete

Changes authored in this session, from the M1 worktree only:

- `tools/embed-photos.cjs`: Added a reproducible Node conversion/embedding script. Reads the staged JPEGs in skyline, convertible, motorboat, motel order, uses local Python 3/Pillow for RGB WebP conversion (maximum 1440 px, quality 80 with a size fallback), and writes URL-safe unpadded base64 into the existing sample payload. Retains the two original portrait payloads. The initial synchronous subprocess call returned EPERM before writing the payload; switched to an asynchronous subprocess and successfully ran conversion. No network or external writes. Primary motel used; backup not used.
- `app/index.html`: Expanded the embedded bank from two to six unique photos. Converted sizes: skyline 181,372 B; convertible 83,814 B; motorboat 109,244 B; motel 46,474 B, each below 256 KiB. Added an editor-visible expandable sample attribution area, source titles, supplied creator names, license versions, modification notice and motorboat ShareAlike notice.
- `app/src/shots.js`: Added per-photo source focal points, including the motel at normalized (.51, .38). Retained M1's format defaults, captions and shared cover copy.
- `app/src/main.js`: Carries the focal point with each sample and assigned panel, including Spread and Auto-fill. Six samples fill the wide Mosaic in order without repeats. Tall/square retain M1's three/four-panel defaults and therefore show the first three/four unique photos.
- `app/src/cover.js`: Added clamped source focal positioning to existing cover-fit framing. Existing portrait bias remains the fallback.
- `verify-m1.cjs`: Preserved M1 assertions and added six-photo uniqueness/size checks, cross-photo cover-fit in default layouts, six-slot Mosaic checks for all formats, conservative motel sign bounds (source x .35–.67, y .16–.61), caption clearance and extra Mosaic portrait checks.

Attribution transcribed from staged SOURCES.md: Wikimedia Commons, “Miami Sunset (45863661094)” — Joe deSousa, CC0 1.0; “Classic convertible car parked on a roadside with a person opening the door at sunset in a countryside setting” — CC BY 2.0; “Motorboat Ryds 435DL and cloud reflections in Sämstad harbor 3” — CC BY-SA 4.0; “Crescent Palms Motel neon sign at night, New Orleans” — Stephen Kennedy, CC BY 2.0. SOURCES.md supplies no creator name for the convertible or motorboat; no names were invented. The staged motel source was viewed in the supplied image. Its complete MOTEL, Crescent PALMS and VACANCY words informed the geometry bounds.

Verification (single pass; no assertion rerun or corrective iteration):

- `node --check` once for each of the five changed JS/CJS files: all passed.
- `node verify-m1.cjs` ONCE: FAILED at the additional `tall portrait width` assertion in tall Mosaic. All original M1 assertions completed successfully before this failure, as did the new wide Mosaic cover-fit, sign-zone and portrait checks and tall default-layout cover-fit checks. Full source width is stricter than face visibility; this failure does not prove a clipped face. It remains unresolved and must not be represented as an all-format pass. Execution stopped before tall motel and square extended checks, so those remain unverified.
- Static network scan of app HTML/CSS/JS/JSON: 0 references (network URL schemes, protocol-relative resources and common network APIs). Bundled font license prose is not a runtime resource reference.
- `git diff --check`: result recorded by the final check after this log update.

Handoff: M2 photo bank and attribution implemented, but the extended assertion suite is NOT green. Next authorized pass must investigate the tall Mosaic portrait-width condition and finish all-format motel/coverage verification before declaring NB1 closed. M3 still needs README “four” → eight and final polish. M4 owns browser visual review, capture, commit, kit checks and Goldfish. No screenshots, commits or submission were made; no r2 source was read. Exact session token usage is not exposed by the tools.

## r3 M2b: Mosaic crop assertion and remaining checks

Reproduced first with `node verify-m1.cjs`: it failed at `verify-m1.cjs:89` with `AssertionError [ERR_ASSERTION]: tall portrait width`, from the Mosaic photo loop. The prior M1/default-layout assertions and wide Mosaic checks passed before that failure.

Tall Mosaic geometry diagnostics use the embedded portrait dimensions (photo 0: 544 × 720, aspect 0.755556; photo 1: 720 × 720, aspect 1.000000). Each row reports one tall Mosaic cell against one portrait. `left` is the rendered image's left edge in cell coordinates; centered cover-fit produces equal side overflow. Every row has `top = 0` and rendered height equal to the cell height.

| Cell | Box (w × h), aspect | Portrait | Cover scale | left (px) | Overflow left / right (px) |
|---|---:|---|---:|---:|---:|
| 1 | 392.947 × 871.830, 0.450715 | 544 × 720, 0.755556 | 1.210875 | -132.884 | 132.884 / 132.884 |
| 1 | 392.947 × 871.830, 0.450715 | 720 × 720, 1.000000 | 1.210875 | -239.441 | 239.441 / 239.441 |
| 2 | 300.024 × 483.948, 0.619951 | 544 × 720, 0.755556 | 0.672150 | -32.813 | 32.813 / 32.813 |
| 2 | 300.024 × 483.948, 0.619951 | 720 × 720, 1.000000 | 0.672150 | -91.962 | 91.962 / 91.962 |
| 3 | 310.349 × 483.948, 0.641285 | 544 × 720, 0.755556 | 0.672150 | -27.650 | 27.650 / 27.650 |
| 3 | 310.349 × 483.948, 0.641285 | 720 × 720, 1.000000 | 0.672150 | -86.800 | 86.800 / 86.800 |
| 4 | 196.776 × 378.162, 0.520348 | 544 × 720, 0.755556 | 0.525225 | -44.473 | 44.473 / 44.473 |
| 4 | 196.776 × 378.162, 0.520348 | 720 × 720, 1.000000 | 0.525225 | -90.693 | 90.693 / 90.693 |
| 5 | 207.101 × 378.162, 0.547651 | 544 × 720, 0.755556 | 0.525225 | -39.311 | 39.311 / 39.311 |
| 5 | 207.101 × 378.162, 0.547651 | 720 × 720, 1.000000 | 0.525225 | -85.531 | 85.531 / 85.531 |
| 6 | 196.776 × 378.162, 0.520348 | 544 × 720, 0.755556 | 0.525225 | -44.473 | 44.473 / 44.473 |
| 6 | 196.776 × 378.162, 0.520348 | 720 × 720, 1.000000 | 0.525225 | -90.693 | 90.693 / 90.693 |

**Decision: (a), crop only side pixels.** In all 12 combinations the full source height fits exactly and the top of the rendered image is at 0 px, so the complete upper 40% source band is visible. The centered horizontal source windows in cell 1 are approximately 0.202–0.798 for photo 0 and 0.275–0.725 for photo 1; both contain the measured facial bounds used by the test (photo 0: x .32–.71, y .06–.33; photo 1: x .30–.68, y .12–.41). Each remaining tall cell shows a wider source window. Thus faces remain intact; no tall Mosaic geometry change is warranted. Requiring the entire portrait width in each cell contradicts cover-fit for these aspect ratios. The assertion is replaced by cover-fit on both axes, upper-40% containment, and explicit face-zone containment. Square Mosaic also crops side pixels for its first two assigned portrait photos (cell 1: photo 0 overflows 66.278 px on each side; cell 2: photo 1 overflows 42.595 px on each side), so that format uses the same face-safe invariant rather than the impossible full-width condition. Wide keeps the full-width assertion.

The face bounds are checked for the actual portrait assignments in every default layout and all three Mosaic formats. The all-photo checks continue to cover-fit every photo in every default cell and every one of the six Mosaic cells. Motel sign source bounds remain x .35–.67 and y .16–.61. In Mosaic's motel cell, the tested sign rectangle is x 127.672–244.400, y 67.765–286.630 in wide; x 53.009–143.767, y 60.506–230.679 in tall; and x 62.318–134.458, y 48.094–183.357 in square. Each rectangle is inside its cell. The MOTEL word starts at source y .245, below the caption chip boundary in all three formats; Crescent PALMS and VACANCY are lower in the same visible sign rectangle.

Changes in this pass: `verify-m1.cjs` replaces the portrait full-width assertion for tall and square Mosaic with upper-40% and explicit face-zone checks, keeps the wide full-width invariant, and adds face checks to the actual default portrait assignments. No renderer, source photos, or app resources changed. No external files were written, and no screenshots, commits, or submissions were made.

Verification results: `node --check verify-m1.cjs` passed once. The single final `node verify-m1.cjs` run passed: 96 cover-fit cases, six unique photos, all-format Mosaic sign zones, portrait zones and crop counts. The static app scan found zero network references. The final whitespace check follows this log update. M3 remains: update README's “four panel layouts” count to eight and finish the later polish. Browser visual review, capture, commit, kit checks, and Goldfish belong to M4. Exact session token usage is not exposed by the tools.

## r3 M3 — README and caption polish

- `README.md` now lists all eight layouts, six sample photos, five named grades, eight toggles, and three PNG export sizes. The three existing make.fun badge URLs and bounty destinations are present and were preserved. Their live responses were outside the offline check.
- `app/src/cover.js` now uses the same horizontal padding on both sides of both text lines for all six caption chips. The chip stays inset from the panel, and the text width is capped inside the padding.
- The reported “31” was not identifiable at the left edge of the supplied motorboat photo. The current photo renderer has no numeric overlay at that edge. The crop and photo were left as supplied. M4 should check the wide panel for the mark and confirm chip spacing during visual review.

The single syntax check of `app/src/cover.js` and `git diff --check` passed. The full assertion suite passed in one run, including 96 cover-fit cases, six unique photos, Mosaic sign zones, portrait zones, and crop counts. The static scan found zero network references in app HTML, CSS, JS, and JSON. Exact session token usage is unavailable.
