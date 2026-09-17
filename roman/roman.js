(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const form = root.querySelector('form');
    const decimalInput = root.querySelector('#roman-decimal');
    const romanInput = root.querySelector('#roman-value');
    const clearButton = root.querySelector('#roman-clear');
    const message = root.querySelector('#roman-message');

    if (!form || !decimalInput || !romanInput || !clearButton || !message) return;

    const romanValues = [
      [1000, 'M'],
      [900, 'CM'],
      [500, 'D'],
      [400, 'CD'],
      [100, 'C'],
      [90, 'XC'],
      [50, 'L'],
      [40, 'XL'],
      [10, 'X'],
      [9, 'IX'],
      [5, 'V'],
      [4, 'IV'],
      [1, 'I']
    ];

    function decimalToRoman(number) {
      let result = '';
      let remaining = number;

      romanValues.forEach(function (entry) {
        while (remaining >= entry[0]) {
          result += entry[1];
          remaining -= entry[0];
        }
      });

      return result;
    }

    function parseDecimal(value) {
      if (!/^\d+$/.test(value)) return null;
      const number = Number(value);
      return number >= 1 && number <= 3999 ? number : null;
    }

    function parseRoman(value) {
      const normalized = value.toUpperCase();
      if (!/^[IVXLCDM]+$/.test(normalized)) return null;

      const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
      let total = 0;

      for (let index = 0; index < normalized.length; index += 1) {
        const current = values[normalized[index]];
        const next = values[normalized[index + 1]] || 0;
        total += current < next ? -current : current;
      }

      return decimalToRoman(total) === normalized ? total : null;
    }

    function setInvalid(input, invalid) {
      if (invalid) {
        input.setAttribute('aria-invalid', 'true');
      } else {
        input.removeAttribute('aria-invalid');
      }
    }

    function clearMessageAndInvalidStates() {
      setInvalid(decimalInput, false);
      setInvalid(romanInput, false);
      message.textContent = '';
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const decimalValue = decimalInput.value.trim();
      const romanValue = romanInput.value.trim();
      const hasDecimal = decimalValue !== '';
      const hasRoman = romanValue !== '';
      const decimalNumber = hasDecimal ? parseDecimal(decimalValue) : null;
      const romanNumber = hasRoman ? parseRoman(romanValue) : null;

      clearMessageAndInvalidStates();

      if (hasDecimal && decimalNumber === null) {
        message.textContent = 'Enter a decimal integer from 1 to 3999.';
        setInvalid(decimalInput, true);
        return;
      }

      if (hasRoman && romanNumber === null) {
        message.textContent = 'Enter a valid Roman numeral from I to MMMCMXCIX.';
        setInvalid(romanInput, true);
        return;
      }

      if (hasDecimal && hasRoman) {
        message.textContent = 'Enter a value on one side only, then convert.';
        return;
      }

      if (!hasDecimal && !hasRoman) {
        message.textContent = 'Enter a decimal or Roman numeral first.';
        return;
      }

      if (hasDecimal) {
        romanInput.value = decimalToRoman(decimalNumber);
      } else {
        decimalInput.value = romanNumber.toString();
        romanInput.value = romanValue.toUpperCase();
      }

      message.textContent = '';
    });

    [decimalInput, romanInput].forEach(function (input) {
      input.addEventListener('input', function () {
        setInvalid(input, false);
        message.textContent = '';
      });
    });

    clearButton.addEventListener('click', function () {
      decimalInput.value = '';
      romanInput.value = '';
      clearMessageAndInvalidStates();
    });
  }

  boot(document.getElementById('plugin_roman'));
})();
