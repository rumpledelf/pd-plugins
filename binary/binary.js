(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const form = root.querySelector('form');
    const decimalInput = root.querySelector('#binary-decimal');
    const binaryInput = root.querySelector('#binary-value');
    const clearButton = root.querySelector('#binary-clear');
    const message = root.querySelector('#binary-message');
    if (!form || !decimalInput || !binaryInput || !clearButton || !message) return;

    function parseInteger(value, base) {
      const pattern = base === 2 ? /^[+-]?[01]+$/ : /^[+-]?\d+$/;
      if (!pattern.test(value) || value.replace(/^[+-]/, '').length > 1000) {
        return null;
      }

      const negative = value.charAt(0) === '-';
      const digits = value.replace(/^[+-]/, '');
      const number = base === 2 ? BigInt('0b' + digits) : BigInt(value);
      return negative ? -number : number;
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
      setInvalid(binaryInput, false);
      message.textContent = '';
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const decimalValue = decimalInput.value.trim();
      const binaryValue = binaryInput.value.trim();
      const hasDecimal = decimalValue !== '';
      const hasBinary = binaryValue !== '';
      const decimalNumber = hasDecimal ? parseInteger(decimalValue, 10) : null;
      const binaryNumber = hasBinary ? parseInteger(binaryValue, 2) : null;

      clearMessageAndInvalidStates();

      if (hasDecimal && decimalNumber === null) {
        message.textContent = 'Enter a whole decimal number, such as 42.';
        setInvalid(decimalInput, true);
        return;
      }

      if (hasBinary && binaryNumber === null) {
        message.textContent = 'Enter a binary integer using only 0 and 1.';
        setInvalid(binaryInput, true);
        return;
      }

      if (hasDecimal && hasBinary) {
        message.textContent = 'Enter a value on one side only, then convert.';
        return;
      }

      if (!hasDecimal && !hasBinary) {
        message.textContent = 'Enter a decimal or binary integer first.';
        return;
      }

      if (hasDecimal) {
        binaryInput.value = decimalNumber.toString(2);
      } else {
        decimalInput.value = binaryNumber.toString(10);
      }

      message.textContent = '';
    });

    [decimalInput, binaryInput].forEach(function (input) {
      input.addEventListener('input', function () {
        setInvalid(input, false);
        message.textContent = '';
      });
    });

    clearButton.addEventListener('click', function () {
      decimalInput.value = '';
      binaryInput.value = '';
      clearMessageAndInvalidStates();
    });
  }
  boot(document.getElementById('plugin_binary'));
})();
