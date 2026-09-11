# Quoits

A centered, compact six-ring game with five pegs. Drag left or right to aim, then lift without throwing. A fresh press and hold
anywhere on the board builds power; release that hold to throw. Once a gesture
becomes an aiming drag, it cannot charge or throw until released and pressed again. The thin line underneath shows power, reaching maximum
after 1.6 seconds and staying there. Front pegs score 10, middle pegs 20, and the
back peg 30. Each ring can score once.

Touch, mouse and pen use the whole board as the target. Only the board disables
page scrolling during gestures. Pointer capture allows release outside the board;
interrupted gestures cancel without using a ring. Additional fingers are ignored.

Keyboard: focus the board, use arrow keys to aim, hold Space or Enter to charge,
and release to throw. Escape cancels. New game resets even during a throw.

The module is at most 480px wide, with simple SVG graphics, inherited host
controls, no dependencies, and no settings.

Test through `http://localhost:8080/plugin-tester.html?plugin=quoits` after
starting `python3 -m http.server 8080` from the repository root.
