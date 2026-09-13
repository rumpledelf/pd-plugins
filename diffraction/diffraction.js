(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const canvas = root.querySelector('.diffraction-view');
    const width = root.querySelector('.diffraction-width');
    const spacing = root.querySelector('.diffraction-spacing');
    const ctx = canvas && canvas.getContext('2d');
    if (!ctx || !width || !spacing) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let a = Number(width.value), d = Number(spacing.value), frame = 0;
    const count = 5, center = 93, distance = 90;
    function sinc(x) { return Math.abs(x) < 1e-8 ? 1 : Math.sin(x) / x; }
    function envelope(sine) { return Math.pow(sinc(Math.PI * a * sine), 2); }
    function intensity(sine) {
      const phase = Math.PI * d * sine;
      const denominator = Math.sin(phase);
      const interference = Math.abs(denominator) < 1e-8 ? 1 : Math.pow(Math.sin(count * phase) / (count * denominator), 2);
      return envelope(sine) * interference;
    }
    function line(x1, y1, x2, y2, color, weight) {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = color; ctx.lineWidth = weight || 1; ctx.stroke();
    }
    function draw(now) {
      ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.clearRect(0, 0, 620, 164);
      const bounds = canvas.getBoundingClientRect();
      function label(text, x, y, size, align) {
        ctx.save(); ctx.translate(x, y);
        ctx.scale(620 / Math.max(1, bounds.width), 164 / Math.max(1, bounds.height));
        ctx.font = size + 'px sans-serif'; ctx.fillStyle = '#333333'; ctx.textAlign = align || 'center';
        ctx.fillText(text, 0, 0); ctx.restore();
      }
      label('Light', 57, 17, 13); label('Five slits', 150, 17, 13); label('Screen', 522, 17, 13);
      // The optical path is schematic; screen intensities use exact sin(theta).
      ctx.fillStyle = 'rgba(76,175,80,.07)'; ctx.fillRect(12, 38, 135, 111);
      const shift = reduced.matches ? 0 : (now / 45) % 25;
      for (let x = 15 + shift; x < 138; x += 25) line(x, 41, x, 146, 'rgba(76,175,80,.45)', 1.5);
      line(18, center, 116, center, '#4CAF50', 2);
      ctx.beginPath(); ctx.moveTo(117, center); ctx.lineTo(109, center - 4); ctx.lineTo(109, center + 4); ctx.closePath(); ctx.fillStyle = '#4CAF50'; ctx.fill();
      ctx.fillStyle = '#333333'; ctx.fillRect(146, 34, 8, 118);
      const pitch = d * 2.5, opening = a * 2.5;
      for (let n = -2; n <= 2; n++) {
        const y = center + n * pitch;
        ctx.clearRect(145, y - opening / 2, 10, opening);
        line(146, y, 154, y, '#4CAF50', Math.max(1, opening));
      }
      // Show the directions of the principal maxima, including suppression
      // by the finite slit-width envelope (missing orders).
      for (let order = -4; order <= 4; order++) {
        const sine = order / d;
        if (Math.abs(sine) >= 1) continue;
        const y = center + distance * sine / Math.sqrt(1 - sine * sine);
        if (y < 34 || y > 151) continue;
        const strength = envelope(sine);
        if (strength < .001) continue;
        line(156, center, 437, y, 'rgba(76,175,80,' + (.08 + .24 * Math.sqrt(strength)) + ')', 1.5);
        if (!reduced.matches) {
          const travel = (now / 2400) % 1;
          ctx.beginPath(); ctx.arc(156 + 281 * travel, center + (y - center) * travel, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(76,175,80,' + (.5 * Math.sqrt(strength)) + ')'; ctx.fill();
        }
      }
      ctx.fillStyle = '#111111'; ctx.fillRect(439, 34, 168, 118);
      // Supersampling avoids dropping thin peaks between raster rows.
      for (let row = 0; row < 236; row++) {
        let light = 0;
        for (let sub = 0; sub < 4; sub++) {
          const offset = 34 + (row + (sub + .5) / 4) / 2 - center;
          light += intensity(offset / Math.sqrt(distance * distance + offset * offset)) / 4;
        }
        const visible = Math.pow(Math.max(0, light), .38);
        ctx.fillStyle = 'rgb(' + Math.round(17 + 59 * visible) + ',' + Math.round(17 + 158 * visible) + ',' + Math.round(17 + 63 * visible) + ')';
        ctx.fillRect(440, 34 + row / 2, 166, .5);
      }
      label('Enlarged side view', 177, 157, 10, 'left');
    }
    function animate(now) {
      if (!root.isConnected) return;
      draw(now); if (!reduced.matches) frame = requestAnimationFrame(animate);
    }
    function update() {
      a = Number(width.value); d = Number(spacing.value);
      root.querySelector('.diffraction-width-value').textContent = a.toFixed(1) + ' λ';
      root.querySelector('.diffraction-spacing-value').textContent = d.toFixed(1) + ' λ';
      width.setAttribute('aria-valuetext', a.toFixed(1) + ' wavelengths');
      spacing.setAttribute('aria-valuetext', d.toFixed(1) + ' wavelengths between slit centres');
      canvas.setAttribute('aria-label', 'Five-slit diffraction. Slit width ' + a.toFixed(1) + ', spacing ' + d.toFixed(1) + ' wavelengths. Narrower slits spread light; closer slits move the bright bands farther apart.');
      draw(performance.now());
    }
    width.addEventListener('input', update); spacing.addEventListener('input', update);
    reduced.addEventListener('change', function () { cancelAnimationFrame(frame); animate(performance.now()); });
    update(); animate(performance.now());
  }
  boot(document.getElementById('plugin_diffraction'));
})();
