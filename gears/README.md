# Gears

Drag either gear, use arrow keys while focused, or press Play. Reverse changes the driven direction; choose 12, 18, 27, 36, 54 or 72 teeth independently for either gear. Turn ratios update, while the marked teeth show opposite directions and relative speeds. The view fits the pair without changing their relative size. No decorative shine or visual focus indicators.

Geometry uses sampled 20° involute flanks, a common module of 3.6, addendum one module and dedendum 1.25 modules. Pitch-circle radii determine centre spacing. The phase relation is `θ₂ = π + π/N₂ − θ₁N₁/N₂`, placing a tooth opposite a gap and preserving the tooth-count ratio. Small clearance is included between teeth. This is an educational spur-gear drawing, not a manufacturing profile.

Geometry is locally testable via `require('./geometry.js')`. No dependencies or cross-plugin runtime calls. Playback is user-initiated, pauses when hidden and uses slower motion with reduced-motion preferences.

Run `node gears/geometry.test.cjs` to check independent polygon-edge intersections across 540 meshing phases and all three angular ratios.

Test: `http://localhost:8080/plugin-tester.html?plugin=gears`.
