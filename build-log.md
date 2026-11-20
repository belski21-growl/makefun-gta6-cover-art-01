# Build log

Sunset Cover Studio is an offline, original poster editor. It builds editorial photo panels, crops a single upload across all panels or assigns several photos, and adds outlined type and adjustable color grading. PNG exports use the selected 1920 × 1080, 1080 × 1350, or 1080 × 1080 canvas.

## Files

- `app/index.html`, `app/style.css`: three-column editing workspace, layout controls, crop controls, responsive shell and bundled font references.
- `app/src/cover.js`: canvas composition geometry, slanted panel clipping, image transforms, color treatment, poster lettering and panel hit testing.
- `app/src/main.js`: editor controls, local image upload and drag-and-drop, per-panel crop and rotation, scene startup and PNG download.
- `app/src/shots.js`: deterministic landscape, portrait and square sample scenes.
- `app/samples/`: the two supplied, free-to-use sample photographs.
- `app/fonts/`: bundled DejaVu display and interface typefaces and their license. Google Fonts downloads were unavailable, so DejaVu was used as the permitted fallback.
- `main.ts`: copies the app and screenshots and produces the dossier under the selected output directory.
- `serve.ts`: unchanged static development server.
- `shots.json`: four browser capture scenes.
- `screenshots/`: cover, editor, portrait cover and square cover captures.
- `README.md`: run instructions and the requested badges.
- `.makefun/owner.json`: entry wallet metadata.
- `build-log.md`: build and validation record.

## M1 verification

Top 20 references were visually inspected before implementation. No script font is installed (`fc-list | grep -i script` returned no licensed script face); the subtitle therefore uses italic bold serif with neon glow as an honest fallback. Canvas grading uses standard `ctx.filter`-free overlays and `letterSpacing` only when supported by Chromium.

## Validation

- Two runs of `main.ts` exited successfully; dossiers were byte-identical.
- Dossier: 803,308 bytes; SHA-256 `85e4cd5ea590f845f6f59ba9288b341119f861ada72e8079a5493adbd8246488`; JSON parsed successfully.
- All four screenshots are JPEGs within the 256 KiB limit. Sizes and dimensions: 118,747 bytes at 1280 × 720; 103,751 bytes at 1280 × 720; 147,356 bytes at 1024 × 1280; 138,931 bytes at 1024 × 1024.
- Chromium loaded each of the four scenes and downloaded three full-resolution PNGs. Console errors: 0. External requests: 0. Layout, type and crop controls rendered successfully in the browser.
- Both main.ts output folders contain app/ and screenshots/. Network-reference scan: 0 HTTP, HTTPS or protocol-relative references; bare imports: 0.


## M2c — 20 November 2026

Scope: B2/B3, six-panel Mosaic, and M1 defects D1–D4. Read the requested sources and visually inspected all three M1 renders, rank1/rank2/rank5 references, and the four staged photographs. No network, server, browser capture, submission, or screenshot changes in this milestone. Existing unrelated working-tree changes were preserved.

### Embedded sample photo credits

The first two `#sample-photos` entries and the existing URL-safe WebP decoder are unchanged. Four staged JPEGs were converted in memory with Pillow (`convert('RGB')`, WebP quality 80), URL-safe base64 encoded without padding, and appended as entries 3–6 in `app/index.html`. No staging files were written. Source titles, licenses and URLs below are transcribed from `.photo-staging/SOURCES.md`; that file does not supply creator names, and none have been invented. Conversions and poster crops/color treatments are modifications; the motorboat and diner photo adaptations retain CC BY-SA 4.0.

- `skyline.jpg` — “Miami Sunset (45863661094).jpg” — CC0 — WebP **101,412 bytes**. Source: https://commons.wikimedia.org/wiki/File:Miami_Sunset_(45863661094).jpg
- `convertible.jpg` — “Classic convertible car parked on a roadside with a person opening the door at sunset in a countryside setting.jpg” — CC BY 2.0 — WebP **52,258 bytes**. Source: https://commons.wikimedia.org/wiki/File:Classic_convertible_car_parked_on_a_roadside_with_a_person_opening_the_door_at_sunset_in_a_countryside_setting.jpg
- `motorboat.jpg` — “Motorboat Ryds 435DL and cloud reflections in Sämstad harbor 3.jpg” — CC BY-SA 4.0 — WebP **68,606 bytes**. Source: https://commons.wikimedia.org/wiki/File:Motorboat_Ryds_435DL_and_cloud_reflections_in_S%C3%A4mstad_harbor_3.jpg
- `diner.jpg` — “Neon sign atop the Majestic Diner in Atlanta's Poncey-Highland neighborhood.jpg” — CC BY-SA 4.0 — WebP **100,622 bytes**. Source: https://commons.wikimedia.org/wiki/File:Neon_sign_atop_the_Majestic_Diner_in_Atlanta%27s_Poncey-Highland_neighborhood.jpg

