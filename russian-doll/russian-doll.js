(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const CONFIG = { layers: 5, openTime: 470, extractTime: 550, hopTime: 650, lowerTime: 480, closeTime: 400, lidLift: 112, lidSide: 92, lidAngle: 11, rimClearance: 8, hopHeight: 58 };
    const NS = "http://www.w3.org/2000/svg";
    const BASELINE = 286, CENTRE_X = 290, DOLL_TOP = 172, SPLIT_Y = -76;
    const scaleFor = index => 1.04 - index * .13;
    const palettes = [
      { shell: "#0585BA", dark: "#333333", accent: "#64317B", flower: "orange", leaf: "#4CAF50" },
      { shell: "#4CAF50", dark: "#333333", accent: "#0585BA", flower: "#64317B", leaf: "#4CAF50" },
      { shell: "#B7287E", dark: "#333333", accent: "#0585BA", flower: "#0585BA", leaf: "#4CAF50" },
      { shell: "#64317B", dark: "#333333", accent: "#4CAF50", flower: "#4CAF50", leaf: "#4CAF50" },
      { shell: "orange", dark: "#333333", accent: "#B7287E", flower: "#B7287E", leaf: "#4CAF50" }
    ];
    const stage = root.querySelector('.rd-stage'), loaderSvg = root.querySelector('svg');
    const defs = loaderSvg.querySelector('defs'), dollLayer = root.querySelector('.rd-dolls'), shadowLayer = root.querySelector('.rd-shadows'), hint = root.querySelector('.rd-hint');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const dolls = [], shadows = [], state = [];
    let runToken = 0, revealed = 1, busy = false;
      const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
      const lerp = (a, b, t) => a + (b - a) * t;
      const easeInCubic = t => t * t * t;
      const easeInOutCubic = t => t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
      const easeOutBack = t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      };

      function svgElement(name, attributes = {}) {
        const node = document.createElementNS(NS, name);
        for (const [key, value] of Object.entries(attributes)) {
          node.setAttribute(key, String(value));
        }
        return node;
      }

      function flowerMarkup(palette, variant) {
        const rotate = variant % 2 ? 18 : 0;
        return `
          <g transform="translate(0 -42) rotate(${rotate})">
            <g fill="${palette.flower}" stroke="rgba(51,51,51,.25)" stroke-width="1">
              <ellipse cx="0" cy="-12" rx="8" ry="15" />
              <ellipse cx="0" cy="12" rx="8" ry="15" />
              <ellipse cx="-12" cy="0" rx="15" ry="8" />
              <ellipse cx="12" cy="0" rx="15" ry="8" />
            </g>
            <circle cx="0" cy="0" r="7" fill="white" stroke="rgba(51,51,51,.25)" stroke-width="1" />
            <path d="M-5 19 C-22 18 -25 31 -27 40 C-13 38 -5 31 -2 21" fill="${palette.leaf}" opacity=".95" />
            <path d="M5 19 C22 18 25 31 27 40 C13 38 5 31 2 21" fill="${palette.leaf}" opacity=".95" />
          </g>`;
      }

      function createDoll(index) {
        const palette = palettes[index % palettes.length];
        const dollScale = scaleFor(index);
        const wrapper = svgElement("g", { class: "doll-wrap", "data-doll": index });
        const group = svgElement("g", { class: "doll" });
        const base = svgElement("g", { class: "base" });
        const hole = svgElement("ellipse", {
          class: "opening",
          cx: 0,
          cy: SPLIT_Y,
          rx: 43,
          ry: 9,
          fill: palette.dark,
          opacity: 0
        });
        const cap = svgElement("g", { class: "cap" });

        const clipId = `russian-doll-reveal-${index}`;
        const clipPath = svgElement("clipPath", {
          id: clipId,
          clipPathUnits: "userSpaceOnUse"
        });
        const clipRect = svgElement("rect", {
          x: -2000,
          y: -2000,
          width: 4000,
          height: 4000
        });
        clipPath.appendChild(clipRect);
        defs.appendChild(clipPath);

        base.innerHTML = `
          <path class="doll-shell" d="M-52 -76 C-57 -51 -48 -24 -30 -8 C-14 5 14 5 30 -8 C48 -24 57 -51 52 -76 Z" fill="${palette.shell}" />
          <path d="M-31 -71 C-29 -46 -24 -23 0 -12 C24 -23 29 -46 31 -71 C18 -66 -18 -66 -31 -71 Z" fill="white" stroke="rgba(51,51,51,.22)" stroke-width="1.1" />
          ${flowerMarkup(palette, index)}
          <path class="fine-line" d="M-47 -75 Q0 -68 47 -75" />
        `;

        cap.innerHTML = `
          <path class="doll-shell" d="M-52 -76 C-58 -110 -48 -153 -16 -170 C-7 -175 7 -175 16 -170 C48 -153 58 -110 52 -76 Z" fill="${palette.shell}" />
          <path d="M-45 -126 C-39 -151 -23 -168 0 -172 C23 -168 39 -151 45 -126 C31 -137 19 -142 0 -142 C-19 -142 -31 -137 -45 -126 Z" fill="${palette.dark}" opacity=".56" />
          <ellipse cx="0" cy="-127" rx="25" ry="29" fill="white" stroke="rgba(51,51,51,.20)" stroke-width="1" />
          <path d="M-21 -139 Q0 -158 21 -139 Q11 -146 0 -143 Q-11 -146 -21 -139 Z" fill="#333333" opacity=".86" />
          <path class="fine-line" d="M-13 -128 q4 -4 8 0 M5 -128 q4 -4 8 0" />
          <circle cx="-9" cy="-127" r="1.6" fill="#333333" />
          <circle cx="9" cy="-127" r="1.6" fill="#333333" />
          <ellipse cx="-17" cy="-118" rx="5.5" ry="3.2" fill="#B7287E" opacity=".34" />
          <ellipse cx="17" cy="-118" rx="5.5" ry="3.2" fill="#B7287E" opacity=".34" />
          <path d="M-6 -114 Q0 -109 6 -114" fill="none" stroke="#B7287E" stroke-width="1.3" stroke-linecap="round" />
          <path d="M-42 -96 C-28 -89 28 -89 42 -96 L49 -78 C28 -72 -28 -72 -49 -78 Z" fill="${palette.dark}" opacity=".58" />
          <circle cx="0" cy="-87" r="5.5" fill="${palette.accent}" stroke="rgba(51,51,51,.22)" stroke-width="1" />
        `;

        group.append(base, hole, cap);
        wrapper.appendChild(group);
        dollLayer.appendChild(wrapper);

        const shadow = svgElement("ellipse", {
          cx: 0,
          cy: 0,
          rx: 47 * dollScale,
          ry: 7 * dollScale,
          fill: "#333333",
          opacity: 0
        });
        shadowLayer.appendChild(shadow);

        dolls.push({ wrapper, group, cap, hole, clipRect, clipId });
        shadows.push(shadow);
        state.push({
          x: CENTRE_X,
          y: BASELINE,
          scale: dollScale,
          opacity: 0,
          capOpen: 0,
          tilt: 0,
          shadowOpacity: 0,
          shadowScale: 1,
          clipY: null
        });
      }

      function positions() {
        const centres = [150];
        for (let i = 1; i < CONFIG.layers; i++) {
          centres.push(centres[i - 1] + 56 * (scaleFor(i - 1) + scaleFor(i)) + 16);
        }
        return centres;
      }

      function rimY(parentIndex) {
        const parent = state[parentIndex];
        return parent.y + SPLIT_Y * parent.scale;
      }

      function insideY(parentIndex, childIndex) {
        // Put the child's crown just below the parent's rim. The clipping window
        // then makes it genuinely appear from inside rather than through the shell.
        return rimY(parentIndex) + DOLL_TOP * state[childIndex].scale + 6;
      }

      function clearY(parentIndex) {
        return rimY(parentIndex) - CONFIG.rimClearance * state[parentIndex].scale;
      }

      function setClip(index, clipY) {
        state[index].clipY = clipY;
      }

      function renderOne(index) {
        const s = state[index];
        const { wrapper, group, cap, hole, clipRect, clipId } = dolls[index];
        group.setAttribute(
          "transform",
          `translate(${s.x.toFixed(2)} ${s.y.toFixed(2)}) rotate(${s.tilt.toFixed(2)}) scale(${s.scale})`
        );
        wrapper.setAttribute("opacity", s.opacity.toFixed(3));
        wrapper.setAttribute("pointer-events", s.opacity > 0 ? "auto" : "none");

        const openAmount = clamp(s.capOpen, 0, 1.16);
        const lift = -CONFIG.lidLift * openAmount;
        const side = -CONFIG.lidSide * openAmount;
        const angle = -CONFIG.lidAngle * openAmount;
        cap.setAttribute(
          "transform",
          `translate(${side.toFixed(2)} ${lift.toFixed(2)}) rotate(${angle.toFixed(2)} 0 ${SPLIT_Y})`
        );
        hole.setAttribute("opacity", clamp(s.capOpen).toFixed(3));

        if (s.clipY === null) {
          wrapper.removeAttribute("clip-path");
        } else {
          wrapper.setAttribute("clip-path", `url(#${clipId})`);
          clipRect.setAttribute("height", Math.max(0, s.clipY + 2000).toFixed(2));
        }

        const shadowWidth = 47 * s.scale * s.shadowScale;
        const shadowHeight = 7 * s.scale * (0.86 + 0.14 * s.shadowScale);
        shadows[index].setAttribute("cx", s.x.toFixed(2));
        shadows[index].setAttribute("cy", (BASELINE + 3).toFixed(2));
        shadows[index].setAttribute("rx", shadowWidth.toFixed(2));
        shadows[index].setAttribute("ry", shadowHeight.toFixed(2));
        shadows[index].setAttribute("opacity", (0.20 * s.shadowOpacity).toFixed(3));
      }

      function renderAll() {
        for (let i = 0; i < CONFIG.layers; i += 1) renderOne(i);
      }

      function resetScene(showAll = false) {
        const p = positions();
        for (let i = 0; i < CONFIG.layers; i += 1) {
          Object.assign(state[i], {
            x: showAll ? p[i] : p[Math.max(0, i - 1)],
            y: BASELINE,
            opacity: showAll || i === 0 ? 1 : 0,
            capOpen: 0,
            tilt: 0,
            shadowOpacity: showAll || i === 0 ? 1 : 0,
            shadowScale: 1,
            clipY: null
          });
        }
        renderAll();
      }

      function animate(duration, token, update) {
        return new Promise(resolve => {
          let previous = performance.now();
          let elapsed = 0;

          function frame(now) {
            if (token !== runToken || !root.isConnected) return resolve(false);

            const delta = Math.min(48, now - previous);
            previous = now;

            {
              elapsed += delta * (reduced.matches ? 6 : 1);
              const progress = clamp(elapsed / duration);
              update(progress);
              renderAll();
              if (progress >= 1) return resolve(true);
            }

            requestAnimationFrame(frame);
          }

          requestAnimationFrame(frame);
        });
      }

      const wait = (duration, token) => animate(duration, token, () => {});

      async function openCap(index, token) {
        const from = state[index].capOpen;
        return animate(CONFIG.openTime, token, progress => {
          state[index].capOpen = lerp(from, 1, easeOutBack(progress));
        });
      }

      async function closeCap(index, token) {
        const from = state[index].capOpen;
        return animate(CONFIG.closeTime, token, progress => {
          state[index].capOpen = lerp(from, 0, easeInOutCubic(progress));
        });
      }

      async function extractChild(childIndex, token) {
        const parentIndex = childIndex - 1;
        const child = state[childIndex];
        const parentX = state[parentIndex].x;
        const startY = insideY(parentIndex, childIndex);
        const targetY = clearY(parentIndex);
        const clippingY = rimY(parentIndex) + 1;

        Object.assign(child, {
          x: parentX,
          y: startY,
          opacity: 1,
          tilt: 0,
          shadowOpacity: 0,
          shadowScale: 0.78
        });
        setClip(childIndex, clippingY);
        renderOne(childIndex);

        const completed = await animate(CONFIG.extractTime, token, progress => {
          const rise = easeOutCubic(progress);
          child.y = lerp(startY, targetY, rise);
          child.tilt = Math.sin(Math.PI * progress) * 1.8;
        });

        if (completed) {
          Object.assign(child, { y: targetY, tilt: 0 });
          setClip(childIndex, null);
          renderOne(childIndex);
        }
        return completed;
      }

      async function hopToLanding(childIndex, token) {
        const p = positions();
        const parentIndex = childIndex - 1;
        const child = state[childIndex];
        const startX = state[parentIndex].x;
        const startY = clearY(parentIndex);
        const targetX = p[childIndex];
        const height = CONFIG.hopHeight * state[parentIndex].scale;

        const completed = await animate(CONFIG.hopTime, token, progress => {
          const travel = easeInOutCubic(progress);
          const arc = Math.sin(Math.PI * travel);
          const settle = progress > 0.84
            ? Math.sin(((progress - 0.84) / 0.16) * Math.PI) * 5 * child.scale
            : 0;

          child.x = lerp(startX, targetX, travel);
          child.y = lerp(startY, BASELINE, travel) - height * arc - settle;
          child.tilt = 5.2 * Math.sin(Math.PI * travel) * (1 - progress);
          child.shadowOpacity = easeInOutCubic(clamp((progress - 0.42) / 0.58));
          child.shadowScale = lerp(0.70, 1, easeInOutCubic(clamp((progress - 0.38) / 0.62)));
        });

        if (completed) {
          Object.assign(child, {
            x: targetX,
            y: BASELINE,
            opacity: 1,
            tilt: 0,
            shadowOpacity: 1,
            shadowScale: 1,
            clipY: null
          });
          renderOne(childIndex);
        }
        return completed;
      }

      async function hopToOpening(childIndex, token) {
        const parentIndex = childIndex - 1;
        const child = state[childIndex];
        const startX = child.x;
        const startY = child.y;
        const targetX = state[parentIndex].x;
        const targetY = clearY(parentIndex);
        const height = CONFIG.hopHeight * 0.92 * state[parentIndex].scale;

        const completed = await animate(CONFIG.hopTime * 0.90, token, progress => {
          const travel = easeInOutCubic(progress);
          const arc = Math.sin(Math.PI * travel);
          child.x = lerp(startX, targetX, travel);
          child.y = lerp(startY, targetY, travel) - height * arc;
          child.tilt = -4.6 * Math.sin(Math.PI * travel) * (1 - progress);
          child.shadowOpacity = 1 - easeInOutCubic(clamp(progress / 0.68));
          child.shadowScale = lerp(1, 0.70, easeInOutCubic(clamp(progress / 0.72)));
        });

        if (completed) {
          Object.assign(child, {
            x: targetX,
            y: targetY,
            tilt: 0,
            shadowOpacity: 0,
            shadowScale: 0.78
          });
          renderOne(childIndex);
        }
        return completed;
      }

      async function lowerInside(childIndex, token) {
        const parentIndex = childIndex - 1;
        const child = state[childIndex];
        const startY = clearY(parentIndex);
        const targetY = insideY(parentIndex, childIndex);
        const clippingY = rimY(parentIndex) + 1;

        setClip(childIndex, clippingY);
        renderOne(childIndex);

        const completed = await animate(CONFIG.lowerTime, token, progress => {
          const drop = easeInCubic(progress);
          child.y = lerp(startY, targetY, drop);
          child.tilt = -Math.sin(Math.PI * progress) * 1.4;
        });

        if (completed) {
          Object.assign(child, {
            y: targetY,
            opacity: 0,
            tilt: 0,
            shadowOpacity: 0,
            shadowScale: 1,
            capOpen: 0
          });
          setClip(childIndex, null);
          renderOne(childIndex);
        }
        return completed;
      }


    function ready() {
      busy = false;
      stage.setAttribute('aria-disabled', 'false');
      const done = revealed === CONFIG.layers;
      hint.textContent = done ? 'All five! Click to nest them again.' : revealed === 1 ? 'Click the doll to open it.' : 'Click the smallest doll to open it.';
      stage.setAttribute('aria-label', done ? 'Nest all five dolls again' : revealed === 1 ? 'Open the Russian doll' : 'Open the smallest Russian doll');
      dolls.forEach((doll, i) => doll.group.classList.toggle('rd-current', i === revealed - 1));
    }
    async function activate() {
      if (busy) return;
      busy = true;
      stage.setAttribute('aria-disabled', 'true');
      const token = ++runToken;
      hint.textContent = revealed === CONFIG.layers ? 'Back inside, one by one…' : 'There’s a smaller one inside…';
      if (revealed < CONFIG.layers) {
        const parent = revealed - 1;
        if (!await openCap(parent, token)) return;
        if (!await extractChild(revealed, token)) return;
        if (!await hopToLanding(revealed, token)) return;
        if (!await closeCap(parent, token)) return;
        revealed++;
      } else {
        for (let parent = CONFIG.layers - 2; parent >= 0; parent--) {
          if (!await openCap(parent, token)) return;
          if (!await hopToOpening(parent + 1, token)) return;
          if (!await lowerInside(parent + 1, token)) return;
          if (!await closeCap(parent, token)) return;
        }
        revealed = 1;
        resetScene();
      }
      ready();
    }
    for (let i = 0; i < CONFIG.layers; i++) createDoll(i);
    resetScene();
    ready();
    stage.addEventListener('click', event => {
      const doll = event.target.closest('[data-doll]');
      if (revealed === CONFIG.layers || (doll && Number(doll.dataset.doll) === revealed - 1)) activate();
    });
    stage.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
    });
  }
  boot(document.getElementById('plugin_russian-doll'));
})();
