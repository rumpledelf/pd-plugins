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
    const stage = root.querySelector('#bounce-stage');
    const ball = root.querySelector('#bounce-ball');
    const shadow = root.querySelector('#bounce-shadow');

    if (!stage || !ball || !shadow) {
      return;
    }

    const gravity = settings.gravity !== undefined ? parseFloat(settings.gravity) : 0.4;

    let y = 180;
    let vy = 0;
    let x = 0;
    let vx = 0;
    let squash = 0;
    let animationFrameId = null;

    function getStageMetrics() {
      const stageHeight = stage.clientHeight || 250;
      const ballHeight = ball.offsetHeight || 40;
      const maxTravel = Math.max(100, stageHeight - ballHeight - 30);
      const maxSideTravel = Math.max(0, (stage.clientWidth - (ball.offsetWidth || 40) * 1.3) / 2);
      return { maxTravel, maxSideTravel };
    }

    function update() {
      const { maxTravel, maxSideTravel } = getStageMetrics();

      x += vx;
      if (x > maxSideTravel) {
        x = maxSideTravel;
        vx = -Math.abs(vx);
      } else if (x < -maxSideTravel) {
        x = -maxSideTravel;
        vx = Math.abs(vx);
      }

      vy -= gravity;
      y += vy;

      squash *= 0.85;

      if (y <= 0) {
        y = 0;
        // Calculate velocity required to bounce to the top of the stage
        vy = Math.sqrt(2 * gravity * maxTravel);
        squash = 0.3;
      }

      if (y > maxTravel) {
        y = maxTravel;
        if (vy > 0) {
          vy = -vy * 0.8;
        }
      }

      render();
    }

    function render() {
      const { maxTravel } = getStageMetrics();
      
      let scaleX = 1;
      let scaleY = 1;

      if (squash > 0.01) {
        scaleX = 1 + squash;
        scaleY = 1 - squash;
      } else if (Math.abs(vy) > 0.5) {
        const stretch = Math.min(0.25, Math.abs(vy) * 0.012);
        scaleX = 1 - stretch;
        scaleY = 1 + stretch;
      }

      ball.style.transform = 'translate(' + x + 'px, ' + (-y) + 'px) scale(' + scaleX + ', ' + scaleY + ')';

      const ratio = maxTravel > 0 ? Math.max(0, Math.min(y / maxTravel, 1)) : 0;
      const shadowScale = 1 - ratio * 0.6;
      const shadowOpacity = 1 - ratio * 0.85;

      shadow.style.transform = 'translateX(' + x + 'px) scale(' + shadowScale + ')';
      shadow.style.opacity = String(shadowOpacity);
    }

    function loop() {
      update();
      animationFrameId = requestAnimationFrame(loop);
    }

    function kick() {
      const direction = vx === 0 ? (Math.random() < 0.5 ? -1 : 1) : -Math.sign(vx);
      vx = direction * (4 + Math.random() * 2);
      vy = Math.sqrt(2 * gravity * getStageMetrics().maxTravel);
      squash = 0.2;
      render();
    }

    ball.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || event.isPrimary === false) return;
      event.preventDefault();
      kick();
    });
    ball.addEventListener('keydown', function (event) {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (!event.repeat) kick();
    });

    loop();

    root.addEventListener('remove', function () {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    });
  }

  boot(document.getElementById('plugin_bounce'));
})();