### Implementation and defect status

- **B3 implemented:** six embedded photos; Mosaic is the wide default, with one large left hero plus two upper-right and three lower-right cells. Layouts still use a single `cells` array. Normalized cells cover the full panel region without overlap. Tall retains Three (3 crops); square retains Grid (4 crops).
- Active `state.panels` matches the selected layout cell count. A six-slot backing bank preserves images/crops when changing layouts. Upload distribution supports the active panel count, including six. Format changes select the matching composition and sample crops; six default role/location/time captions follow photo order.
- **B2 implemented, visual sign-off pending:** removed zoomed-in default crops in all formats. Known sample portraits receive a zero-rotation guard that retains the complete upper 40% source zone with headroom and horizontal margin. New scene samples use contained fitting inside the narrowest slanted-frame width to retain the supplied subject; this intentionally permits dark margins. Guard applies to known samples, not arbitrary uploaded photographs or intentional rotations. The convertible source already excludes the accompanying person's head; no missing source content can be restored.
- **D1 implemented:** quote/volume occupy a dedicated top band; panel geometry starts at 8.2% of the short side. Panel chips remain at their existing top edge, below the press band.
- **D2 implemented:** explicitly reset caption baseline to alphabetic (panel chips previously left it at middle), place script and subtitle on separate baselines with a gap, and restore canvas state afterward.
- **D3 implemented:** `caption()` previously never read `state.tagline`. It now paints an outlined dark ribbon and the actual tagline beneath the subtitle/rule, above the credits footer, with width reserved clear of the seal.
- **D4 implemented:** reserve a bottom title band outside the photo region and use smaller title sizing in tall/square. Default size is 130, within the existing slider range. Bottom-position titles and portrait face zones are geometrically separated.

### M2c verification

- Exactly one `node --check` per changed JS file: `cover.js` PASS; `main.js` PASS; `shots.js` PASS.
- Parsed all six embedded entries, validated URL-safe unpadded encoding, decoded and verified each WebP with Pillow. New payload byte counts match the conversion sizes above.
- Static app HTML/CSS/JS scan: **0 network references**.
- Node assertions (no browser/server/render capture): every layout's normalized cell area sums to 1 without overlaps; positive geometry across all three formats; default crop count equals layout cell count (6/3/4); both known portraits retain their upper 40% source zone in each default composition; tagline draw call exists and subtitle baseline follows script baseline in all formats. PASS.
- Files written in this milestone only: `app/index.html`, `app/src/cover.js`, `app/src/main.js`, `app/src/shots.js`, `build-log.md`.
- **Remaining for coordinator / next milestone:** capture and eye-check wide/tall/square plus editor, confirm face/chin visibility, contained-photo margins, caption readability and title/ribbon spacing; check browser interactions and exports, regenerate approved screenshots/dossier only under separate authorization. D1–D4 and B2 have code/static verification, not final visual closure. Creator attribution metadata is absent from the provided staging manifest; verify creator credits before publication. No submission performed.

## Fix r2 — 20 November 2026 (B1–B5, M1–M6)

Fix round r2 rebuilt the cover against the parent-verified Top-20 analysis (5–7 photo panels, black role chip per panel, giant 2-layer title, press-quote strip + VOL tag, tagline, production credits + barcode + gold seal, heavy sunset/neon grade, faces never cropped). Work ran under recording `01a1f812-50bc-73f0-88a2-9bdbc1ef7086` (see seal step). Codex milestones: M1 (dressing/title/grade), M2c (photos/crops/Mosaic/D1–D4), M3 (editor layouts/flow/fields/toggles), M3b (tall/square fill fix). M2 and M2b were killed by the coordinator with 0 files written (M2: failed patch context + stalled model call; M2b: path misunderstanding + missing /tmp renders). Token use per exec: M1 137,672; M2 87,494 (killed, 0 files); M2b 97,150 (killed, 0 files); M2c 401,546 (over the 200k cap — re-reading the ~95 KB base64 `#sample-photos` JSON and reference images); M3 120,890; M3b 108,135.

### What changed

