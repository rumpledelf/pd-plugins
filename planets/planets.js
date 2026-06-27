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
    
    const container = root.querySelector('.planets-module');
    const canvas = root.querySelector('.planets-canvas');
    const toggleButton = root.querySelector('#planets-toggle');
    
    if (!container || !canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    
    let isRunning = true;
    const state = {
      width: 0,
      height: 0,
      dpr: 1
    };

    // Orbit speed and layout parameters
    const planets = [
      { id: 'mercury', name: 'Mercury', color: '#9E9E9E', radius: 3.5, orbitFraction: 0.16, speed: 0.03, theta: Math.random() * Math.PI * 2, href: '/m/mercury' },
      { id: 'venus', name: 'Venus', color: '#FFD54F', radius: 5.5, orbitFraction: 0.26, speed: 0.02, theta: Math.random() * Math.PI * 2, href: '/v/venus' },
      { id: 'earth', name: 'Earth', color: '#4FC3F7', radius: 6, orbitFraction: 0.36, speed: 0.015, theta: Math.random() * Math.PI * 2, href: '/e/earth' },
      { id: 'mars', name: 'Mars', color: '#FF8A65', radius: 4.5, orbitFraction: 0.46, speed: 0.012, theta: Math.random() * Math.PI * 2, href: '/m/mars' },
      { id: 'jupiter', name: 'Jupiter', color: '#FFB74D', radius: 9, orbitFraction: 0.58, speed: 0.007, theta: Math.random() * Math.PI * 2, href: '/j/jupiter' },
      { id: 'saturn', name: 'Saturn', color: '#E0E0E0', radius: 8, orbitFraction: 0.70, speed: 0.005, theta: Math.random() * Math.PI * 2, hasRings: true, href: '/s/saturn' },
      { id: 'uranus', name: 'Uranus', color: '#81C784', radius: 7, orbitFraction: 0.82, speed: 0.003, theta: Math.random() * Math.PI * 2, href: '/u/uranus' },
      { id: 'neptune', name: 'Neptune', color: '#64B5F6', radius: 6.5, orbitFraction: 0.94, speed: 0.002, theta: Math.random() * Math.PI * 2, href: '/n/neptune' }
    ];

    planets.forEach(function (planet) {
      const link = root.querySelector('#planets-link-' + planet.id);

      if (link) {
        link.href = planet.href;
        link.setAttribute('aria-label', planet.name);
      }
    });

    if (toggleButton) {
      toggleButton.classList.remove('grey');

      toggleButton.addEventListener('click', function () {
        isRunning = !isRunning;
        toggleButton.textContent = isRunning ? 'Pause' : 'Play';
        toggleButton.setAttribute('aria-label', isRunning ? 'Pause simulation' : 'Play simulation');
        toggleButton.classList.toggle('grey', !isRunning);
      });
    }

    // Set up ResizeObserver
    const resizeObserver = new ResizeObserver(function (entries) {
      for (let entry of entries) {
        const rect = entry.contentRect;
        const w = rect.width || container.clientWidth || 300;
        const h = rect.height || container.clientHeight || 250;
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        
        state.width = w;
        state.height = h;
        state.dpr = dpr;
      }
    });
    
    resizeObserver.observe(container);

    let animationFrameId = null;

    function render() {
      // If the canvas is no longer in the DOM, cancel the loop
      if (!document.body.contains(canvas)) {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        resizeObserver.disconnect();
        return;
      }

      const w = state.width;
      const h = state.height;
      const dpr = state.dpr || 1;

      if (w > 0 && h > 0) {
        ctx.clearRect(0, 0, w * dpr, h * dpr);
        
        ctx.save();
        ctx.scale(dpr, dpr);

        const centerX = w / 2;
        const centerY = h / 2;

        // Base the orbit scale on width and height with padding
        const padding = 24;
        const maxA = Math.max(10, (w - padding * 2) / 2);
        const maxB = Math.max(10, (h - padding * 2) / 2);

        // Get computed text color to match host theme
        const computedStyle = window.getComputedStyle(root);
        const textColor = computedStyle.color || '#333333';
        
        // Determine contrasting stroke color for text readability
        let isDarkMode = false;
        if (textColor.indexOf('rgb') !== -1) {
          const match = textColor.match(/\d+/g);
          if (match && match.length >= 3) {
            const r = parseInt(match[0], 10);
            const g = parseInt(match[1], 10);
            const b = parseInt(match[2], 10);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            if (brightness > 128) {
              isDarkMode = true;
            }
          }
        }
        const outlineColor = isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)';

        // 1. Draw the Sun
        const sunRadius = 11;
        const sunGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, sunRadius * 1.6);
        sunGrad.addColorStop(0, '#FFFFFF');
        sunGrad.addColorStop(0.2, '#FFD54F');
        sunGrad.addColorStop(0.6, '#FF8F00');
        sunGrad.addColorStop(1, 'rgba(255, 143, 0, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, sunRadius * 1.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFA000';
        ctx.beginPath();
        ctx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Draw Orbit Lines
        ctx.save();
        ctx.strokeStyle = textColor;
        ctx.globalAlpha = 0.12;
        ctx.lineWidth = 1;
        
        planets.forEach(planet => {
          const a = maxA * planet.orbitFraction;
          const b = maxB * planet.orbitFraction;
          
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, a, b, 0, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.restore();

        // 3. Draw Planets and Labels
        planets.forEach(planet => {
          const a = maxA * planet.orbitFraction;
          const b = maxB * planet.orbitFraction;

          // Parametric equation coordinates
          const x = centerX + a * Math.cos(planet.theta);
          const y = centerY + b * Math.sin(planet.theta);
          const link = root.querySelector('#planets-link-' + planet.id);

          // Draw planet body
          ctx.fillStyle = planet.color;
          ctx.beginPath();
          ctx.arc(x, y, planet.radius, 0, Math.PI * 2);
          ctx.fill();

          // Saturn rings decoration
          if (planet.hasRings) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(0.3); // Slight angle tilt
            ctx.beginPath();
            ctx.ellipse(0, 0, planet.radius * 1.6, planet.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(224, 224, 224, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
          }

          // Text label
          ctx.save();
          ctx.font = '10px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Draw text background outline for high readability
          ctx.strokeStyle = outlineColor;
          ctx.lineWidth = 3;
          ctx.strokeText(planet.name, x, y - planet.radius - 8);
          
          // Draw text foreground
          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.85;
          ctx.fillText(planet.name, x, y - planet.radius - 8);
          ctx.restore();

          if (link) {
            const hitRadius = Math.max(planet.radius + 10, 18);
            const hitSize = hitRadius * 2;

            link.style.width = hitSize + 'px';
            link.style.height = hitSize + 'px';
            link.style.left = x + 'px';
            link.style.top = y + 'px';
          }

          // Increment angle by fixed step
          if (isRunning) {
            planet.theta += planet.speed;
          }
        });

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);
  }

  boot(document.getElementById('plugin_planets'));
})();
