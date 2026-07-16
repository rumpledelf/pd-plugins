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

    const settings = parseSettings(root);

    // Coordinate & Physical Constants
    const Y_PIVOT = 200;
    const X_SLOTS = [90, 160, 230, 300, 370, 440, 510];

    // State Variables
    let fulcrumX = 300;
    let beamAngle = 0;
    let draggedBoulder = null;
    let dragOffset = { x: 0, y: 0 };
    let isDragging = false;
    let isDraggingFulcrum = false;
    let activeSlotIndex = -1;

    // Animation targets and drag position tracking
    let targetFulcrumX = 300;
    let targetBeamAngle = 0;
    let animId = null;
    let draggedX = 0;
    let draggedY = 0;

    // Boulder configuration and state tracking
    const boulderData = {
      'boulder-large': { id: 'boulder-large', mass: 8, height: 80, element: null, state: 'grass', slot: null, grassPos: { x: 150, y: 385 } },
      'boulder-medium': { id: 'boulder-medium', mass: 4, height: 58, element: null, state: 'grass', slot: null, grassPos: { x: 250, y: 385 } },
      'boulder-small': { id: 'boulder-small', mass: 2, height: 42, element: null, state: 'grass', slot: null, grassPos: { x: 350, y: 385 } },
      'boulder-micro': { id: 'boulder-micro', mass: 1, height: 30, element: null, state: 'grass', slot: null, grassPos: { x: 430, y: 385 } }
    };

    // Stacks for each of the 7 slots
    const slotStacks = [[], [], [], [], [], [], []];

    // DOM References
    const svg = root.querySelector('#lever-svg');
    const fulcrum = root.querySelector('#fulcrum');
    const beamGroup = root.querySelector('#beam-group');
    const bouldersContainer = root.querySelector('#boulders-container');
    const resetButton = root.querySelector('#reset-button');
    const balanceStatus = root.querySelector('#balance-status');

    // Helper: Translate client page coords to local SVG coordinates
    function getSVGCoords(e) {
      const pt = svg.createSVGPoint();
      let clientX = 0;
      let clientY = 0;
      
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      pt.x = clientX;
      pt.y = clientY;
      
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    }

    // Helper: Calculate global SVG position of a rotated local coordinate on the beam
    function localToGlobal(xLocal, yLocal, fx, angleDeg) {
      const angleRad = angleDeg * Math.PI / 180;
      const dx = xLocal - fx;
      const dy = yLocal - Y_PIVOT;
      
      const xGlobal = fx + dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
      const yGlobal = Y_PIVOT + dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
      
      return { x: xGlobal, y: yGlobal };
    }

    // Helper: Calculate rotational limits to prevent beam clipping
    function getMaxTiltAngle(fx) {
      const L_left = fx - 50;
      const L_right = 550 - fx;
      const H = 80; // Height from pivot (160) to grass level (240)
      
      let maxCcw = 20; // Cap tilt for aesthetics
      if (L_left > H) {
        maxCcw = Math.asin(H / L_left) * 180 / Math.PI;
      } else {
        maxCcw = 90;
      }
      
      let maxCw = 20;
      if (L_right > H) {
        maxCw = Math.asin(H / L_right) * 180 / Math.PI;
      } else {
        maxCw = 90;
      }
      
      return {
        ccw: Math.min(20, maxCcw),
        cw: Math.min(20, maxCw)
      };
    }

    // Dynamic Slot Visual Highlights
    function highlightSlot(s) {
      const circles = root.querySelectorAll('.slot-circle');
      circles.forEach((circle, idx) => {
        if (idx === s) {
          circle.setAttribute('r', '8');
          circle.style.fill = '#4CAF50';
          circle.style.stroke = '#ffffff';
          circle.style.strokeWidth = '2px';
        } else {
          circle.setAttribute('r', '5');
          circle.style.fill = '';
          circle.style.stroke = '';
          circle.style.strokeWidth = '';
        }
      });
    }

    function clearSlotHighlights() {
      const circles = root.querySelectorAll('.slot-circle');
      circles.forEach((circle) => {
        circle.setAttribute('r', '5');
        circle.style.fill = '';
        circle.style.stroke = '';
        circle.style.strokeWidth = '';
      });
    }

    // Determine nearest slot and apply highlights
    function checkNearestSlot(bX, bY) {
      let minD = Infinity;
      let nearestS = -1;
      for (let s = 0; s < 7; s++) {
        let stackH = 0;
        const stack = slotStacks[s];
        for (let i = 0; i < stack.length; i++) {
          stackH += stack[i].height;
        }
        const localY = 180 - stackH;
        
        const slotCoords = localToGlobal(X_SLOTS[s], localY, fulcrumX, beamAngle);
        const dx = bX - slotCoords.x;
        const dy = bY - slotCoords.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < minD) {
          minD = d;
          nearestS = s;
        }
      }
      
      if (minD < 40) {
        activeSlotIndex = nearestS;
        highlightSlot(nearestS);
      } else {
        activeSlotIndex = -1;
        clearSlotHighlights();
      }
    }

    // Position boulders inside a slot stack
    function updateStackLayout(s) {
      const stack = slotStacks[s];
      let sumH = 0;
      for (let i = 0; i < stack.length; i++) {
        const b = stack[i];
        b.state = 'beam';
        b.slot = s;
        const localX = X_SLOTS[s];
        const localY = 180 - sumH;
        
        b.element.classList.add('snapping');
        b.element.setAttribute('transform', `translate(${localX}, ${localY})`);
        
        setTimeout(() => {
          b.element.classList.remove('snapping');
        }, 200);
        
        sumH += b.height;
      }
    }

    // Smooth Animation Loop using requestAnimationFrame
    function startAnimationLoop() {
      if (animId !== null) return;
      
      function tick() {
        // 1. Interpolate visual fulcrum position
        const dx = targetFulcrumX - fulcrumX;
        fulcrumX += dx * 0.15;
        
        // 2. Calculate torque at current visual fulcrumX
        let rawTorque = 0;
        for (let s = 0; s < 7; s++) {
          const stack = slotStacks[s];
          for (let i = 0; i < stack.length; i++) {
            const b = stack[i];
            rawTorque += b.mass * (X_SLOTS[s] - fulcrumX);
          }
        }
        // Add beam weight torque centered at 300
        const beamMass = 2;
        rawTorque += beamMass * (300 - fulcrumX);
        const torque = rawTorque / 70;
        
        // 3. Determine target angle
        const bounds = getMaxTiltAngle(fulcrumX);
        const isBalanced = Math.abs(torque) < 0.05;
        let angle = 0;
        if (isBalanced) {
          angle = 0;
        } else if (torque > 0) {
          angle = bounds.cw;
        } else {
          angle = -bounds.ccw;
        }
        targetBeamAngle = angle;
        
        // 4. Interpolate beam angle
        const da = targetBeamAngle - beamAngle;
        beamAngle += da * 0.15;
        
        // 5. Update DOM attributes and transforms in sync
        fulcrum.setAttribute('points', `${fulcrumX - 46},280 ${fulcrumX},200 ${fulcrumX + 46},280`);
        beamGroup.style.transformOrigin = `${fulcrumX}px ${Y_PIVOT}px`;
        beamGroup.style.transform = `rotate(${beamAngle}deg)`;
        
        // 6. Update Status text display
        const finalIsBalanced = Math.abs(beamAngle) < 0.05;
        if (finalIsBalanced) {
          balanceStatus.textContent = 'Balanced';
          balanceStatus.className = 'balance-state status-balanced';
        } else {
          balanceStatus.textContent = beamAngle > 0 ? 'Tilted Right' : 'Tilted Left';
          balanceStatus.className = 'balance-state status-unbalanced';
        }
        
        // 7. Recalculate snap targets if a boulder is currently being dragged
        if (isDragging && draggedBoulder) {
          checkNearestSlot(draggedX, draggedY);
        }
        
        // Continue or stop loop
        if (Math.abs(dx) < 0.05 && Math.abs(da) < 0.05) {
          fulcrumX = targetFulcrumX;
          beamAngle = targetBeamAngle;
          
          fulcrum.setAttribute('points', `${fulcrumX - 46},280 ${fulcrumX},200 ${fulcrumX + 46},280`);
          beamGroup.style.transformOrigin = `${fulcrumX}px ${Y_PIVOT}px`;
          beamGroup.style.transform = `rotate(${beamAngle}deg)`;
          
          animId = null;
        } else {
          animId = requestAnimationFrame(tick);
        }
      }
      
      animId = requestAnimationFrame(tick);
    }

    // Main Calculations
    function updateEquilibrium() {
      startAnimationLoop();
    }

    // Fulcrum Direct Drag Actions
    function startDragFulcrum(e) {
      e.preventDefault();
      isDraggingFulcrum = true;
      fulcrum.classList.add('dragging');
      
      window.addEventListener('mousemove', onMoveFulcrum);
      window.addEventListener('touchmove', onMoveFulcrum, { passive: false });
      window.addEventListener('mouseup', onEndFulcrum);
      window.addEventListener('touchend', onEndFulcrum);
    }

    function onMoveFulcrum(e) {
      if (!isDraggingFulcrum) return;
      e.preventDefault();
      
      const pointerPos = getSVGCoords(e);
      const px = pointerPos.x;
      
      let nearestS = 3;
      let minD = Infinity;
      for (let s = 0; s < 7; s++) {
        const d = Math.abs(px - X_SLOTS[s]);
        if (d < minD) {
          minD = d;
          nearestS = s;
        }
      }
      
      if (X_SLOTS[nearestS] !== targetFulcrumX) {
        targetFulcrumX = X_SLOTS[nearestS];
        startAnimationLoop();
      }
    }

    function onEndFulcrum(e) {
      if (!isDraggingFulcrum) return;
      isDraggingFulcrum = false;
      fulcrum.classList.remove('dragging');
      
      window.removeEventListener('mousemove', onMoveFulcrum);
      window.removeEventListener('touchmove', onMoveFulcrum);
      window.removeEventListener('mouseup', onEndFulcrum);
      window.removeEventListener('touchend', onEndFulcrum);
    }

    // Drag Actions
    function startDrag(e, boulder) {
      e.preventDefault();
      draggedBoulder = boulder;
      isDragging = true;
      
      // Hide ground shadow when picked up
      const shadowId = '#shadow-' + boulder.id.split('-')[1];
      const shadow = root.querySelector(shadowId);
      if (shadow) {
        shadow.style.opacity = '0';
      }
      
      const pointerPos = getSVGCoords(e);
      let currentX, currentY;
      
      if (boulder.state === 'beam') {
        // Find position in slot stack
        const s = boulder.slot;
        const idx = slotStacks[s].indexOf(boulder);
        if (idx !== -1) {
          slotStacks[s].splice(idx, 1);
        }
        updateStackLayout(s);
        
        // Find local coordinates on beam
        let sumH = 0;
        for (let i = 0; i < idx; i++) {
          sumH += slotStacks[s][i].height;
        }
        const localX = X_SLOTS[s];
        const localY = 180 - sumH;
        
        // Convert to rotated global coords to avoid jarring jumping shifts
        const globalCoords = localToGlobal(localX, localY, fulcrumX, beamAngle);
        currentX = globalCoords.x;
        currentY = globalCoords.y;
        
        // Reparent to the global boulders container
        bouldersContainer.appendChild(boulder.element);
        boulder.element.setAttribute('transform', `translate(${currentX}, ${currentY})`);
      } else {
        currentX = boulder.grassPos.x;
        currentY = boulder.grassPos.y;
      }
      
      dragOffset.x = pointerPos.x - currentX;
      dragOffset.y = pointerPos.y - currentY;
      draggedX = currentX;
      draggedY = currentY;
      
      boulder.element.classList.add('dragging');
      boulder.element.classList.remove('snapping');
      
      // Wire up temporary document-wide events for duration of dragging
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);
      
      updateEquilibrium();
    }

    function onMove(e) {
      if (!isDragging || !draggedBoulder) return;
      e.preventDefault();
      
      const pointerPos = getSVGCoords(e);
      const newX = pointerPos.x - dragOffset.x;
      const newY = pointerPos.y - dragOffset.y;
      
      draggedBoulder.element.setAttribute('transform', `translate(${newX}, ${newY})`);
      
      draggedX = newX;
      draggedY = newY;
      
      checkNearestSlot(newX, newY);
    }

    function onEnd(e) {
      if (!isDragging || !draggedBoulder) return;
      isDragging = false;
      
      const boulder = draggedBoulder;
      draggedBoulder = null;
      
      boulder.element.classList.remove('dragging');
      clearSlotHighlights();
      
      // Unbind document events
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
      
      if (activeSlotIndex !== -1) {
        // Snap onto the active slot
        const s = activeSlotIndex;
        slotStacks[s].push(boulder);
        beamGroup.appendChild(boulder.element);
        updateStackLayout(s);
      } else {
        // Return to starting position on the grass deck
        boulder.state = 'grass';
        boulder.slot = null;
        
        boulder.element.classList.add('snapping');
        boulder.element.setAttribute('transform', `translate(${boulder.grassPos.x}, ${boulder.grassPos.y})`);
        
        // Restore ground shadow
        const shadowId = '#shadow-' + boulder.id.split('-')[1];
        const shadow = root.querySelector(shadowId);
        if (shadow) {
          shadow.style.opacity = '1';
        }
        
        setTimeout(() => {
          boulder.element.classList.remove('snapping');
        }, 200);
      }
      
      updateEquilibrium();
    }

    // Initialize Boulder & Fulcrum Instances
    function initBoulders() {
      for (const id in boulderData) {
        const el = root.querySelector('#' + id);
        if (el) {
          boulderData[id].element = el;
          el.addEventListener('mousedown', (e) => startDrag(e, boulderData[id]));
          el.addEventListener('touchstart', (e) => startDrag(e, boulderData[id]), { passive: false });
        }
      }
      
      // Wire up direct fulcrum drag
      fulcrum.addEventListener('mousedown', startDragFulcrum);
      fulcrum.addEventListener('touchstart', startDragFulcrum, { passive: false });
    }

    // Reset button handler
    resetButton.addEventListener('click', () => {
      targetFulcrumX = 300;
      
      // Restore all ground shadows
      const shadows = root.querySelectorAll('.boulder-shadow');
      shadows.forEach(s => s.style.opacity = '1');
      
      for (const id in boulderData) {
        const b = boulderData[id];
        b.state = 'grass';
        b.slot = null;
        
        b.element.classList.add('snapping');
        b.element.setAttribute('transform', `translate(${b.grassPos.x}, ${b.grassPos.y})`);
        
        if (b.element.parentNode !== bouldersContainer) {
          bouldersContainer.appendChild(b.element);
        }
        
        setTimeout(() => {
          b.element.classList.remove('snapping');
        }, 200);
      }
      
      for (let s = 0; s < 7; s++) {
        slotStacks[s] = [];
      }
      
      updateEquilibrium();
    });

    // Initialize
    initBoulders();
    updateEquilibrium();
  }

  boot(document.getElementById('plugin_lever'));
})();