- **B1 key-art dressing (M1):** press-quote strip + stars, VOL tag, tagline ribbon, production credit line, barcode, gold seal "ORIGINAL COVER ART", bottom slogan band — all rendered on canvas in all three formats.
- **B2 face-safe crops (M2c/M3b):** default crops keep the full upper 40% source zone of both known portraits (woman, boulevard; man with hat, pier) in wide/tall/square; the title band is geometrically separated from the photo region in tall/square. Coordinator eye-checked all four final renders: both faces whole, chins clear of the title.
- **B3 six photos (M2c):** four free-license photos added as embedded WebP (see "M2c" credits above — skyline CC0, convertible CC BY 2.0, motorboat/diner CC BY-SA 4.0, with source URLs). Default cover is 6 different panels, no repeated faces. Photos are downloaded once at build time and embedded locally; the finished app has 0 network references.
- **B4 heavy grade (M1):** five named presets (Vice Sunset, Neon Night, Golden Hour, Comic Ink, Noir Heat) + halftone + grain + strength slider. Default: Vice Sunset, strength 88, halftone and grain on.
- **B5 two-layer title (M1):** giant gradient block title (~1.5×) + script sub-title with neon glow. No script font exists locally (`fc-list | grep -i script` empty); the script line is italic bold serif + glow as an honest fallback. DejaVu remains the UI font.
- **M1 panel captions:** role + place + time chip on every panel (6 captions, GTA-style).
- **M2 layouts (M1/M2c/M3):** 8 layouts — strip, three, grid, single, mosaic (6 panels, default in all formats), hero-right, centre-title, comic. All layouts verified by node assertion: normalized cell area sums to 1, no overlaps, crop count equals cell count.
- **M3 fast editor flow:** undo/redo (buttons + Ctrl+Z / Ctrl+Shift+Z), Export all 3 sizes, Auto-fill, Spread, numbered header "1 Photos → 2 Layout & grade → 3 Export", Surprise me (randomizes layout + preset + title/tagline, keeps photos).
- **M4 fields:** editable Tagline, Badge/seal text, Volume, Quote, Quote source — all wired two-way to the render.
- **M5 toggles:** 8 effect/sticker toggles wired to the render (halftone, grain, speed lines, location tags, badge/seal, volume chip, ribbon, quote strip). Default ON except speed lines.
- **M6 title position:** Bottom / Over art / Centre selector in the editor, wired to `state.titlePos`.
- **M3b tall/square fill fix:** M3's move of tall/square to 6-panel Mosaic exposed M2c's `fit:'contain'` on the four new photos, which letterboxed them into small strips with large empty purple bands (worst in tall). M3b switched mosaic tall/square to cover-fit with a top anchor for face panels and adjusted the diner crop. Coordinator eye-checked the re-capture: all six photos fill their cells edge-to-edge in tall and square; wide unchanged.

### Honest limits (verified, not fixed)

- The diner source photo itself cuts the "MAJESTIC" sign: the word runs off the right edge of the 960×1200 frame (coordinator viewed the source). No crop can show the full word from this photo; renders show "MAJEST"/"JEST" depending on format crop.
- The motorboat caption chip ("THE CAPTAIN • MARINA BAY • 9:40 PM") is tight at the right edge of its chip in the wide cover — the time is legible but clipped close to the chip border. Minor cosmetic, left as-is.
- Creator names are not in the staging manifest (`.photo-staging/SOURCES.md` gives titles, licenses and page URLs only); none were invented. Attribution in this log is by file title + license + source URL, which is what CC BY / CC BY-SA require as a minimum alongside the work itself. The skyline photo's EXIF names Joe deSousa (CC0, no attribution required).
- The editor preview sits below the fold at 1280×720 viewport height (page scrolls); this is the existing editor layout, not a regression.
- Four new photos are embedded in `app/index.html` `#sample-photos` (WebP base64, URL-safe, unpadded); `app/samples/` still holds only the two original supplied photographs.

### Fix-r2 validation (coordinator, 20 Nov ~17:45 WIB — supersedes the r1 "Validation" numbers above)

- `node --check` on `app/src/cover.js`, `app/src/main.js`, `app/src/shots.js`: all PASS (verified independently by the coordinator after each milestone).
- Static scan of `app/index.html`, `app/style.css`, `app/src/cover.js`, `app/src/main.js`, `app/src/shots.js`: **0 network references** (no http/https/protocol-relative URLs).
- `main.ts` run twice into separate output dirs: dossiers byte-identical, SHA-256 `a8e0e92dcf082109b822ddf13244907475c54f3770475590b12a5fecd20161b9`; output trees identical. Dossier: schema `makefun/dossier/v1`, 4 images, 14 files/directories, 2,164,325 bytes.
- Screenshots regenerated from the final build (vanilla Chromium via `cdp-shot.mjs`, `serve.ts` on port 8123) and converted to JPEG: `1-cover.jpg` 165,802 bytes (1280×720), `2-editor.jpg` 125,163 bytes (1280×720), `3-cover-portrait.jpg` 229,049 bytes at quality 80 (1024×1280), `4-cover-square.jpg` 217,318 bytes (1024×1024). All four ≤ 256 KiB. (Portrait needed quality 80 — quality 85 was 264,840 bytes, over the limit.)
- Headless Chromium load of the wide cover scene: 0 page console errors (only dbus environment noise in stderr). All four final renders eye-checked by the coordinator: faces whole in all formats, dressing present, 2-layer title, heavy grade, D1–D4 closed, tall/square panels filled.
- No submission performed in this round. Recorder seal and commit are recorded in the coordinator's final report, not here.
