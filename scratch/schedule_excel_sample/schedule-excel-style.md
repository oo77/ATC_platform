# Schedule Excel export restyle — commit 293f0f0 (main, not pushed, prod not rebuilt)

File: server/utils/scheduleExcel.ts (+ tests/server/utils/scheduleExcel.test.ts, 14 pass)

- Font "Montserrat ExtraBold" everywhere, all strings uppercased at the end of build (no bold/italic flags).
- Palette: the user's screenshot circles the SECOND row of "Цвета темы" (light 80% tints), black column crossed out —
  not the base row. 9 fills written as theme+tint refs (theme 4,9,6,5,8,7,3 tint 0.8; theme 2 tint -0.1; theme 0 tint -0.05),
  i.e. exactly what Excel's palette applies. Workbook theme = ExcelJS's Office 2007 theme (same palette as the screenshot).
- assignGroupColors(): weighted greedy colouring; same-row nearest neighbours 1000, vertical 100, diagonal 10, same row 2.
  Week 23–29.11.2026: 18 groups → 9 colours, 0 horizontal / 0 vertical same-colour neighbours.
- Group text black; continuing groups (continuingGroupIds) dark red C00000. "продолжение" label kept.
- Discipline > 3 words → first 3 words + NBSP + "..." (full name stays in the cell note).
- Row height = lines × 1.3 × size + 4pt; wrap estimate counts uppercase width and hyphen breaks.
- Montserrat is NOT installed on this PC → render checked with Verdana Bold as a width proxy
  (schedule_sample_render_verdana_proxy.png). Real-font look must be checked on the user's PC: schedule_sample_2026-11-23.xlsx.
- Accident fixed: first commit swept in the user's staged renames (ecosystem.config.cjs, cert-* routes); amended out and
  their index restored exactly (still RM).
