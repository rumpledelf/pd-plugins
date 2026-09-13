(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const form = root.querySelector('form');
    const first = root.querySelector('.multiply-first');
    const second = root.querySelector('.multiply-second');
    const answer = root.querySelector('.multiply-answer');
    const feedback = root.querySelector('#multiply-feedback');
    if (!form || !first || !second || !answer || !feedback) return;
    function message(text, correct) {
      feedback.textContent = text ? (correct === true ? '✓' : '✗') : '';
      feedback.className = 'arithmetic-result' + (text ? (correct === true ? ' greentext' : ' magentatext') : '');
      feedback.setAttribute('aria-label', text);
      feedback.title = text;
    }
    function integer(input) {
      const value = input.value.trim();
      if (!/^[+-]?\d+$/.test(value) || value.replace(/^[+-]/, '').length > 100) {
        input.setAttribute('aria-invalid', 'true');
        return null;
      }
      input.removeAttribute('aria-invalid');
      return BigInt(value);
    }
    function result() {
      const a = integer(first), b = integer(second);
      if (a === null || b === null) { message('Enter two whole numbers, up to 100 digits each.', false); return null; }
      return a * b;
    }
    function clear() {
      answer.value = ''; message('');
      [first, second, answer].forEach(input => input.removeAttribute('aria-invalid'));
    }
    first.addEventListener('input', clear); second.addEventListener('input', clear);
    answer.addEventListener('input', () => { answer.removeAttribute('aria-invalid'); message(''); });
    form.addEventListener('submit', event => {
      event.preventDefault(); const expected = result(); if (expected === null) return;
      // A product may have twice as many digits as an operand.
      const value = answer.value.trim();
      if (!/^[+-]?\d+$/.test(value) || value.replace(/^[+-]/, '').length > 200) {
        answer.setAttribute('aria-invalid', 'true'); message('Enter a whole-number answer.', false); return;
      }
      answer.removeAttribute('aria-invalid');
      const correct = BigInt(value) === expected;
      message(correct ? '✓ Correct!' : '✗ Not quite. Try again.', correct);
    });
    root.querySelector('.multiply-show').addEventListener('click', () => {
      const expected = result(); if (expected === null) return;
      answer.value = expected.toString(); answer.removeAttribute('aria-invalid'); message('');
    });
    function fresh() {
      const previous = first.value + ',' + second.value;
      do { first.value = Math.floor(Math.random() * 13); second.value = Math.floor(Math.random() * 13); }
      while (first.value + ',' + second.value === previous);
      clear();
    }
    root.querySelector('.multiply-new').addEventListener('click', fresh);
    fresh();
  }
  boot(document.getElementById('plugin_multiply'));
})();
