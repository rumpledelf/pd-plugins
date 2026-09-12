# Roulette

Tap the wheel or use Spin to send the wheel and ball in opposite directions. Both decelerate, and the ball settles inside the exact reported pocket. No betting, chips, payouts or gambling controls.

European single-zero order verified against [Pennsylvania roulette regulations](https://www.pacodeandbulletin.gov/secure/pacode/data/058/chapter617a/chap617atoc.html). Red/black/green pocket colours retain their conventional meaning; red is an activity-specific exception to host accent colours. The 320px wheel keeps 37 numbers legible (362px total).

Result is uniformly sampled from 0–36 using crypto.getRandomValues with rejection sampling. The selected number determines both final ball angle and report. Spin is disabled while moving; reduced motion removes multi-turn spinning and shortens the demonstration.

Test: http://localhost:8080/plugin-tester.html?plugin=roulette
