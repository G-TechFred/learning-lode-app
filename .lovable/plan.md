
# GES Localisation Plan (Ghana Primary & JHS)

Scope is large, so I'll ship it in three focused phases. You asked to **start with academic levels and trimesters** — that's Phase 1, which I'll build now. Phases 2 and 3 follow on your go-ahead.

---

## Phase 1 — Academic Structure & Trimesters (build now)

**Data model changes in `src/routes/index.tsx`**
- Add constants:
  - `LEVELS = ["Basic 1"…"Basic 6", "JHS 1", "JHS 2", "JHS 3"]`
  - `STREAMS = ["A", "B", "Unique", "Gold", "Silver"]` (editable)
  - `TERMS = ["Term 1", "Term 2", "Term 3"]`
  - `ACADEMIC_YEARS = ["2024/2025", "2025/2026", "2026/2027"]`
- Replace `class: "10-A"` on Student with `level` + `stream` (derived `class = "${level} ${stream}"`).
- Re-seed the 6 mock students across Basic 4 A, Basic 5 B, JHS 1 Unique, JHS 2 A, etc. so the roster reflects a Ghanaian school on first load.

**UI additions (Teacher view)**
- New **Term switcher** in the top navbar: Academic Year select + Term 1/2/3 tabs. Selection stored in state and shown in dashboard header ("JHS 2 Unique — Term 2, 2025/2026").
- Roster filter widened: filter by **Level** and **Stream** in addition to search.
- Teacher-only Students dropdown groups students by `Level → Stream`.

**Landing / login copy**
- "Class 10-A" style copy replaced with GES labels throughout.

Deliverable: term + level/stream selection works end-to-end, and every existing screen already displays the Ghanaian class labels. No grading logic changes yet — grades still store a single number so nothing breaks.

---

## Phase 2 — GES Grading (SBA + Exams) & Curriculum Subjects

- Split grade shape from `number` → `{ classScore: number; examScore: number }`.
- Add configurable **SBA weight** (default 50%, toggle 30%) and compute `total = classScore*w + examScore*(1-w)`.
- Subject list becomes **level-aware**:
  - Primary: English, Mathematics, Integrated Science, OWOP, Creative Arts, RME, Ghanaian Language.
  - JHS: English, Mathematics, Integrated Science, Social Studies, ICT, RME, Creative Arts & Design, Ghanaian Language.
- Rewrite the Quick Entry dialog + Enter Performance page to accept both scores per subject, with validation (0–{max}, required, weight sums to 100).
- Update all charts / status logic to read `total`.
- Grade letters follow GES scale (A1 80–100, B2 75–79, B3 70–74, C4 65–69, C5 60–64, C6 55–59, D7 50–54, E8 45–49, F9 0–44) with descriptive remarks.

## Phase 3 — Terminal Report Card

- New `/report/:studentId` inspired route rendered in-app (printable via `window.print()` + a print stylesheet).
- Pulls student details, term/year, attendance summary, per-subject **Class Score / Exam Score / Total / Position / Grade / Remark**, class average, and positions computed across the student's stream for the active term.
- Sections for **Class Teacher's Remarks**, **Headmaster's Remarks & Signature**, promoted-to line, next-term reopening date.
- "Download / Print Report" button in Teacher view (per student) and in Parent/Student view (own report).

---

## Technical notes
- State stays in the existing single-page component and browser storage for local previews. No authentication or database service is connected; do not enter real student data. Production use requires choosing and configuring a backend.
- Report positions are computed from filtered stream + term data, so they update as scores change.

---

Approving this plan starts Phase 1 immediately. Say "continue" after Phase 1 to move to Phase 2, and again for Phase 3 — or ask for tweaks to any phase before I build it.
