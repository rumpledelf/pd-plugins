# Maze

A nine-by-nine mouse-to-cheese maze. The mouse starts outside an opening on the
left; the cheese is outside a separate exit at the bottom right.

Generation adapts [ROT.js DividedMaze](https://github.com/ondras/rot.js/blob/master/src/map/dividedmaze.ts)
by Ondrej Zara, under the BSD-3-Clause licence retained in ROT-LICENSE.txt.
The source algorithm is preserved, with a supplied RNG and conversion to the
plugin's wall-bit representation. It is bundled locally, not fetched at runtime.
The interaction, rendering, reachability check and layout-quality filter are
plugin-specific. The filter favours routes of at least 29 cells, six branching
decisions, 14 actual direction changes, no straight solution run longer than
four cells, and 10 dead ends across the maze. Recursive
division builds longer continuous walls with openings instead of many short
wall stubs.

Host copyright-page entry: Maze generation adapted from ROT.js DividedMaze,
copyright Ondrej Zara, BSD-3-Clause. Source:
https://github.com/ondras/rot.js/blob/master/src/map/dividedmaze.ts
The full notice is bundled as ROT-LICENSE.txt and should be linked or reproduced
on the main website's third-party copyright page. That host page has not been
edited from this repository.

Drag the mouse through corridors, swipe elsewhere on the maze for a single step, use the arrow buttons, or focus the maze and use keyboard arrows. Drag segments are sampled at most four logical pixels apart; every mouse step must cross one open edge. Walls block both fast drags and normal movement. New maze resets the position and any celebration.

The playfield is up to330px square for legible corridors, using the user's larger-game allowance. No decorative shine or visual focus indicators. Reduced motion skips the arrival wiggle.

Test: http://localhost:8080/plugin-tester.html?plugin=maze

## Future standalone game

Robyn identified Maze as a good candidate for an expanded freestanding game.
Keep the dictionary activity small; a standalone version could add maze sizes,
difficulty levels, themes and dedicated touch controls. This is a future-product
note, not approval to build it now. Recorded in Photodir's docs/ROADMAP.md under
Later.
