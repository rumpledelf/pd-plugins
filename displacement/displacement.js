(function () {
  function parseSettings(root) {
    try {
      return JSON.parse(root.dataset.pluginSettings || '{}');
    } catch (error) {
      return {};
    }
  }

  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') {
      return;
    }

    root.dataset.pluginBooted = 'true';

    const sandbox = root.querySelector('.displacement-sandbox');
    const glass = root.querySelector('.displacement-glass');
    const marbles = root.querySelectorAll('.displacement-marble');
    const resetBtn = root.querySelector('.displacement-reset-btn');

    if (!sandbox || !glass || !marbles.length || !resetBtn) {
      return;
    }

    // Capture initial parents and positions in the bowl from the inline style attributes
    const initialStates = Array.from(marbles).map(marble => ({
      element: marble,
      parent: sandbox,
      left: marble.style.left,
      top: marble.style.top
    }));

    // Tracks which marbles are currently dropped in the glass
    const droppedMarbles = [];

    // Target positions for 9 marbles (15px) inside the tapered glass with 0px overlap (mathematically precise stacking)
    const glassSlots = [
      { left: '29px', top: '92px' }, // Layer 1 (bottom) - 2 marbles
      { left: '46px', top: '92px' },
      { left: '22px', top: '77px' }, // Layer 2 - 3 marbles (15px height spacing resolves vertical layer overlap)
      { left: '37px', top: '77px' },
      { left: '52px', top: '77px' },
      { left: '22px', top: '62px' }, // Layer 3 - 3 marbles
      { left: '37px', top: '62px' },
      { left: '52px', top: '62px' },
      { left: '37px', top: '47px' }  // Layer 4 (top) - 1 marble
    ];

    // Drag-and-drop state
    let activeMarble = null;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    // Water height animation variables
    let currentVisualHeight = 45; // Base height (45px)
    let targetHeight = 45;
    let waterAnimFrame = null;

    // Updates the SVG water polygon points to match the height
    function drawWater(h) {
      const y = 107 - h;
      // Sloped left/right walls based on 3px outline border
      const xLeft = 28 - 0.144 * h;
      const xRight = 62 + 0.144 * h;
      const waterPoly = glass.querySelector('.displacement-water-poly');
      if (waterPoly) {
        waterPoly.setAttribute('points', `${xLeft.toFixed(1)},${y.toFixed(1)} ${xRight.toFixed(1)},${y.toFixed(1)} 62,107 28,107`);
      }
    }

    // Calculates and animates the rising water level
    function updateWaterLevel() {
      const count = droppedMarbles.length;
      let h = 45; // Base height
      const marbleVolume = 220; // Simulated volume of each marble

      // Tapered physics: since the glass widens as we go up, each marble adds slightly less height
      for (let i = 0; i < count; i++) {
        const width = 34 + 0.288 * h; // width at current height
        h += marbleVolume / width;
      }

      targetHeight = h;

      if (waterAnimFrame) {
        cancelAnimationFrame(waterAnimFrame);
      }

      function animate() {
        const diff = targetHeight - currentVisualHeight;
        if (Math.abs(diff) < 0.1) {
          currentVisualHeight = targetHeight;
          drawWater(currentVisualHeight);
          waterAnimFrame = null;
        } else {
          currentVisualHeight += diff * 0.15; // Smooth Ease-Out transition
          drawWater(currentVisualHeight);
          waterAnimFrame = requestAnimationFrame(animate);
        }
      }

      animate();
    }

    // Initialize drag event listeners
    marbles.forEach(marble => {
      marble.addEventListener('mousedown', startDrag);
      marble.addEventListener('touchstart', startDrag, { passive: false });
    });

    function startDrag(e) {
      if (droppedMarbles.includes(this)) {
        return;
      }

      activeMarble = this;
      activeMarble.classList.remove('animating');
      activeMarble.classList.add('dragging');

      const isTouch = e.type === 'touchstart';
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;

      startX = clientX;
      startY = clientY;
      startLeft = parseFloat(activeMarble.style.left) || 0;
      startTop = parseFloat(activeMarble.style.top) || 0;

      if (isTouch) {
        e.preventDefault();
      }

      window.addEventListener('mousemove', drag);
      window.addEventListener('touchmove', drag, { passive: false });
      window.addEventListener('mouseup', endDrag);
      window.addEventListener('touchend', endDrag);
    }

    function drag(e) {
      if (!activeMarble) return;

      const isTouch = e.type === 'touchmove';
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;

      const dx = clientX - startX;
      const dy = clientY - startY;

      activeMarble.style.left = (startLeft + dx) + 'px';
      activeMarble.style.top = (startTop + dy) + 'px';

      if (isTouch) {
        e.preventDefault();
      }
    }

    function endDrag(e) {
      if (!activeMarble) return;

      const marble = activeMarble;
      activeMarble = null;

      window.removeEventListener('mousemove', drag);
      window.removeEventListener('touchmove', drag);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchend', endDrag);

      marble.classList.remove('dragging');

      const glassRect = glass.getBoundingClientRect();
      const marbleRect = marble.getBoundingClientRect();
      const marbleCenterX = marbleRect.left + marbleRect.width / 2;
      const marbleCenterY = marbleRect.top + marbleRect.height / 2;

      const isInsideGlass = (
        marbleCenterX >= glassRect.left &&
        marbleCenterX <= glassRect.right &&
        marbleCenterY >= glassRect.top &&
        marbleCenterY <= glassRect.bottom
      );

      if (isInsideGlass && droppedMarbles.length < glassSlots.length) {
        droppedMarbles.push(marble);

        const glassLeft = glass.offsetLeft;
        const glassTop = glass.offsetTop;

        const dragLeftInGlass = parseFloat(marble.style.left) - glassLeft;
        const dragTopInGlass = parseFloat(marble.style.top) - glassTop;

        marble.classList.remove('animating');
        glass.appendChild(marble);

        // Position it at its current location within the glass's coordinate space
        marble.style.left = dragLeftInGlass + 'px';
        marble.style.top = dragTopInGlass + 'px';

        // Force a style recalculation
        marble.offsetWidth;

        // Animate down to the next available slot inside the glass
        const slot = glassSlots[droppedMarbles.indexOf(marble)];
        marble.classList.add('animating');
        marble.style.left = slot.left;
        marble.style.top = slot.top;

        updateWaterLevel();
      } else {
        // Return to its original slot in the bowl
        const state = initialStates.find(s => s.element === marble);
        marble.classList.add('animating');
        marble.style.left = state.left;
        marble.style.top = state.top;
      }
    }

    // Reset button handler
    resetBtn.addEventListener('click', function () {
      const glassLeft = glass.offsetLeft;
      const glassTop = glass.offsetTop;

      const currentDropped = [...droppedMarbles];
      droppedMarbles.length = 0;
      updateWaterLevel();

      currentDropped.forEach(marble => {
        const slotIdx = currentDropped.indexOf(marble);
        const slot = glassSlots[slotIdx];

        // Disable animation during DOM transition to avoid visual jumps
        marble.classList.remove('animating');
        sandbox.appendChild(marble);

        // Temporarily hold relative coordinate before starting return transition
        const currentLeftPx = glassLeft + parseFloat(slot.left);
        const currentTopPx = glassTop + parseFloat(slot.top);
        marble.style.left = currentLeftPx + 'px';
        marble.style.top = currentTopPx + 'px';

        // Force a style recalculation
        marble.offsetWidth;

        // Animate back to its starting coordinate inside the bowl
        const state = initialStates.find(s => s.element === marble);
        marble.classList.add('animating');
        marble.style.left = state.left;
        marble.style.top = state.top;
      });

      // Ensure any marbles not currently in the glass are correctly resting in the bowl
      initialStates.forEach(state => {
        const marble = state.element;
        if (!currentDropped.includes(marble)) {
          marble.classList.add('animating');
          marble.style.left = state.left;
          marble.style.top = state.top;
        }
      });
    });
  }

  boot(document.getElementById('plugin_displacement'));
})();
