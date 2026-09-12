# Kaleidoscope

Drag or twist the view to tumble flat coloured triangles, squares, pentagons and ovals. Arrow keys turn it; Space gives the pieces a tumble. Shake briefly rocks the view and jostles the same pieces inside, then lets them coast and settle. It does not regenerate their shapes, sizes or colours. Reduced motion omits the rocking and uses a gentler, shorter tumble.

During a shake, the loose flat pieces can slide over each other and exchange places. Wall collisions keep them inside; piece separation resumes when the shake ends so they do not settle into one overlapping lump.

A single 30-degree source wedge is reflected alternately across twelve sectors, with thin grey mirror seams and a grey rim. Pixel mapping folds each angle into that wedge, avoiding the gaps made by antialiased clip boundaries. The pattern is genuinely mirrored, not simply repeated. Blue, purple, magenta, green and orange pieces keep their drawn sizes while coasting and settling. Collision footprints allow partial overlap but stop all the pieces collapsing onto one point. Reduced motion shortens and reduces movement.

250px activity, host palette, no shine or focus-colour changes. Touch capture and touch-action:none are on the canvas itself. No dependencies.

Test: http://localhost:8080/plugin-tester.html?plugin=kaleidoscope
