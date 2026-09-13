# Area

Starts blank. Choose rectangle, triangle, circle, enter positive dimensions, and calculate. Only the selected shape's dimensions are required.

Units: cm, m, in, ft. The grouped selector converts entered measurements and an existing result; it does not relabel numbers. Canonical dimensions are stored in metres and preserved across switches, avoiding cumulative rounding. Converted inputs retain 12 significant digits; area results show at most two decimal places. Results use square units. Nonfinite, zero, and negative dimensions are rejected.

A labelled shape diagram sits to the left of the dimensions, spanning two rows.
It is illustrative rather than drawn to scale. The diagram and fields keep the
same reserved height for every shape. All dimension inputs use the same host
text-field styling with a decimal keyboard hint.

Regression tests: `node --test area/area.test.cjs`

Test: http://localhost:8080/plugin-tester.html?plugin=area
