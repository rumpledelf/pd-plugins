(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const first = root.querySelector('.divide-first');
    const second = root.querySelector('.divide-second');
    const quotient = root.querySelector('.divide-quotient');
    const remainder = root.querySelector('.divide-remainder');
    const feedback = root.querySelector('.divide-feedback');
    if (!first || !second || !quotient || !remainder || !feedback) return;
    function say(text, good) {
      feedback.textContent = text ? (good === true ? '✓' : '✗') : '';
      feedback.setAttribute('aria-label', text);
      feedback.title = text;
      feedback.classList.toggle('greentext', good === true);
      feedback.classList.toggle('magentatext', good === false);
    }
    function integer(input) {
      if (!/^\d+$/.test(input.value.trim())) return null;
      const number = Number(input.value);
      return Number.isInteger(number) && number >= 0 && number <= 999999 ? number : null;
    }
    function operands() {
      const a = integer(first), b = integer(second);
      if (a === null || b === null) { say('Use whole numbers from 0 to 999,999.', false); return null; }
      if (b === 0) { say('We cannot divide by zero. Try another divisor.', false); return null; }
      return { a, b, q: Math.floor(a / b), r: a % b };
    }
    function check() {
      const result = operands(); if (!result) return;
      const q = integer(quotient), r = integer(remainder);
      if (q === null || r === null) { say('Enter a whole-number quotient and remainder (0 if none).', false); return; }
      if (q === result.q && r === result.r) {
        say(`✓ Correct! ${result.b} × ${q}${r ? ' + ' + r : ''} = ${result.a}.`, true);
      } else if (r >= result.b) {
        say('✗ The remainder must be smaller than the number you divide by.', false);
      } else say('✗ Not quite. Try again, or show the answer.', false);
    }
    root.querySelector('.divide-check').addEventListener('click', check);
    root.querySelector('.divide-show').addEventListener('click', () => {
      const result = operands(); if (!result) return;
      quotient.value = result.q; remainder.value = result.r;
      say('');
    });
    function fresh() {
      const divisor = 2 + Math.floor(Math.random() * 11);
      const answer = 1 + Math.floor(Math.random() * 12);
      first.value = divisor * answer; second.value = divisor;
      quotient.value = ''; remainder.value = '0'; say('');
    }
    root.querySelector('.divide-new').addEventListener('click', fresh);
    [first, second].forEach(input => input.addEventListener('input', () => {
      quotient.value = ''; remainder.value = '0'; say('');
    }));
    [quotient, remainder].forEach(input => input.addEventListener('input', () => say('')));
    [first, second, quotient, remainder].forEach(input => input.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); check(); }
    }));
    fresh();
  }
  boot(document.getElementById('plugin_divide'));
})();
