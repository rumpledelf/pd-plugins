# Billiards

Solo pocket practice with six object balls. Drag anywhere on the table to aim; that gesture can never shoot. Lift, then start a fresh hold to build power and release to shoot. Arrow keys aim (Shift for larger steps); Space/Enter charges, release shoots. Escape cancels wind-up. New table cancels all motion and restores the rack.

Equal-mass collision impulses, rolling deceleration, cushion rebounds, and adaptive substeps live in `physics.js`. The six pockets are actual cushion openings. Balls visibly descend into pockets; the score updates after the drop. A scratched cue ball respots only after every remaining ball has stopped, in an unoccupied position. No opponent, betting, or formal pool rules.

The table stays landscape on all screens and scales to available width, capped at 520px. Root-scoped SVG, neutral rails/cue, documented host-green felt, no decorative shine or focus effects. Reduced motion simplifies pocket drops; physical ball travel remains visible.

Physics can be loaded directly with Node `require('./physics.js')`; in the browser it attaches only to the host plugin root before the UI boots. No runtime dependencies.

Test: `http://localhost:8080/plugin-tester.html?plugin=billiards`.
