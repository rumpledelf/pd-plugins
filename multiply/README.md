# Multiply

Editable integer multiplication with Check, Show answer and Random.
Generated factors range from 0 to 12. Exact BigInt calculation supports negative
and large integers (up to 100 digits per factor). Editing a factor clears the
previous answer and feedback.

Test at `plugin-tester.html?plugin=multiply`.

Random is grey at the far left. Check and Show answer are stacked below the
answer column. Editing or revealing clears the marker; error explanations
remain in its accessible label and tooltip. No separate visible status area.

Regression tests: `node --test multiply/multiply.test.cjs`
