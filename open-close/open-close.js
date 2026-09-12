(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const scene = root.querySelector('.oc-scene');
    const caption = root.querySelector('.oc-caption');
    let open = false;
    function toggle() {
      open = !open;
      scene.classList.toggle('is-open', open);
      scene.setAttribute('aria-pressed', String(open));
      scene.setAttribute('aria-label', open ? 'Close the door' : 'Open the door');
      caption.textContent = open ? 'Open. Click to close.' : 'Closed. Click to open.';
    }
    scene.addEventListener('click', toggle);
    scene.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!event.repeat) toggle();
      }
    });
  }
  boot(document.getElementById('plugin_open-close'));
})();
