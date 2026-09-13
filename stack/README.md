# Stack

Drag any block onto another block to stack it. Any block can be the base, anywhere
on the floor; there is no special centre target. Blocks snap level on top of the
chosen stack instead of overlapping. Drops away from stacks settle into free
floor space. Taking out a block lets the remaining stack settle neatly. There
is no score; stacking all five gives a short completion message.

Keyboard: focus the activity, Enter chooses another block, arrows lift and move it, Space picks up or drops it. Shift-arrows move faster. Reset returns all five blocks to the floor. Cancelled touch gestures restore the previous arrangement.

Touch handling uses pointer capture and touch-action:none on the SVG stage. Generous invisible hit areas surround the blocks. Reduced motion shortens settling. 250px total.

Test: http://localhost:8080/plugin-tester.html?plugin=stack
