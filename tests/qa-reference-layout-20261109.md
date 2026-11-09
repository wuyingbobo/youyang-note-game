# Reference A layout verification · 2026-11-09

Implemented the supplied high-clef and bass-clef design: blue/white surface, compact header/navigation, reading card above score, continuation on its right, stacked mobile and split desktop content, seven answers in 4+3 rows. Header sound switch retains its original accessible button and persistence. The design uses the existing accurate SVG staff/MIDI mapping rather than generated image notation.

## Automated
All passed: audit-fixes.cjs, audio-session.cjs, audio-levels.cjs, panels.cjs, viewport-fit.cjs, chord-layout-states.cjs, phone-layout-states.cjs. CSS expectations updated for the approved reference; phone-practice-css.py passed 240 fixture/state/size/fit-mode combinations. Existing JS byte-for-byte unchanged.

## Actual Chromium browser
33 observations across 319x495, 390x844, 972x494, 1366x768, and one 768x1024 case. Checked high-clef chord first step, keyboard step, completion, bass-clef chord first step and inversion, note combined fourth-step completion, interval intermediate/completion, muted wrong key and final compact header. All observed document overflow=0; no principal bounds outside viewport or reading children outside card. Seven-answer rows verified 4+3, desktop side-by-side and phone stacked. Actual mouse clicks exercised manual second-step entry, repeat key without extra count, reverse-order three keys, next/reset, group switching, record close, relation details open/close and sound toggle.

## Limits
Responsive browser viewports are not physical phones. Physical touch drag, iOS/Android browser behavior, speaker/headphone audibility and timbre have not been verified. Audio program tests validate note frequencies, triggering and mute/recovery, not acoustic output. Keyboard horizontal overflow exists; a physical swipe has not been tested. No claim of universal one-screen fit at every possible size or enlarged accessibility font.
