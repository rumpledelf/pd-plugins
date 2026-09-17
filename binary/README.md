# Binary

Bidirectional decimal/binary converter. Uses BigInt to preserve exact integers,
including values above JavaScript's Number precision limit. Enter a value on one
side only; both sides validate integer input. Negative numbers retain their
minus sign (not a fixed-width two's-complement representation).

Test at `plugin-tester.html?plugin=binary`.
