# Reference A layout verification · 2026-11-09

Implemented the supplied high-clef and bass-clef design: blue/white surface, compact header/navigation, reading card above score, continuation on its right, stacked mobile and split desktop content, seven answers in 4+3 rows. Header sound switch retains its original accessible button and persistence. The design uses the existing accurate SVG staff/MIDI mapping rather than generated image notation.

## Automated
All passed: audit-fixes.cjs, audio-session.cjs, audio-levels.cjs, panels.cjs, viewport-fit.cjs, chord-layout-states.cjs, phone-layout-states.cjs. CSS expectations updated for the approved reference; phone-practice-css.py passed 240 fixture/state/size/fit-mode combinations. Existing JS byte-for-byte unchanged.

## Actual Chromium browser
33 observations across 319x495, 390x844, 972x494, 1366x768, and one 768x1024 case. Checked high-clef chord first step, keyboard step, completion, bass-clef chord first step and inversion, note combined fourth-step completion, interval intermediate/completion, muted wrong key and final compact header. All observed document overflow=0; no principal bounds outside viewport or reading children outside card. Seven-answer rows verified 4+3, desktop side-by-side and phone stacked. Actual mouse clicks exercised manual second-step entry, repeat key without extra count, reverse-order three keys, next/reset, group switching, record close, relation details open/close and sound toggle.

## Limits
Responsive browser viewports are not physical phones. Physical touch drag, iOS/Android browser behavior, speaker/headphone audibility and timbre have not been verified. Audio program tests validate note frequencies, triggering and mute/recovery, not acoustic output. Keyboard horizontal overflow exists; a physical swipe has not been tested. No claim of universal one-screen fit at every possible size or enlarged accessibility font.

## Mobile staff follow-up
Staff SVGs align to the top of the existing score region on widths up to 760px, instead of vertically centering their music in unused white space. Desktop retains centered SVG placement. Phone piano heights use clamp(64px,12dvh,96px): 84px at 390x700, 96px at 390x844, 64px at 319x495. Staff coordinates and MIDI logic are unchanged.

Actual Chromium: 12 observations: note-key (four sizes), interval-key (three sizes), completed chord (four sizes), bass-clef chord (390x700). Document overflow zero, principal controls in viewport, and all inspected SVG noteheads/labels/clefs inside staff bounds. Reverse-order chord completion and next button clicked. Viewport regression includes explicit mobile/desktop SVG alignment assertions; static CSS fixtures updated and passed. Physical-device touch and acoustic output remain unverified.

## Phone score/key cluster follow-up
Phone exercise region flexes up to 340px instead of absorbing all page height. The score remains top-aligned and the piano follows in the same region. At 390x700 the note-key response top is 492px, versus 589px previously. Desktop unchanged. Existing keyboard 64-96px sizing and horizontal scrolling preserved.

13 actual Chromium observations: note-key prompt at 390x700,390x844,319x495,972x494; note-key completion at 390x700,319x495; interval target-key at 390x700,319x495,972x494; chord key at the same three sizes; completed chord at319x495. Zero observed document vertical overflow, offscreen principal controls, clipped score glyphs, or out-of-card reading content. Reverse-order chord completion and note next were clicked. Visual screenshot inspected at390x700. Program scripts byte-identical; static CSS verifies new phone region bound. Physical phone touch/speaker output still not tested.
