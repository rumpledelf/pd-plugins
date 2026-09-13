# Marbles

Solo ring practice. Drag at the rim to move the shooter around the circle; drag inside the ring to adjust aim. Neither drag fires. Lift and make a fresh stationary hold to build power, then release. A weak shot stops short. Knock all seven marbles completely outside the line. Knocked-out marbles roll a little farther and stay visible outside the circle. The shooter returns to the rim only after everything settles.

Keyboard: Up/Down move around the rim, Left/Right adjust aim, hold Space/Enter for power and release to shoot, Escape cancels. New circle resets mid-shot safely. Touch gestures use the SVG stage's touch-action:none. This larger game uses the same user-requested readable playfield allowance as the other aiming games.

Independent module-side physics: size-weighted elastic impulses with restitution, constant rolling resistance and adaptive substeps. No random outcome or cross-plugin dependency.

Test: `http://localhost:8080/plugin-tester.html?plugin=marbles`. Physics tests: `node --test marbles/physics.test.cjs`.
