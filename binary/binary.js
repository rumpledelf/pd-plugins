(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const form = root.querySelector('form');
    const input = root.querySelector('input');
    const output = root.querySelector('output');
    const message = root.querySelector('#binary-message');
    if (!form || !input || !output || !message) return;
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const value = input.value.trim();
      if (!/^[+-]?\d+$/.test(value)) {
        message.textContent = 'Enter a whole decimal number, such as 42.';
        input.setAttribute('aria-invalid', 'true');
        return;
      }
      if (value.replace(/^[+-]/, '').length > 1000) {
        message.textContent = 'Try a number with up to 1,000 digits.';
        input.setAttribute('aria-invalid', 'true');
        return;
      }
      input.removeAttribute('aria-invalid');
      output.textContent = BigInt(value).toString(2);
      output.scrollTop = 0;
      message.textContent = '';
    });
    input.addEventListener('input', function () {
      input.removeAttribute('aria-invalid');
      output.textContent = '—';
      message.textContent = '';
    });
  }
  boot(document.getElementById('plugin_binary'));
})();
