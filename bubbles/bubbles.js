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
    
    // Canvas setup
    const canvas = root.querySelector('#bubbles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Controls
    const startBtn = root.querySelector('#bubbles-start');
    const stopBtn = root.querySelector('#bubbles-stop');
    const restartBtn = root.querySelector('#bubbles-restart');
    const statsText = root.querySelector('#bubbles-stats');

    // State
    let isRunning = true;
    let poppedCount = 0;
    let speedMultiplier = settings.base_speed || 1.0;
    const baseSpawnRate = settings.spawn_rate || 1.5; // spawned per second target
    
    let bubbles = [];
    let particles = [];
    let popRings = [];
    let animationFrameId = null;
    let lastSpawnTime = 0;

    // Color definitions (pinks/purples/blues)
    // Host values:
    // .blue: #0585BA (rgb 5, 133, 186)
    // .purple: #64317B (rgb 100, 49, 123)
    // .magenta (pinkish): #B7287E (rgb 183, 40, 126)
    const BUBBLE_COLORS = [
      { r: 5, g: 133, b: 186 },   // Blue
      { r: 100, g: 49, b: 123 },  // Purple
      { r: 183, g: 40, b: 126 }   // Magenta
    ];

    class Bubble {
      constructor() {
        this.radius = 22 + Math.random() * 28; // Radius between 22 and 50
        
        // Start bottom-left
        this.x = Math.random() * (canvas.width * 0.35) - this.radius;
        this.y = canvas.height + this.radius + Math.random() * 20;

        // Velocity: drift up and right (gentler speed for easier tracking)
        // vy is negative (rising)
        this.vy = -(0.5 + Math.random() * 0.7);
        // vx is positive (right drift)
        this.vx = 0.2 + Math.random() * 0.4;

        // Wobble physics
        this.wobblePhase = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.02 + Math.random() * 0.04;
        this.wobbleAmount = 0.3 + Math.random() * 0.5;

        // Select a color scheme
        this.color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
        
        // Random slight scaling/shimmer factor
        this.shimmerSpeed = 0.05 + Math.random() * 0.1;
        this.shimmerPhase = Math.random() * Math.PI * 2;
      }

      update() {
        this.wobblePhase += this.wobbleSpeed;
        this.shimmerPhase += this.shimmerSpeed;

        // Move bubble
        const currentVx = this.vx * speedMultiplier + Math.sin(this.wobblePhase) * this.wobbleAmount;
        const currentVy = this.vy * speedMultiplier;

        this.x += currentVx;
        this.y += currentVy;
      }

      draw() {
        ctx.save();
        
        const shimmer = 1 + Math.sin(this.shimmerPhase) * 0.03;
        const r = this.radius * shimmer;

        // Create radial gradient for 3D sphere effect
        // Light source is at top-left: (x - r*0.3, y - r*0.3)
        const gradient = ctx.createRadialGradient(
          this.x - r * 0.3, this.y - r * 0.3, r * 0.1,
          this.x - r * 0.1, this.y - r * 0.1, r
        );
        
        // Bubble body color - pale, semi-transparent inside
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.4, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.08)`);
        gradient.addColorStop(0.9, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.25)`);
        gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.6)`);

        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Stroke outline
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.5)`;
        ctx.stroke();

        // 3D Highlight specular reflection (small white curved oval/dot in top-left)
        ctx.beginPath();
        ctx.arc(this.x - r * 0.35, this.y - r * 0.35, r * 0.18, 0, Math.PI * 2);
        const highlightGradient = ctx.createRadialGradient(
          this.x - r * 0.38, this.y - r * 0.38, 0,
          this.x - r * 0.35, this.y - r * 0.35, r * 0.18
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGradient;
        ctx.fill();

        // Secondary subtle rim highlight on bottom-right
        ctx.beginPath();
        ctx.arc(this.x + r * 0.35, this.y + r * 0.35, r * 0.25, 0, Math.PI * 2);
        const rimGradient = ctx.createRadialGradient(
          this.x + r * 0.35, this.y + r * 0.35, 0,
          this.x + r * 0.35, this.y + r * 0.35, r * 0.25
        );
        rimGradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.2)`);
        rimGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = rimGradient;
        ctx.fill();

        ctx.restore();
      }

      isOffScreen() {
        return (
          this.y < -this.radius || 
          this.x > canvas.width + this.radius
        );
      }
    }

    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 2 + Math.random() * 3;
        
        // Explode outward in all directions
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.gravity = 0.08;
        this.alpha = 1.0;
        this.fade = 0.03 + Math.random() * 0.04;
      }

      update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.fade;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
        ctx.fill();
        ctx.restore();
      }
    }

    class PopRing {
      constructor(x, y, maxRadius, color) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = maxRadius;
        this.color = color;
        this.alpha = 1.0;
        // expanding speed
        this.speed = (maxRadius - 5) / 10; 
      }

      update() {
        this.radius += this.speed;
        this.alpha = Math.max(0, 1.0 - (this.radius / this.maxRadius));
      }

      draw() {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
        ctx.stroke();
        ctx.restore();
      }
    }

    function updateStats() {
      if (statsText) {
        statsText.textContent = `Popped: ${poppedCount} | Speed: ${speedMultiplier.toFixed(1)}x`;
      }
    }

    function createPopAnimation(x, y, radius, color) {
      // Spawn particles
      const particleCount = 8 + Math.floor(Math.random() * 6);
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(x, y, color));
      }
      // Spawn expanding shockwave ring
      popRings.push(new PopRing(x, y, radius * 1.3, color));
    }

    function spawnBubble() {
      if (bubbles.length < 15) {
        bubbles.push(new Bubble());
      }
    }

    function loop(timestamp) {
      if (!isRunning) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Handle spawn
      if (!lastSpawnTime) lastSpawnTime = timestamp;
      const elapsed = timestamp - lastSpawnTime;
      const spawnInterval = 1000 / baseSpawnRate; // in milliseconds
      
      if (elapsed >= spawnInterval) {
        spawnBubble();
        lastSpawnTime = timestamp;
      }

      // Update and draw bubbles
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const bubble = bubbles[i];
        bubble.update();
        bubble.draw();

        if (bubble.isOffScreen()) {
          bubbles.splice(i, 1);
        }
      }

      // Update and draw pop rings
      for (let i = popRings.length - 1; i >= 0; i--) {
        const ring = popRings[i];
        ring.update();
        ring.draw();

        if (ring.alpha <= 0) {
          popRings.splice(i, 1);
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();

        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    }

    // Handle canvas click to pop bubbles
    canvas.addEventListener('click', function (e) {
      if (!isRunning) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Check collision from top-most (newest/rendered last) to bottom-most
      const clickTolerance = 15; // Add extra pixel padding to make hitting easier on laptops/trackpads
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        const dist = Math.hypot(clickX - b.x, clickY - b.y);

        if (dist <= b.radius + clickTolerance) {
          // It's a hit!
          createPopAnimation(b.x, b.y, b.radius, b.color);
          bubbles.splice(i, 1);
          
          poppedCount++;
          speedMultiplier += 0.03; // speed increase per pop
          updateStats();
          break; // Pop one bubble per click
        }
      }
    });

    // Control buttons logic
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        if (!isRunning) {
          isRunning = true;
          lastSpawnTime = 0; // Reset spawn timer reference
          loop(performance.now());
        }
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', function () {
        isRunning = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', function () {
        // Reset state
        poppedCount = 0;
        speedMultiplier = settings.base_speed || 1.0;
        bubbles = [];
        particles = [];
        popRings = [];
        updateStats();

        // Restart animation loop if stopped
        if (!isRunning) {
          isRunning = true;
          lastSpawnTime = 0;
          loop(performance.now());
        } else {
          lastSpawnTime = 0;
        }
      });
    }

    // Kick off animation loop
    updateStats();
    loop(performance.now());
  }

  boot(document.getElementById('plugin_bubbles'));
})();
