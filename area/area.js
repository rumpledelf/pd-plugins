(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const form = root.querySelector('.measurement-module');
    const unitSelect = root.querySelector('.measurement-units select');
    const result = root.querySelector('.measurement-result');
    if (!form || !unitSelect || !result) return;
    const factors = {cm: .01, m: 1, in: .0254, ft: .3048};
    const shapes = {
      rectangle: {fields: ['width', 'height'], calculate: function (m) { return m.width * m.height; }},
      triangle: {fields: ['base', 'height'], calculate: function (m) { return m.base * m.height / 2; }},
      circle: {fields: ['radius'], calculate: function (m) { return Math.PI * m.radius * m.radius; }}
    };
    const fields = {};
    let unit = 'cm', shape = 'rectangle', calculated = false;
    root.querySelectorAll('[data-field]').forEach(function (row) {
      const name = row.dataset.field, input = row.querySelector('input');
      fields[name] = {row: row, input: input, metres: null, raw: ''};
      input.addEventListener('input', function () { sync(name); calculated = false; result.textContent = ''; });
    });
    function sync(name) {
      const field = fields[name], text = field.input.value;
      // Do not reparse our own rounded display after a unit switch: the
      // canonical measurement keeps its full precision for round trips.
      if (field.raw === text) return;
      field.raw = text;
      const value = Number(text), metres = value * factors[unit];
      const decimal = /^\+?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(text.trim());
      field.metres = decimal && Number.isFinite(value) && value > 0 && Number.isFinite(metres) && metres > 0 ? metres : null;
    }
    function validate() {
      for (const name of shapes[shape].fields) {
        sync(name);
        if (fields[name].metres === null) {
          result.textContent = 'Enter a ' + name + ' greater than zero.';
          fields[name].input.focus(); return false;
        }
      }
      return true;
    }
    function format(value) { return Number(value.toPrecision(12)).toString(); }
    function show() {
      const metres = {};
      for (const name of shapes[shape].fields) metres[name] = fields[name].metres;
      const value = shapes[shape].calculate(metres) / Math.pow(factors[unit], 2);
      if (!Number.isFinite(value) || value <= 0) {
        result.textContent = 'Those dimensions are too large or too small. Try smaller values.';
        calculated = false; return;
      }
      result.textContent = 'Area: ' + value.toLocaleString('en-AU', {maximumFractionDigits: 2, useGrouping: false}) + ' ' + unit + '²';
      calculated = true;
    }
    function setShape() {
      shape = root.querySelector('input[name="area-shape"]:checked').value;
      const visible = shapes[shape].fields;
      Object.keys(fields).forEach(function (name) {
        fields[name].row.hidden = !visible.includes(name);
        fields[name].row.style.order = visible.indexOf(name);
        fields[name].input.required = visible.includes(name);
      });
      root.querySelectorAll('[data-diagram]').forEach(function (diagram) {
        diagram.toggleAttribute('hidden', diagram.dataset.diagram !== shape);
      });
      const descriptions = {
        rectangle: 'Rectangle: width across, height upwards.',
        triangle: 'Triangle: base across, perpendicular height shown by the dashed line.',
        circle: 'Circle: radius from its centre to its edge.'
      };
      const preview = root.querySelector('.measurement-preview');
      if (preview) preview.setAttribute('aria-label', descriptions[shape] + ' Diagram not to scale.');
      calculated = false; result.textContent = '';
    }
    root.querySelectorAll('input[name="area-shape"]').forEach(function (radio) { radio.addEventListener('change', setShape); });
    unitSelect.addEventListener('change', function () {
      const next = unitSelect.value;
      if (!Object.prototype.hasOwnProperty.call(factors, next)) { unitSelect.value = unit; return; }
      for (const name of Object.keys(fields)) sync(name);
      const invalid = shapes[shape].fields.find(function (name) { return fields[name].input.value.trim() && fields[name].metres === null; });
      if (invalid) {
        unitSelect.value = unit; result.textContent = 'Enter a ' + invalid + ' greater than zero before converting.'; return;
      }
      unit = next;
      Object.keys(fields).forEach(function (name) {
        const field = fields[name];
        if (field.metres !== null) {
          const converted = field.metres / factors[unit];
          if (Number.isFinite(converted)) { field.input.value = format(converted); field.raw = field.input.value; }
          else { field.input.value = ''; field.raw = ''; field.metres = null; calculated = false; }
        }
        field.row.querySelector('.measurement-unit').textContent = unit;
      });
      if (calculated) show(); else result.textContent = '';
    });
    form.addEventListener('submit', function (event) { event.preventDefault(); if (validate()) show(); });
    setShape();
  }
  boot(document.getElementById('plugin_area'));
})();
