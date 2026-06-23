(function () {
  const SIGNS = [
    { name: 'Capricorn', path: '/c/capricorn', start: [12, 22], end: [1, 19] },
    { name: 'Aquarius', path: '/a/aquarius', start: [1, 20], end: [2, 18] },
    { name: 'Pisces', path: '/p/pisces', start: [2, 19], end: [3, 20] },
    { name: 'Aries', path: '/a/aries', start: [3, 21], end: [4, 19] },
    { name: 'Taurus', path: '/t/taurus', start: [4, 20], end: [5, 20] },
    { name: 'Gemini', path: '/g/gemini', start: [5, 21], end: [6, 20] },
    { name: 'Cancer', path: '/c/cancer/zodiac', start: [6, 21], end: [7, 22] },
    { name: 'Leo', path: '/l/leo', start: [7, 23], end: [8, 22] },
    { name: 'Virgo', path: '/v/virgo', start: [8, 23], end: [9, 22] },
    { name: 'Libra', path: '/l/libra', start: [9, 23], end: [10, 22] },
    { name: 'Scorpio', path: '/s/scorpio', start: [10, 23], end: [11, 21] },
    { name: 'Sagittarius', path: '/s/sagittarius', start: [11, 22], end: [12, 21] }
  ];

  function parseSettings(root) {
    try {
      return JSON.parse(root.dataset.pluginSettings || '{}');
    } catch (error) {
      return {};
    }
  }

  function getSign(month, day) {
    return SIGNS.find((sign) => {
      const [startMonth, startDay] = sign.start;
      const [endMonth, endDay] = sign.end;

      if (startMonth > endMonth) {
        return (month === startMonth && day >= startDay) ||
          (month === endMonth && day <= endDay) ||
          month > startMonth ||
          month < endMonth;
      }

      return (month === startMonth && day >= startDay) ||
        (month === endMonth && day <= endDay) ||
        (month > startMonth && month < endMonth);
    });
  }

  function renderResult($result, sign) {
    if (!sign) {
      $result.textContent = 'Select a valid birthday.';
      return;
    }

    $result.innerHTML = '';
    $result.append('Your zodiac sign is ');

    const link = document.createElement('a');
    link.href = `https://photographicdictionary.com${sign.path}`;
    link.textContent = sign.name;

    $result.append(link);
    $result.append('.');
  }

  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') {
      return;
    }

    root.dataset.pluginBooted = 'true';

    const settings = parseSettings(root);
    const $label = root.querySelector('label');
    const $input = root.querySelector('#zodiac-birthday');
    const $button = root.querySelector('#zodiac-submit');
    const $result = root.querySelector('#zodiac-result');

    if (!$input || !$button || !$result) {
      return;
    }

    if ($label && settings.label) {
      $label.textContent = settings.label;
    }

    if (settings.button_text) {
      $button.textContent = settings.button_text;
    }

    const update = () => {
      if (!$input.value) {
        $result.textContent = '';
        return;
      }

      const parts = $input.value.split('-').map(Number);
      if (parts.length !== 3 || parts.some(Number.isNaN)) {
        renderResult($result, null);
        return;
      }

      const sign = getSign(parts[1], parts[2]);
      renderResult($result, sign);
    };

    $button.addEventListener('click', update);
    $input.addEventListener('change', update);
  }

  boot(document.getElementById('plugin_zodiac'));
})();
