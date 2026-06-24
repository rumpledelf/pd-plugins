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
    const canvas = root.querySelector('#speed-canvas');
    const slider = root.querySelector('#speed-slider');
    const sliderLabel = root.querySelector('.speed-slider-label');

    if (sliderLabel && settings.slider_label) {
      sliderLabel.textContent = settings.slider_label;
    }

    if (!canvas || !slider) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    let cycleTime = 0;
    let frameId = 0;

    const torsoLen = 64;
    const headRadius = 15;
    const thighLen = 48;
    const shinLen = 46;
    const bicepLen = 34;
    const forearmLen = 30;

    const walkMatrix = [
      [0.38, 0.02, -0.35, 0.35],
      [0.20, 0.08, -0.15, 0.30],
      [-0.02, 0.02, 0.05, 0.25],
      [-0.22, 0.04, 0.20, 0.30],
      [-0.38, 0.15, 0.38, 0.35],
      [-0.15, 0.45, 0.18, 0.30],
      [0.12, 0.30, -0.05, 0.25],
      [0.32, 0.08, -0.22, 0.35]
    ];

    const runMatrix = [
      [0.72, 0.15, -0.85, 1.45],
      [0.38, 0.60, -0.50, 1.50],
      [-0.12, 0.70, 0.05, 1.40],
      [-0.58, 0.25, 0.55, 1.30],
      [-0.78, 0.12, 0.80, 1.20],
      [-0.48, 1.35, 0.60, 1.35],
      [-0.08, 1.70, 0.12, 1.45],
      [0.48, 0.85, -0.45, 1.50]
    ];

    function sampleGait(progress, matrix) {
      const steps = matrix.length;
      const index = Math.floor(progress * steps) % steps;
      const nextIndex = (index + 1) % steps;
      const t = (progress * steps) % 1;
      const smoothT = t * t * (3 - 2 * t);
      const current = matrix[index];
      const next = matrix[nextIndex];
      const angles = [];

      for (let i = 0; i < 4; i += 1) {
        angles.push(current[i] + (next[i] - current[i]) * smoothT);
      }

      return angles;
    }

    function drawSegment(startX, startY, rot1, len1, rot2, len2, isLeg) {
      const jointX = startX + Math.sin(rot1) * len1;
      const jointY = startY + Math.cos(rot1) * len1;
      const targetRot2 = isLeg ? (rot1 - rot2) : (rot1 + rot2);
      const endX = jointX + Math.sin(targetRot2) * len2;
      const endY = jointY + Math.cos(targetRot2) * len2;

      ctx.lineTo(jointX, jointY);
      ctx.lineTo(endX, endY);
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const blend = parseFloat(slider.value || settings.default_speed || 0);
      const speed = 0.009 + (blend * 0.021);
      const lean = blend * 0.28;
      const bounceAmp = 1.0 + (blend * 17);
      const cx = canvas.width / 2;
      const groundY = canvas.height - 32;

      cycleTime = (cycleTime + speed) % 1;

      const hipBounce = Math.abs(Math.sin(cycleTime * Math.PI * 2)) * bounceAmp;
      const hipY = groundY - (thighLen + shinLen + 8) + (blend * 8) - hipBounce;
      const hipX = cx - (blend * 12);
      const neckX = hipX + Math.sin(lean) * torsoLen;
      const neckY = hipY - Math.cos(lean) * torsoLen;
      const headX = neckX + Math.sin(lean) * headRadius;
      const headY = neckY - Math.cos(lean) * headRadius;

      ctx.strokeStyle = '#b3b3b3';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(50, groundY);
      ctx.lineTo(canvas.width - 50, groundY);
      ctx.stroke();

      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const wFore = sampleGait(cycleTime, walkMatrix);
      const rFore = sampleGait(cycleTime, runMatrix);
      const wBack = sampleGait((cycleTime + 0.5) % 1, walkMatrix);
      const rBack = sampleGait((cycleTime + 0.5) % 1, runMatrix);
      const lerp = function (a, b, alpha) {
        return a + (b - a) * alpha;
      };
      const fore = wFore.map(function (value, index) {
        return lerp(value, rFore[index], blend);
      });
      const back = wBack.map(function (value, index) {
        return lerp(value, rBack[index], blend);
      });

      ctx.strokeStyle = '#4f4f4f';
      ctx.beginPath();
      ctx.moveTo(neckX, neckY);
      drawSegment(neckX, neckY, -back[2], bicepLen, back[3], forearmLen, false);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      drawSegment(hipX, hipY, back[0], thighLen, back[1], shinLen, true);
      ctx.stroke();

      ctx.strokeStyle = '#222222';
      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(neckX, neckY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(neckX, neckY);
      drawSegment(neckX, neckY, -fore[2], bicepLen, fore[3], forearmLen, false);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      drawSegment(hipX, hipY, fore[0], thighLen, fore[1], shinLen, true);
      ctx.stroke();

      frameId = window.requestAnimationFrame(animate);
    }

    if (settings.default_speed !== undefined) {
      slider.value = String(settings.default_speed);
    }

    animate();

    root.addEventListener('remove', function () {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    });
  }

  boot(document.getElementById('plugin_speed'));
})();
