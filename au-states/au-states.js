(function () {
  function parseSettings(root) {
    try {
      return JSON.parse(root.dataset.pluginSettings || '{}');
    } catch (error) {
      return {};
    }
  }

  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') {
      return;
    }

    root.dataset.pluginBooted = 'true';

    const settings = parseSettings(root);
    const map = root.querySelector('.au-states-map');
    const tooltip = root.querySelector('#au-tooltip');
    const tooltipTitle = root.querySelector('.au-tooltip-title');
    const tooltipLink = root.querySelector('.au-tooltip-link');

    if (!map || !tooltip || !tooltipTitle || !tooltipLink) {
      return;
    }

    const regions = [
      {
        id: 'wa',
        name: 'Western Australia',
        abbr: 'WA',
        capital: 'Perth',
        href: '/p/perth',
        color: '#D97A00'
      },
      {
        id: 'nt',
        name: 'Northern Territory',
        abbr: 'NT',
        capital: 'Darwin',
        href: '/d/darwin',
        color: '#F0A33A'
      },
      {
        id: 'sa',
        name: 'South Australia',
        abbr: 'SA',
        capital: 'Adelaide',
        href: '/a/adelaide',
        color: '#999999'
      },
      {
        id: 'qld',
        name: 'Queensland',
        abbr: 'QLD',
        capital: 'Brisbane',
        href: '/b/brisbane',
        color: '#4CAF50'
      },
      {
        id: 'nsw',
        name: 'New South Wales',
        abbr: 'NSW',
        capital: 'Sydney',
        href: '/s/sydney',
        color: '#4CC4BC'
      },
      {
        id: 'vic',
        name: 'Victoria',
        abbr: 'VIC',
        capital: 'Melbourne',
        href: '/m/melbourne',
        color: '#0585BA'
      },
      {
        id: 'tas',
        name: 'Tasmania',
        abbr: 'TAS',
        capital: 'Hobart',
        href: '/h/hobart',
        color: '#64317B'
      },
      {
        id: 'act',
        name: 'Australian Capital Territory',
        abbr: 'ACT',
        capital: 'Canberra',
        href: '/c/canberra',
        color: '#B7287E'
      }
    ];

    const regionMap = {};
    const regionNodes = root.querySelectorAll('[data-region-id]');
    let activeId = '';

    regions.forEach(function (region) {
      regionMap[region.id] = region;
    });

    regionNodes.forEach(function (node) {
      const region = regionMap[node.dataset.regionId];

      if (!region) {
        return;
      }

      node.setAttribute('tabindex', '0');
      node.setAttribute('role', 'link');
      node.setAttribute('aria-label', region.name + ' (' + region.abbr + '), ' + region.capital);

      if (node.classList.contains('au-region')) {
        node.querySelectorAll('path').forEach(function (path) {
          path.style.fill = region.color;
        });
      }
    });

    function setActiveRegion(id) {
      activeId = id;

      root.querySelectorAll('.au-region.is-active, .au-act-hit.is-active').forEach(function (node) {
        node.classList.remove('is-active');
      });

      if (!id) {
        tooltip.hidden = true;
        return;
      }

      root.querySelectorAll('[data-region-id="' + id + '"]').forEach(function (node) {
        node.classList.add('is-active');
      });
    }

    function placeTooltip(node) {
      if (window.matchMedia('(max-width: 640px)').matches) {
        tooltip.style.left = '';
        tooltip.style.top = '';
        return;
      }

      const wrapRect = root.querySelector('.au-states-map-wrap').getBoundingClientRect();
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

    function showRegion(id, node) {
      const region = regionMap[id];

      if (!region) {
        return;
      }

      setActiveRegion(id);
      tooltipTitle.textContent = region.name + ' (' + region.abbr + ')';
      tooltipLink.textContent = region.capital;
      tooltipLink.href = region.href;
      tooltip.hidden = false;
      placeTooltip(node);
    }

    regionNodes.forEach(function (node) {
      const id = node.dataset.regionId;

      node.addEventListener('focus', function () {
        showRegion(id, node);
      });

      node.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        showRegion(id, node);
      });

      node.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          showRegion(id, node);
        }
      });
    });
    tooltip.addEventListener('click', function (event) {
      event.stopPropagation();
    });

    root.addEventListener('click', function (event) {
      if (event.target.closest('[data-region-id]') || event.target.closest('.au-tooltip')) {
        return;
      }

      setActiveRegion('');
    });

    document.addEventListener('click', function (event) {
      if (!root.contains(event.target)) {
        setActiveRegion('');
      }
    });
  }

  boot(document.getElementById('plugin_au-states'));
})();
