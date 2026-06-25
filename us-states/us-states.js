(function () {
  const SCRIPT_URL = document.currentScript && document.currentScript.src
    ? new URL('us-states-map.svg', document.currentScript.src).toString()
    : 'us-states/us-states-map.svg';

  const STATE_COLORS = [
    '#1464A1',
    '#126193',
    '#1A8ED5',
    '#1681B5',
    '#1A4FD4',
    '#1743BB',
    '#113C88',
    '#194DCB',
    '#112D88',
    '#154D89',
    '#1725BD',
    '#1618B1',
    '#1C247D',
    '#301584',
    '#181981',
    '#261999',
    '#272289',
    '#521980',
    '#482178',
    '#552277',
    '#6E2D91',
    '#503C96',
    '#542E6B',
    '#652B6E',
    '#4C2574',
    '#9B40A9',
    '#4E3069',
    '#9C3A9C',
    '#5B287D',
    '#7C4392',
    '#9C38A9',
    '#723881',
    '#662871',
    '#7D317F',
    '#8830A8',
    '#C136B6',
    '#7A1F5F',
    '#9C33A8',
    '#862B8C',
    '#8F2B73',
    '#AE3383',
    '#742761',
    '#75207A',
    '#8E2576',
    '#AA206D',
    '#942A67',
    '#AC1DA2',
    '#AB2482',
    '#C5255B',
    '#A62151'
  ];
  const COLOR_STRIDE = 17;
  const STATE_COLOR_SWAPS = {
    al: 'mn',
    ar: 'vt',
    ca: 'nc',
    ct: 'wa',
    de: 'mn',
    il: 'ut',
    ky: 'nv',
    mn: 'al',
    ms: 'va',
    mt: 'tx',
    nc: 'ca',
    ne: 'sc',
    nv: 'ky',
    ri: 'ks',
    sc: 'ne',
    tx: 'mn',
    va: 'ms',
    wa: 'ct',
    ut: 'il'
  };

  const STATES = [
    { id: 'al', name: 'Alabama', abbr: 'AL', href: '/a/alabama' },
    { id: 'ak', name: 'Alaska', abbr: 'AK', href: '/a/alaska' },
    { id: 'az', name: 'Arizona', abbr: 'AZ', href: '/a/arizona' },
    { id: 'ar', name: 'Arkansas', abbr: 'AR', href: '/a/arkansas' },
    { id: 'ca', name: 'California', abbr: 'CA', href: '/c/california' },
    { id: 'co', name: 'Colorado', abbr: 'CO', href: '/c/colorado' },
    { id: 'ct', name: 'Connecticut', abbr: 'CT', href: '/c/connecticut' },
    { id: 'de', name: 'Delaware', abbr: 'DE', href: '/d/delaware' },
    { id: 'fl', name: 'Florida', abbr: 'FL', href: '/f/florida' },
    { id: 'ga', name: 'Georgia', abbr: 'GA', href: '/g/georgia' },
    { id: 'hi', name: 'Hawaii', abbr: 'HI', href: '/h/hawaii' },
    { id: 'id', name: 'Idaho', abbr: 'ID', href: '/i/idaho' },
    { id: 'il', name: 'Illinois', abbr: 'IL', href: '/i/illinois' },
    { id: 'in', name: 'Indiana', abbr: 'IN', href: '/i/indiana' },
    { id: 'ia', name: 'Iowa', abbr: 'IA', href: '/i/iowa' },
    { id: 'ks', name: 'Kansas', abbr: 'KS', href: '/k/kansas' },
    { id: 'ky', name: 'Kentucky', abbr: 'KY', href: '/k/kentucky' },
    { id: 'la', name: 'Louisiana', abbr: 'LA', href: '/l/louisiana' },
    { id: 'me', name: 'Maine', abbr: 'ME', href: '/m/maine' },
    { id: 'md', name: 'Maryland', abbr: 'MD', href: '/m/maryland' },
    { id: 'ma', name: 'Massachusetts', abbr: 'MA', href: '/m/massachusetts' },
    { id: 'mi', name: 'Michigan', abbr: 'MI', href: '/m/michigan' },
    { id: 'mn', name: 'Minnesota', abbr: 'MN', href: '/m/minnesota' },
    { id: 'ms', name: 'Mississippi', abbr: 'MS', href: '/m/mississippi' },
    { id: 'mo', name: 'Missouri', abbr: 'MO', href: '/m/missouri' },
    { id: 'mt', name: 'Montana', abbr: 'MT', href: '/m/montana' },
    { id: 'ne', name: 'Nebraska', abbr: 'NE', href: '/n/nebraska' },
    { id: 'nv', name: 'Nevada', abbr: 'NV', href: '/n/nevada' },
    { id: 'nh', name: 'New Hampshire', abbr: 'NH', href: '/n/new-hampshire' },
    { id: 'nj', name: 'New Jersey', abbr: 'NJ', href: '/n/new-jersey' },
    { id: 'nm', name: 'New Mexico', abbr: 'NM', href: '/n/new-mexico' },
    { id: 'ny', name: 'New York', abbr: 'NY', href: '/n/new-york' },
    { id: 'nc', name: 'North Carolina', abbr: 'NC', href: '/n/north-carolina' },
    { id: 'nd', name: 'North Dakota', abbr: 'ND', href: '/n/north-dakota' },
    { id: 'oh', name: 'Ohio', abbr: 'OH', href: '/o/ohio' },
    { id: 'ok', name: 'Oklahoma', abbr: 'OK', href: '/o/oklahoma' },
    { id: 'or', name: 'Oregon', abbr: 'OR', href: '/o/oregon' },
    { id: 'pa', name: 'Pennsylvania', abbr: 'PA', href: '/p/pennsylvania' },
    { id: 'ri', name: 'Rhode Island', abbr: 'RI', href: '/r/rhode-island' },
    { id: 'sc', name: 'South Carolina', abbr: 'SC', href: '/s/south-carolina' },
    { id: 'sd', name: 'South Dakota', abbr: 'SD', href: '/s/south-dakota' },
    { id: 'tn', name: 'Tennessee', abbr: 'TN', href: '/t/tennessee' },
    { id: 'tx', name: 'Texas', abbr: 'TX', href: '/t/texas' },
    { id: 'ut', name: 'Utah', abbr: 'UT', href: '/u/utah' },
    { id: 'vt', name: 'Vermont', abbr: 'VT', href: '/v/vermont' },
    { id: 'va', name: 'Virginia', abbr: 'VA', href: '/v/virginia' },
    { id: 'wa', name: 'Washington', abbr: 'WA', href: '/w/washington' },
    { id: 'wv', name: 'West Virginia', abbr: 'WV', href: '/w/west-virginia' },
    { id: 'wi', name: 'Wisconsin', abbr: 'WI', href: '/w/wisconsin' },
    { id: 'wy', name: 'Wyoming', abbr: 'WY', href: '/w/wyoming' }
  ];

  function renderError(root, message) {
    const holder = root.querySelector('.us-states-map-holder');

    if (!holder) {
      return;
    }

    holder.innerHTML = '<p class="us-states-error">' + message + '</p>';
  }

  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') {
      return;
    }

    root.dataset.pluginBooted = 'true';

    const holder = root.querySelector('.us-states-map-holder');
    const tooltip = root.querySelector('#us-tooltip');
    const tooltipTitle = root.querySelector('.us-tooltip-title');
    const tooltipLink = root.querySelector('.us-tooltip-link');

    if (!holder || !tooltip || !tooltipTitle || !tooltipLink) {
      return;
    }

    const stateMap = {};
    let activeId = '';

    STATES.forEach(function (state, index) {
      const sourceId = STATE_COLOR_SWAPS[state.id] || state.id;
      const sourceIndex = STATES.findIndex(function (candidate) {
        return candidate.id === sourceId;
      });

      stateMap[state.id] = {
        id: state.id,
        name: state.name,
        abbr: state.abbr,
        href: state.href,
        color: STATE_COLORS[(sourceIndex * COLOR_STRIDE) % STATE_COLORS.length]
      };
    });

    fetch(SCRIPT_URL)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Map load failed');
        }

        return response.text();
      })
      .then(function (svgText) {
        holder.innerHTML = svgText;

        const svg = holder.querySelector('svg');

        if (!svg) {
          throw new Error('Map markup missing');
        }

        svg.classList.add('us-states-map', 'us-map');
        svg.setAttribute('viewBox', '0 0 959 593');
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', 'Map of the United States with clickable state regions');
        svg.removeAttribute('width');
        svg.removeAttribute('height');

        const nodes = [];

        STATES.forEach(function (state) {
          const node = svg.querySelector('g.state > path.' + state.id);
          const data = stateMap[state.id];

          if (!node || !data) {
            return;
          }

          node.classList.add('us-state');
          node.dataset.regionId = state.id;
          node.setAttribute('tabindex', '0');
          node.setAttribute('role', 'link');
          node.setAttribute('aria-label', data.name + ' (' + data.abbr + ')');
          node.style.fill = data.color;
          nodes.push(node);
        });

        function setActiveState(id) {
          activeId = id;

          nodes.forEach(function (node) {
            node.classList.toggle('is-active', node.dataset.regionId === id);
          });

          if (!id) {
            tooltip.hidden = true;
          }
        }

        function placeTooltip(node) {
          if (window.matchMedia('(max-width: 640px)').matches) {
            tooltip.style.left = '';
            tooltip.style.top = '';
            return;
          }

          const wrapRect = root.querySelector('.us-states-map-wrap').getBoundingClientRect();
          const nodeRect = node.getBoundingClientRect();
          const tooltipWidth = tooltip.offsetWidth;
          const tooltipHeight = tooltip.offsetHeight;
          const preferredLeft = nodeRect.left - wrapRect.left + (nodeRect.width / 2) - (tooltipWidth / 2);
          const preferredTop = nodeRect.top - wrapRect.top + (nodeRect.height / 2) - (tooltipHeight / 2);
          const left = Math.max(8, Math.min(wrapRect.width - tooltipWidth - 8, preferredLeft));
          const top = Math.max(8, Math.min(wrapRect.height - tooltipHeight - 8, preferredTop));

          tooltip.style.left = left + 'px';
          tooltip.style.top = top + 'px';
        }

        function showState(id, node) {
          const state = stateMap[id];

          if (!state) {
            return;
          }

          setActiveState(id);
          tooltipTitle.textContent = state.name + ' (' + state.abbr + ')';
          tooltipLink.href = state.href;
          tooltip.hidden = false;
          placeTooltip(node);
        }

        nodes.forEach(function (node) {
          const id = node.dataset.regionId;

          node.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            showState(id, node);
          });

          node.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              showState(id, node);
            }
          });
        });

        tooltip.addEventListener('click', function (event) {
          event.stopPropagation();
        });

        root.addEventListener('click', function (event) {
          if (event.target.closest('[data-region-id]') || event.target.closest('.us-tooltip')) {
            return;
          }

          setActiveState('');
        });

        document.addEventListener('click', function (event) {
          if (!root.contains(event.target)) {
            setActiveState('');
          }
        });

        setActiveState(activeId);
      })
      .catch(function () {
        renderError(root, 'Could not load the states map.');
      });
  }

  boot(document.getElementById('plugin_us-states'));
})();
