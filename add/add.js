(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const form = root.querySelector('.arithmetic-module');
    const first = root.querySelector('.arithmetic-first');
    const second = root.querySelector('.arithmetic-second');
    const answer = root.querySelector('.arithmetic-answer');
    const status = root.querySelector('.arithmetic-status');
    if (!form || !first || !second || !answer || !status) return;
    function message(text, tone) {
      status.textContent = text ? (tone === 'greentext' ? '✓' : '✗') : '';
      status.className = 'arithmetic-status arithmetic-result' + (text ? ' ' + (tone === 'greentext' ? 'greentext' : 'magentatext') : '');
      status.setAttribute('aria-label', text);
      status.title = text;
    }
    function clear() { answer.value = ''; message(''); }
    function operands() {
      const a = first.value.trim(), b = second.value.trim();
      if (!a || !b) { message('Enter both numbers first.'); return null; }
      if (!/^[+-]?\d{1,12}$/.test(a) || !/^[+-]?\d{1,12}$/.test(b)) {
        message('Use whole numbers, up to 12 digits each.'); return null;
      }
      return [BigInt(a), BigInt(b)];
    }
    function result() {
      const values = operands();
      return values ? values[0] + values[1] : null;
    }
    function newNumbers() {
      let a = Math.floor(Math.random() * 21), b = Math.floor(Math.random() * 21);

      if (String(a) === first.value && String(b) === second.value) a++;
      first.value = String(a); second.value = String(b); clear();
    }
    first.addEventListener('input', clear);
    second.addEventListener('input', clear);
    answer.addEventListener('input', function () { message(''); });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const expected = result();
      if (expected === null) return;
      const value = answer.value.trim();
      if (!/^[+-]?\d{1,13}$/.test(value)) {
        message(value ? 'Enter a whole-number answer.' : 'Enter your answer first.'); answer.focus(); return;
      }
      const correct = BigInt(value) === expected;
      message(correct ? '✓ Correct.' : '✗ Try again.', correct ? 'greentext' : 'magentatext');
    });
    root.querySelector('.arithmetic-reveal').addEventListener('click', function () {
      const expected = result();
      if (expected === null) return;
      answer.value = expected.toString(); message('');
    });
    root.querySelector('.arithmetic-new').addEventListener('click', newNumbers);
    newNumbers();
  }
  boot(document.getElementById('plugin_add'));
})();
