# Divide

Edit two nonnegative whole numbers (0–999,999), enter a whole-number quotient and remainder, then Check. Show answer reveals both fields. Random generates an exact division; arbitrary inputs may have a remainder. A zero divisor receives a friendly error.

Operand edits clear stale answers, answer edits clear feedback, and Enter checks. Feedback is an inline tick/cross with reserved space; there is no cumulative score.

Test: `http://localhost:8080/plugin-tester.html?plugin=divide`.

Random is grey at the far left. Check and Show answer are stacked below the
answer column. Editing or revealing clears the marker; error explanations
remain in its accessible label and tooltip. No separate visible status area.

Regression tests: `node --test divide/divide.test.cjs`
