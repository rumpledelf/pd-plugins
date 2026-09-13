# Subtract

Two editable whole numbers and an answer field. Check validates the answer; Show answer reveals it; Random generates another small pair. Generated subtraction stays nonnegative, but edited operands and answers may be negative. Editing either operand clears stale answers and feedback.

Exact integer arithmetic uses BigInt, accepting up to 12 digits per operand and 13 per answer. No cumulative scoring. Enter submits Check. Feedback is a tick/cross in reserved space immediately after the answer.

Test: http://localhost:8080/plugin-tester.html?plugin=subtract

Random is grey at the far left. Check and Show answer are stacked below the
answer column. Editing or revealing clears the marker; error explanations
remain in its accessible label and tooltip. No separate visible status area.

Regression tests: `node --test subtract/subtract.test.cjs`
