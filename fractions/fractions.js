(function () {
  function parseSettings(root) {
    try {
      return JSON.parse(root.dataset.pluginSettings || '{}');
    } catch (error) {
      return {};
    }
  }

  function createSVGElement(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const key in attrs) {
      el.setAttribute(key, attrs[key]);
    }
    return el;
  }

  // Pre-generate toppings carefully arranged over the pizza
  function generateToppings() {
    const toppings = [];

    // Pepperoni (type 0) - including left, right, and lower quadrant slices
    const peps = [
      { cx: 100, cy: 52 },
      { cx: 100, cy: 148 },
      { cx: 82, cy: 90 },
      { cx: 118, cy: 90 },
      { cx: 100, cy: 120 },
      { cx: 58, cy: 100 },  // Left pepperoni
      { cx: 142, cy: 100 }, // Right pepperoni
      { cx: 66, cy: 68 },
      { cx: 134, cy: 68 },
      { cx: 68, cy: 130 },  // Lower-left pepperoni
      { cx: 132, cy: 130 }   // Lower-right pepperoni
    ];
    peps.forEach(function (p) {
      toppings.push({ type: 0, cx: p.cx, cy: p.cy, angle: 0 });
    });

    // Olives (type 1) - smaller rings
    const olives = [
      { cx: 85, cy: 58 },
      { cx: 115, cy: 58 },
      { cx: 148, cy: 80 },
      { cx: 52, cy: 80 },
      { cx: 74, cy: 108 },
      { cx: 126, cy: 108 },
      { cx: 100, cy: 75 },
      { cx: 100, cy: 136 },
      { cx: 140, cy: 146 },
      { cx: 60, cy: 146 }
    ];
    olives.forEach(function (o) {
      toppings.push({ type: 1, cx: o.cx, cy: o.cy, angle: 0 });
    });

    // Capsicums (type 2) - placed in open gaps away from pepperoni tops
    const capsicums = [
      { cx: 68, cy: 50, angle: 0.35 },
      { cx: 132, cy: 50, angle: 2.4 },
      { cx: 48, cy: 120, angle: 1.4 },
      { cx: 152, cy: 120, angle: 4.8 },
      { cx: 82, cy: 150, angle: 3.5 },
      { cx: 118, cy: 150, angle: 5.2 },
      { cx: 100, cy: 102, angle: 0.8 }
    ];
    capsicums.forEach(function (c) {
      toppings.push({ type: 2, cx: c.cx, cy: c.cy, angle: c.angle });
    });

    // Pineapples (type 3)
    const pineapples = [
      { cx: 100, cy: 66, angle: 0.5 },
      { cx: 86, cy: 114, angle: 1.2 },
      { cx: 114, cy: 114, angle: 2.8 },
      { cx: 56, cy: 82, angle: 4.1 },
      { cx: 144, cy: 82, angle: 5.5 },
      { cx: 72, cy: 96, angle: 2.0 },
      { cx: 128, cy: 96, angle: 3.7 },
      { cx: 100, cy: 156, angle: 0.9 }
    ];
    pineapples.forEach(function (pn) {
      toppings.push({ type: 3, cx: pn.cx, cy: pn.cy, angle: pn.angle });
    });

    return toppings;
  }

  function renderBasePizza(svg, toppings) {
    // 1. Plate (White background with thin whitesmoke/gainsboro rim)
    const plate = createSVGElement('circle', {
      cx: '100',
      cy: '100',
      r: '95',
      fill: 'white',
      stroke: '#E8E8E8',
      'stroke-width': '3'
    });
    svg.appendChild(plate);

    // Plate inner accent ring
    const plateRing = createSVGElement('circle', {
      cx: '100',
      cy: '100',
      r: '88',
      fill: 'none',
      stroke: '#F2F2F2',
      'stroke-width': '1.5'
    });
    svg.appendChild(plateRing);

    // 2. Pizza Group (contains dough, sauce, cheese, toppings)
    const pizzaGroup = createSVGElement('g', { id: 'fractions-pizza-base' });

    // Dough Crust
    const crust = createSVGElement('circle', {
      cx: '100',
      cy: '100',
      r: '84',
      fill: '#E5C384',
      stroke: '#B88B46',
      'stroke-width': '2.5'
    });
    pizzaGroup.appendChild(crust);

    // Tomato Sauce Base
    const sauce = createSVGElement('circle', {
      cx: '100',
      cy: '100',
      r: '73',
      fill: '#D9411E'
    });
    pizzaGroup.appendChild(sauce);

    // Cheese Layer
    const cheese = createSVGElement('circle', {
      cx: '100',
      cy: '100',
      r: '70',
      fill: '#FFA012',
      opacity: '0.9'
    });
    pizzaGroup.appendChild(cheese);

    // Cheese Swirls/Highlights
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      const rx = 100 + 40 * Math.cos(a + 0.2);
      const ry = 100 + 40 * Math.sin(a + 0.2);
      const spot = createSVGElement('circle', {
        cx: rx.toFixed(1),
        cy: ry.toFixed(1),
        r: '12',
        fill: '#FFB830',
        opacity: '0.7'
      });
      pizzaGroup.appendChild(spot);
    }

    // Toppings Group
    const toppingsGroup = createSVGElement('g', { id: 'fractions-toppings' });

    toppings.forEach(function (t) {
      if (t.type === 0) {
        // Pepperoni circle (slightly larger)
        const pep = createSVGElement('circle', {
          cx: t.cx.toFixed(1),
          cy: t.cy.toFixed(1),
          r: '10',
          fill: '#B71C1C',
          stroke: '#7F0000',
          'stroke-width': '1.2'
        });
        // Pepperoni speckle
        const spec = createSVGElement('circle', {
          cx: (t.cx + 2.5).toFixed(1),
          cy: (t.cy - 2).toFixed(1),
          r: '2.5',
          fill: '#D32F2F',
          opacity: '0.6'
        });
        toppingsGroup.appendChild(pep);
        toppingsGroup.appendChild(spec);
      } else if (t.type === 1) {
        // Site-purple olive donut (#64317B) - smaller size
        const olive = createSVGElement('circle', {
          cx: t.cx.toFixed(1),
          cy: t.cy.toFixed(1),
          r: '4.8',
          fill: 'none',
          stroke: '#64317B',
          'stroke-width': '2.8'
        });
        toppingsGroup.appendChild(olive);
      } else if (t.type === 2) {
        // Site-green capsicum thick arc (#4CAF50) with randomized rotation angle
        const rotationAngle = (t.angle * (180 / Math.PI) + 45) % 360;
        const path = createSVGElement('path', {
          d: `M ${(t.cx - 7).toFixed(1)} ${(t.cy - 2).toFixed(1)} A 9 9 0 0 1 ${(t.cx + 7).toFixed(1)} ${(t.cy + 3).toFixed(1)}`,
          fill: 'none',
          stroke: '#4CAF50',
          'stroke-width': '3.5',
          'stroke-linecap': 'round',
          transform: `rotate(${rotationAngle.toFixed(1)} ${t.cx.toFixed(1)} ${t.cy.toFixed(1)})`
        });
        toppingsGroup.appendChild(path);
      } else if (t.type === 3) {
        // Yellow pineapple triangle
        const r = 7;
        const p1x = t.cx + r * Math.cos(t.angle);
        const p1y = t.cy + r * Math.sin(t.angle);
        const p2x = t.cx + r * Math.cos(t.angle + 2.1);
        const p2y = t.cy + r * Math.sin(t.angle + 2.1);
        const p3x = t.cx + r * Math.cos(t.angle + 4.2);
        const p3y = t.cy + r * Math.sin(t.angle + 4.2);

        const pineapple = createSVGElement('polygon', {
          points: `${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)} ${p3x.toFixed(1)},${p3y.toFixed(1)}`,
          fill: '#FFD60A',
          stroke: '#E6B800',
          'stroke-width': '0.8'
        });
        toppingsGroup.appendChild(pineapple);
      }
    });

    pizzaGroup.appendChild(toppingsGroup);
    svg.appendChild(pizzaGroup);

    // Layer for Cut Lines
    const cutsGroup = createSVGElement('g', { id: 'fractions-cuts-layer' });
    svg.appendChild(cutsGroup);

    // Layer for Slice Overlays (Fading Slices)
    const overlaysGroup = createSVGElement('g', { id: 'fractions-overlays-layer' });
    svg.appendChild(overlaysGroup);
  }

  function getCutLines(denominator) {
    const lines = [];
    const radius = 84.5;

    if (denominator === 2) {
      // 1 line through center vertically
      lines.push({ x1: 100, y1: 100 - radius, x2: 100, y2: 100 + radius });
    } else if (denominator === 4) {
      // 2 lines: vertical and horizontal
      lines.push({ x1: 100, y1: 100 - radius, x2: 100, y2: 100 + radius });
      lines.push({ x1: 100 - radius, y1: 100, x2: 100 + radius, y2: 100 });
    } else if (denominator === 6) {
      // 3 lines through center (0deg, 60deg, 120deg)
      for (let i = 0; i < 3; i++) {
        const rad = -Math.PI / 2 + (i * Math.PI) / 3;
        const x1 = 100 + radius * Math.cos(rad);
        const y1 = 100 + radius * Math.sin(rad);
        const x2 = 100 - radius * Math.cos(rad);
        const y2 = 100 - radius * Math.sin(rad);
        lines.push({ x1, y1, x2, y2 });
      }
    } else if (denominator === 3) {
      // 3 rays from center to edge (at -90deg, 30deg, 150deg)
      for (let i = 0; i < 3; i++) {
        const rad = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
        const x2 = 100 + radius * Math.cos(rad);
        const y2 = 100 + radius * Math.sin(rad);
        lines.push({ x1: 100, y1: 100, x2, y2 });
      }
    }
    return lines;
  }

  function getSliceWedgePath(sliceIndex, denominator) {
    const radius = 85.5;
    const startAngle = -Math.PI / 2 + (sliceIndex * 2 * Math.PI) / denominator;
    const endAngle = -Math.PI / 2 + ((sliceIndex + 1) * 2 * Math.PI) / denominator;

    const x1 = 100 + radius * Math.cos(startAngle);
    const y1 = 100 + radius * Math.sin(startAngle);
    const x2 = 100 + radius * Math.cos(endAngle);
    const y2 = 100 + radius * Math.sin(endAngle);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M 100 100 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
  }

  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') {
      return;
    }
    root.dataset.pluginBooted = 'true';

    const settings = parseSettings(root);
    const pizzaWrap = root.querySelector('#fractions-pizza-wrap');
    const status = root.querySelector('#fractions-status');
    const radioInputs = root.querySelectorAll('input[name="fractions-choice"]');

    if (!pizzaWrap) {
      return;
    }

    // Construct Main SVG
    const svg = createSVGElement('svg', {
      viewBox: '0 0 200 200',
      class: 'fractions-pizza-svg',
      'aria-label': 'Interactive Pizza Fraction Visualizer'
    });
    pizzaWrap.appendChild(svg);

    const toppings = generateToppings();
    renderBasePizza(svg, toppings);

    const cutsLayer = svg.querySelector('#fractions-cuts-layer');
    const overlaysLayer = svg.querySelector('#fractions-overlays-layer');

    let activeTimeouts = [];

    function clearPendingAnimations() {
      activeTimeouts.forEach(clearTimeout);
      activeTimeouts = [];
      if (cutsLayer) cutsLayer.innerHTML = '';
      if (overlaysLayer) overlaysLayer.innerHTML = '';
    }

    const fractionNames = {
      '1/2': { num: 1, den: 2, label: 'One half' },
      '1/4': { num: 1, den: 4, label: 'One quarter' },
      '1/3': { num: 1, den: 3, label: 'One third' },
      '2/3': { num: 2, den: 3, label: 'Two thirds' },
      '3/4': { num: 3, den: 4, label: 'Three quarters' },
      '1/6': { num: 1, den: 6, label: 'One sixth' }
    };

    function applyFraction(val) {
      clearPendingAnimations();

      const info = fractionNames[val] || { num: 1, den: 2, label: 'One half' };
      const num = info.num;
      const den = info.den;

      if (status) {
        status.textContent = 'Cutting pizza...';
        status.className = 'fractions-status greytext';
      }

      const cutLines = getCutLines(den);
      const lineElements = [];

      // Create cut line elements
      cutLines.forEach(function (line) {
        const dx = line.x2 - line.x1;
        const dy = line.y2 - line.y1;
        const length = Math.sqrt(dx * dx + dy * dy);

        const lineEl = createSVGElement('line', {
          x1: line.x1.toFixed(1),
          y1: line.y1.toFixed(1),
          x2: line.x2.toFixed(1),
          y2: line.y2.toFixed(1),
          stroke: '#3E2723',
          'stroke-width': '2.5',
          'stroke-linecap': 'round',
          'stroke-dasharray': length.toFixed(1),
          'stroke-dashoffset': length.toFixed(1),
          class: 'fractions-cut-line'
        });
        cutsLayer.appendChild(lineEl);
        lineElements.push({ el: lineEl, length });
      });

      // Animate line cuts sequentially
      let delay = 50;
      lineElements.forEach(function (item) {
        const t = setTimeout(function () {
          item.el.style.strokeDashoffset = '0';
        }, delay);
        activeTimeouts.push(t);
        delay += 320;
      });

      // After all cut lines finish, fade out non-selected slices
      const totalCutTime = delay + 100;
      const slicesToRemove = den - num;

      const tCutEnd = setTimeout(function () {
        if (status) {
          status.textContent = 'Removing slice' + (slicesToRemove > 1 ? 's' : '') + '...';
        }

        let fadeDelay = 0;
        // Fade out slices from index `num` to `den - 1`
        for (let i = num; i < den; i++) {
          const sliceIndex = i;
          const tf = setTimeout(function () {
            const pathD = getSliceWedgePath(sliceIndex, den);
            const overlay = createSVGElement('path', {
              d: pathD,
              fill: 'white',
              opacity: '0',
              class: 'fractions-slice-overlay'
            });
            overlaysLayer.appendChild(overlay);

            // Trigger CSS fade transition
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                overlay.style.opacity = '1';
              });
            });
          }, fadeDelay);

          activeTimeouts.push(tf);
          fadeDelay += 350;
        }

        // Final status message after fading completes
        const tFinal = setTimeout(function () {
          if (status) {
            status.textContent = `${num} of ${den} slices remaining (${val} - ${info.label})`;
            status.className = 'fractions-status greentext';
          }
        }, fadeDelay + 250);

        activeTimeouts.push(tFinal);
      }, totalCutTime);

      activeTimeouts.push(tCutEnd);
    }

    // Listen for radio selection changes
    radioInputs.forEach(function (input) {
      input.addEventListener('change', function () {
        if (input.checked) {
          applyFraction(input.value);
        }
      });
    });

    // Check if initial fraction is explicitly set in settings
    const initialVal = settings.default_fraction && fractionNames[settings.default_fraction]
      ? settings.default_fraction
      : null;

    if (initialVal) {
      radioInputs.forEach(function (input) {
        if (input.value === initialVal) {
          input.checked = true;
        }
      });
      applyFraction(initialVal);
    } else {
      radioInputs.forEach(function (input) {
        input.checked = false;
      });
      if (status) {
        status.textContent = 'Select a fraction to cut the pizza';
        status.className = 'fractions-status greentext';
      }
    }
  }

  boot(document.getElementById('plugin_fractions'));
})();
