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
    let squash = 0;
    let animationFrameId = null;

    function getStageMetrics() {
      const stageHeight = stage.clientHeight || 250;
      const ballHeight = ball.offsetHeight || 40;
      const maxTravel = Math.max(100, stageHeight - ballHeight - 30);
      return { stageHeight, ballHeight, maxTravel };
    }

    function update() {
      const { maxTravel } = getStageMetrics();

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
          vy = 0;
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

      ball.style.transform = 'translateY(' + (-y) + 'px) scale(' + scaleX + ', ' + scaleY + ')';

      const ratio = maxTravel > 0 ? Math.max(0, Math.min(y / maxTravel, 1)) : 0;
      const shadowScale = 1 - ratio * 0.6;
      const shadowOpacity = 1 - ratio * 0.85;

      shadow.style.transform = 'scale(' + shadowScale + ')';
      shadow.style.opacity = String(shadowOpacity);
    }

    function loop() {
      update();
      animationFrameId = requestAnimationFrame(loop);
    }

    loop();

    root.addEventListener('remove', function () {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    });
  }

  boot(document.getElementById('plugin_bounce'));
})();


