import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { calculateStickTargets, calculateAnalogTargets } from './digitPatterns';
import { ColorPicker } from './ColorPicker';

// Predefined color themes
const COLOR_THEMES = {
  'Midnight Red': { background: '#050505', sticks: '#b4b4b4', clock: '#ff0000' },
  'Ocean Blue': { background: '#0a1628', sticks: '#4a90a4', clock: '#00d4ff' },
  'Sunset': { background: '#1a0a0a', sticks: '#d4a574', clock: '#ff6b35' },
  'Matrix': { background: '#000a00', sticks: '#0a3a0a', clock: '#00ff41' },
  'Cyberpunk': { background: '#0d0221', sticks: '#7b2cbf', clock: '#ff00ff' },
  'Arctic': { background: '#0f1c2e', sticks: '#8ecae6', clock: '#ffffff' },
  'Golden Hour': { background: '#1a1205', sticks: '#c9a959', clock: '#ffd700' },
  'Neon Pink': { background: '#0a0510', sticks: '#553366', clock: '#ff1493' },
  'Forest': { background: '#0a1a0a', sticks: '#2d5a27', clock: '#7cfc00' },
  'Lavender': { background: '#1a1020', sticks: '#9370db', clock: '#e6e6fa' },
};

// Stick shape options
const STICK_SHAPES = [
  { id: 'stick', name: 'Stick', icon: '│' },
  { id: 'square', name: 'Square', icon: '■' },
  { id: 'diamond', name: 'Diamond', icon: '◆' },
  { id: 'star', name: 'Star', icon: '★' },
  { id: 'triangle', name: 'Triangle', icon: '▲' },
  { id: 'cross', name: 'Cross', icon: '✚' },
  { id: 'hexagon', name: 'Hexagon', icon: '⬡' },
  { id: 'swirl', name: 'Swirl', icon: '◌' },
];

export const ClockGrid = () => {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isRevealing, setIsRevealing] = useState(false);
  const [displayTime, setDisplayTime] = useState('');
  const [countdown, setCountdown] = useState('');
  const [forceReveal, setForceReveal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings
  const [is24Hour, setIs24Hour] = useState(true);
  const [isContinuous, setIsContinuous] = useState(false);
  const [isMonochrome, setIsMonochrome] = useState(false);
  const [period, setPeriod] = useState(''); // AM/PM
  const [revealInterval, setRevealInterval] = useState(5); // minutes: 1, 5, 15, 30, 60
  const [displayType, setDisplayType] = useState('digital'); // 'digital' or 'analog'

  // Fade timing settings (in seconds)
  const [fadeInDuration, setFadeInDuration] = useState(5); // Time for display to appear
  const [displayDuration, setDisplayDuration] = useState(5); // Time the display is fully visible (max 60s)
  const [fadeOutDuration, setFadeOutDuration] = useState(25); // Time for display to disappear

  // Color settings
  const [backgroundColor, setBackgroundColor] = useState('#050505');
  const [stickColor, setStickColor] = useState('#b4b4b4');
  const [clockColor, setClockColor] = useState('#ff0000');

  // Shape settings
  const [stickShape, setStickShape] = useState('stick');

  // Custom themes
  const [savedThemes, setSavedThemes] = useState(() => {
    const saved = localStorage.getItem('kineticClockThemes');
    return saved ? JSON.parse(saved) : {};
  });
  const [showSaveTheme, setShowSaveTheme] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');

  const sticksRef = useRef([]);
  const animationRef = useRef(null);

  // Generate a suggested theme name based on colors
  const suggestThemeName = useCallback(() => {
    const names = ['Custom Theme', 'My Style', 'Personal', 'Unique', 'Special'];
    const index = Object.keys(savedThemes).length % names.length;
    return `${names[index]} ${Object.keys(savedThemes).length + 1}`;
  }, [savedThemes]);

  // Save custom theme
  const saveCustomTheme = useCallback((name) => {
    if (!name.trim()) return;
    const newThemes = {
      ...savedThemes,
      [name]: { background: backgroundColor, sticks: stickColor, clock: clockColor }
    };
    setSavedThemes(newThemes);
    localStorage.setItem('kineticClockThemes', JSON.stringify(newThemes));
    setShowSaveTheme(false);
    setNewThemeName('');
  }, [savedThemes, backgroundColor, stickColor, clockColor]);

  // Delete custom theme
  const deleteCustomTheme = useCallback((name) => {
    const newThemes = { ...savedThemes };
    delete newThemes[name];
    setSavedThemes(newThemes);
    localStorage.setItem('kineticClockThemes', JSON.stringify(newThemes));
  }, [savedThemes]);

  // Apply a theme
  const applyTheme = useCallback((theme) => {
    setBackgroundColor(theme.background);
    setStickColor(theme.sticks);
    setClockColor(theme.clock);
  }, []);

  // Helper function to convert hex to RGB
  const hexToRgb = useCallback((hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }, []);

  // Draw shape function
  const drawShape = useCallback((ctx, shape, x, y, size, angle, color, glowColor, glowIntensity, isActive, alpha = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);

    // Set glow
    ctx.shadowBlur = isActive ? 15 : 8;
    ctx.shadowColor = `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, ${glowIntensity * alpha})`;
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    ctx.lineWidth = isActive ? 4 : 3;
    ctx.lineCap = 'round';

    switch (shape) {
      case 'stick':
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(0, size);
        ctx.stroke();
        // Center dot
        ctx.beginPath();
        ctx.arc(0, 0, isActive ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'square':
        const sq = size * 0.8;
        ctx.fillRect(-sq / 2, -sq / 2, sq, sq);
        break;

      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.7);
        ctx.lineTo(size * 0.5, 0);
        ctx.lineTo(0, size * 0.7);
        ctx.lineTo(-size * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        break;

      case 'star':
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const outerAngle = (i * 72 - 90) * Math.PI / 180;
          const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
          const outerX = Math.cos(outerAngle) * size * 0.7;
          const outerY = Math.sin(outerAngle) * size * 0.7;
          const innerX = Math.cos(innerAngle) * size * 0.3;
          const innerY = Math.sin(innerAngle) * size * 0.3;
          if (i === 0) ctx.moveTo(outerX, outerY);
          else ctx.lineTo(outerX, outerY);
          ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        break;

      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.7);
        ctx.lineTo(size * 0.6, size * 0.5);
        ctx.lineTo(-size * 0.6, size * 0.5);
        ctx.closePath();
        ctx.fill();
        break;

      case 'cross':
        const cw = size * 0.25;
        const ch = size * 0.7;
        ctx.fillRect(-cw, -ch, cw * 2, ch * 2);
        ctx.fillRect(-ch, -cw, ch * 2, cw * 2);
        break;

      case 'hexagon':
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const hexAngle = (i * 60 - 30) * Math.PI / 180;
          const hx = Math.cos(hexAngle) * size * 0.6;
          const hy = Math.sin(hexAngle) * size * 0.6;
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        break;

      case 'swirl':
        // Draw an open spiral/swirl
        ctx.beginPath();
        const turns = 1.5;
        const startRadius = size * 0.15;
        const endRadius = size * 0.65;
        const steps = 40;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const swirlAngle = t * turns * Math.PI * 2;
          const radius = startRadius + (endRadius - startRadius) * t;
          const sx = Math.cos(swirlAngle) * radius;
          const sy = Math.sin(swirlAngle) * radius;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        break;

      default:
        // Default to stick
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(0, size);
        ctx.stroke();
    }

    ctx.restore();
  }, []);

  // Grid configuration
  const BASE_STICK_SPACING_X = 36;
  const BASE_STICK_SPACING_Y = 42;
  const PADDING = 50;
  const BASE_STICK_LENGTH = 20;

  // Grid Scale (1.0 = normal, 0.5 = dense)
  const [gridScale, setGridScale] = useState(1.0);

  // Derived dimensions based on scale
  const stickSpacingX = BASE_STICK_SPACING_X * gridScale;
  const stickSpacingY = BASE_STICK_SPACING_Y * gridScale;
  const stickLength = BASE_STICK_LENGTH * gridScale;

  // Calculate grid dimensions
  const gridConfig = useMemo(() => {
    const availableWidth = dimensions.width - PADDING * 2;
    const availableHeight = dimensions.height - PADDING * 2 - 80;

    // Ensure we don't divide by zero if scale is super small (though min is 0.5)
    // Floor to integer to avoid partial rows/cols
    const cols = Math.floor(availableWidth / stickSpacingX);
    const rows = Math.floor(availableHeight / stickSpacingY);

    return { cols, rows };
  }, [dimensions, stickSpacingX, stickSpacingY]);

  // Initialize sticks
  useEffect(() => {
    const { cols, rows } = gridConfig;
    const newSticks = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = PADDING + col * stickSpacingX + stickSpacingX / 2;
        const y = PADDING + row * stickSpacingY + stickSpacingY / 2;

        newSticks.push({
          id: `${col}-${row}`,
          col,
          row,
          x,
          y,
          angle: Math.random() * 360,
          targetAngle: null,
          speed: 0.3 + Math.random() * 0.8,
          direction: Math.random() > 0.5 ? 1 : -1,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    sticksRef.current = newSticks;
  }, [gridConfig, stickSpacingX, stickSpacingY]);

  // Handle resize and keypress
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        setForceReveal(prev => !prev);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // Format time
  const formatTime = useCallback((date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (is24Hour) {
      setPeriod('');
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    } else {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setPeriod(ampm);
      return `${hours}:${minutes}`;
    }
  }, [is24Hour]);

  // Check reveal time
  const isRevealTime = useCallback((date) => {
    if (isContinuous) return true;

    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const interval = revealInterval;

    const approachMinute = interval === 1 ? minutes : (Math.floor(minutes / interval) * interval + interval - 1) % 60;
    const isApproachMinute = minutes === approachMinute || (interval === 1);

    if (isApproachMinute && seconds >= 55) return true;
    if ((minutes % interval === 0) && seconds < 30) return true;

    return false;
  }, [isContinuous, revealInterval]);

  // Get countdown
  const getCountdown = useCallback((date) => {
    if (isContinuous) return 'Continuous display';

    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();
    const interval = revealInterval;

    if (isRevealTime(date)) return 'Revealing time...';

    // Calculate time to next reveal (when fade-in starts)
    const nextRevealMinute = Math.ceil(minutes / interval) * interval;
    const minutesToReveal = (nextRevealMinute - minutes + 60) % 60;
    const secondsToReveal = minutesToReveal * 60 - seconds - (milliseconds / 1000);

    // Countdown to when fade-in starts
    const timeToFadeIn = secondsToReveal - fadeInDuration;

    if (timeToFadeIn <= 0) {
      return 'Revealing time...';
    }

    const diffMinutes = Math.floor(timeToFadeIn / 60);
    const diffSeconds = Math.floor(timeToFadeIn % 60);

    return `Next reveal in ${diffMinutes}:${diffSeconds.toString().padStart(2, '0')}`;
  }, [isContinuous, revealInterval, fadeInDuration, isRevealTime]);

  // Update time effect
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setDisplayTime(formatTime(now));
      setCountdown(getCountdown(now));
      setIsRevealing(forceReveal || isRevealTime(now));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [formatTime, getCountdown, isRevealTime, forceReveal]);

  // Calculate targets effect
  useEffect(() => {
    if (isRevealing && gridConfig.cols > 0) {
      let targets;
      if (displayType === 'analog') {
        const now = new Date();
        targets = calculateAnalogTargets(gridConfig.cols, gridConfig.rows, now.getHours(), now.getMinutes(), stickSpacingX, stickSpacingY);
      } else {
        if (!displayTime) return;
        targets = calculateStickTargets(dimensions.width, dimensions.height, gridConfig.cols, gridConfig.rows, displayTime, stickSpacingX, stickSpacingY, !is24Hour ? period : '');
      }

      sticksRef.current.forEach(stick => {
        stick.targetAngle = targets[stick.id] !== undefined ? targets[stick.id] : null;
      });
    } else {
      sticksRef.current.forEach(stick => stick.targetAngle = null);
    }
  }, [isRevealing, displayTime, gridConfig, dimensions, is24Hour, period, displayType, stickSpacingX, stickSpacingY]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let lastTime = performance.now();

    // Parse colors once
    const bgRgb = hexToRgb(backgroundColor);
    const defaultStickRgb = hexToRgb(stickColor);
    const activeStickRgb = hexToRgb(clockColor);

    const animate = (currentTime) => {
      // ... (keeping existing code up to loop)
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Get current time to determine reveal phase
      const now = new Date();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const milliseconds = now.getMilliseconds();
      const interval = revealInterval;

      // Calculate reveal phase (0 = not revealing, 0-1 = approaching, 1 = holding, 1-2 = drifting away)
      let revealPhase = 0;
      let driftAmount = 0;

      if (isContinuous || forceReveal) {
        revealPhase = 1; // Full reveal in continuous or demo mode
      } else {
        // Calculate the next reveal minute (when minutes % interval === 0)
        const nextRevealMinute = Math.ceil(minutes / interval) * interval;
        const minutesToReveal = (nextRevealMinute - minutes + 60) % 60;
        const secondsToReveal = minutesToReveal * 60 - seconds - (milliseconds / 1000);

        // Check if we're in the fade-in phase (before the reveal)
        if (secondsToReveal > 0 && secondsToReveal <= fadeInDuration) {
          // Fade-in phase: starts fadeInDuration seconds before the target minute
          const fadeInProgress = 1 - (secondsToReveal / fadeInDuration);
          revealPhase = fadeInProgress; // 0 to 1
        }
        // Check if we're at the reveal minute
        else if ((minutes % interval === 0) && seconds < (displayDuration + fadeOutDuration)) {
          // At the target minute: hold for displayDuration, then fade out
          if (seconds < displayDuration) {
            // Display phase: fully visible
            revealPhase = 1;
          } else {
            // Fade-out phase: starts after displayDuration seconds
            const fadeOutProgress = (seconds - displayDuration + milliseconds / 1000) / fadeOutDuration;
            revealPhase = 1;
            driftAmount = fadeOutProgress; // 0 to 1
          }
        }
      }

      // Clear canvas with background color
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw each stick
      sticksRef.current.forEach(stick => {
        // Update angle based on reveal phase
        if (stick.targetAngle !== null && revealPhase > 0) {
          // Calculate how much to move towards target
          const convergenceStrength = Math.min(revealPhase, 1) * 0.15;

          // Add drift noise during drift phase
          const driftNoise = driftAmount * Math.sin(currentTime / 1000 + stick.phase * 10) * 30 * driftAmount;
          const effectiveTarget = stick.targetAngle + driftNoise;

          const diff = effectiveTarget - stick.angle;
          const normalizedDiff = ((diff + 180) % 360) - 180;
          stick.angle += normalizedDiff * convergenceStrength;

          // During heavy drift, add some organic movement
          if (driftAmount > 0.5) {
            const time = currentTime / 1000;
            const organicSpeed = (driftAmount - 0.5) * 2; // 0 to 1 during last half of drift
            stick.angle += stick.direction * stick.speed * 10 * organicSpeed * deltaTime;
          }
        } else {
          // Organic rotation with sine wave variation
          const time = currentTime / 1000;
          const speedVariation = 1 + Math.sin(time * 0.5 + stick.phase) * 0.3;
          stick.angle += stick.direction * stick.speed * 30 * speedVariation * deltaTime;
        }

        // Normalize angle
        stick.angle = ((stick.angle % 360) + 360) % 360;

        // Determine if this stick is active (showing time)
        const isActive = stick.targetAngle !== null && revealPhase > 0;

        // Get colors and calculate fade alpha
        let colorRgb;
        let alpha = 1;

        if (isActive) {
          // Calculate fade alpha based on phase
          let fadeAlpha = 1;

          if (revealPhase < 1) {
            // Fade-in phase: transition from faint (0.15) to full (1.0)
            fadeAlpha = 0.15 + (revealPhase * 0.85);
          } else if (driftAmount > 0) {
            // Fade-out phase: transition from full (1.0) to faint (0.15)
            fadeAlpha = 1.0 - (driftAmount * 0.85);
          }

          if (isMonochrome) {
            colorRgb = defaultStickRgb;
            alpha = fadeAlpha;
          } else {
            colorRgb = activeStickRgb;
            alpha = fadeAlpha;
          }
        } else {
          colorRgb = defaultStickRgb;
          if (isMonochrome) {
            alpha = 0.15; // Dim idle sticks
          }
        }

        // Glow intensity follows the same fade pattern as alpha
        let glowIntensity = 0.4; // Default for idle sticks
        if (isActive) {
          if (revealPhase < 1) {
            // Fade-in: glow increases with reveal
            glowIntensity = 0.4 + (revealPhase * 0.4);
          } else if (driftAmount > 0) {
            // Fade-out: glow decreases with drift
            glowIntensity = 0.8 - (driftAmount * 0.4);
          } else {
            // Full display
            glowIntensity = 0.8;
          }
        }

        // Draw using the selected shape
        drawShape(
          ctx,
          stickShape,
          stick.x,
          stick.y,
          stickLength,
          stick.angle,
          colorRgb,
          colorRgb,
          glowIntensity,
          isActive,
          alpha
        );
      });

      // Draw vignette using background color
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
      );
      gradient.addColorStop(0, `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, 0)`);
      gradient.addColorStop(0.5, `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, 0)`);
      gradient.addColorStop(1, `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, 0.8)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, forceReveal, isContinuous, revealInterval, backgroundColor, stickColor, clockColor, hexToRgb, stickShape, drawShape, gridConfig, stickLength, fadeInDuration, displayDuration, fadeOutDuration, isMonochrome]); // Add dependencies

  return (
    <div className="w-full h-screen relative overflow-hidden" style={{ backgroundColor }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
      />

      {/* Settings button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors flex items-center justify-center"
        title="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings panel */}
      {showSettings && (
        <React.Fragment>
          {/* Backdrop for click outside */}
          <div
            className="fixed inset-0 z-20"
            onClick={() => setShowSettings(false)}
          />
          <div className="absolute top-20 right-6 z-30 bg-gray-900/95 backdrop-blur-sm rounded-lg p-5 min-w-[250px] max-h-[calc(100vh-120px)] overflow-y-auto border border-gray-800 shadow-xl">
            <h3 className="text-sm font-medium text-gray-300 mb-4 tracking-wide">Settings</h3>

            {/* Grid Scale Slider */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Grid Density</label>
                <span className="text-xs text-gray-400">{Math.round((1.5 - gridScale + 0.5) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={gridScale}
                onChange={(e) => setGridScale(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <div className="flex justify-between mt-1 px-0.5">
                <span className="text-[10px] text-gray-600">High</span>
                <span className="text-[10px] text-gray-600">Low</span>
              </div>
            </div>

            {/* Clock Type toggle */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Clock Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDisplayType('digital')}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${displayType === 'digital'
                    ? 'bg-red-600/80 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                  Digital
                </button>
                <button
                  onClick={() => setDisplayType('analog')}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${displayType === 'analog'
                    ? 'bg-red-600/80 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                  Analog
                </button>
              </div>
            </div>

            {/* Time Format toggle - only show for digital */}
            {displayType === 'digital' && (
              <div className="mb-4">
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Time Format</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIs24Hour(true)}
                    className={`px-3 py-1.5 text-xs rounded transition-colors ${is24Hour
                      ? 'bg-red-600/80 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                  >
                    24-Hour
                  </button>
                  <button
                    onClick={() => setIs24Hour(false)}
                    className={`px-3 py-1.5 text-xs rounded transition-colors ${!is24Hour
                      ? 'bg-red-600/80 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                  >
                    12-Hour
                  </button>
                </div>
              </div>
            )}

            {/* Display mode toggle */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Reveal Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsContinuous(false)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${!isContinuous
                    ? 'bg-red-600/80 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                  Periodic
                </button>
                <button
                  onClick={() => setIsContinuous(true)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${isContinuous
                    ? 'bg-red-600/80 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                  Continuous
                </button>
              </div>
            </div>

            {/* Visual Style toggle */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Visual Style</label>
              <button
                onClick={() => setIsMonochrome(!isMonochrome)}
                className={`w-full px-3 py-1.5 text-xs rounded transition-colors flex items-center justify-center gap-2 ${isMonochrome
                  ? 'bg-red-600/80 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
              >
                {isMonochrome ? 'Monochrome Active' : 'Enable Monochrome'}
              </button>
            </div>

            {/* Interval selection (only shown for periodic mode) */}
            {!isContinuous && (
              <div className="mb-4">
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Reveal Interval</label>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 5, 15, 30, 60].map((interval) => (
                    <button
                      key={interval}
                      onClick={() => setRevealInterval(interval)}
                      className={`px-2.5 py-1.5 text-xs rounded transition-colors ${revealInterval === interval
                        ? 'bg-red-600/80 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                      {interval === 60 ? '1hr' : `${interval}m`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fade Timing Controls (only shown for periodic mode) */}
            {!isContinuous && (
              <div className="mb-4">
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Display Timing</label>

                {/* Fade In Duration */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-gray-400">Fade In</span>
                    <span className="text-[10px] text-gray-500">{fadeInDuration}s</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={revealInterval > 1 ? 30 : 10}
                    step="1"
                    value={fadeInDuration}
                    onChange={(e) => setFadeInDuration(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                </div>

                {/* Display Duration */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-gray-400">Display Time</span>
                    <span className="text-[10px] text-gray-500">{displayDuration}s</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    value={displayDuration}
                    onChange={(e) => setDisplayDuration(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                </div>

                {/* Fade Out Duration */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-gray-400">Fade Out</span>
                    <span className="text-[10px] text-gray-500">{fadeOutDuration}s</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={revealInterval > 1 ? 30 : 10}
                    step="1"
                    value={fadeOutDuration}
                    onChange={(e) => setFadeOutDuration(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                </div>
              </div>
            )}

            {/* Shape Selection */}
            <div className="mb-4 pt-4 border-t border-gray-700">
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Element Shape</label>
              <div className="grid grid-cols-5 gap-1.5">
                {STICK_SHAPES.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => setStickShape(shape.id)}
                    className={`p-2 text-lg rounded transition-colors ${stickShape === shape.id
                      ? 'bg-red-600/80 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    title={shape.name}
                  >
                    {shape.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Themes Section */}
            <div className="mb-4 pt-4 border-t border-gray-700">
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Color Themes</label>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {Object.entries(COLOR_THEMES).map(([name, theme]) => (
                  <button
                    key={name}
                    onClick={() => applyTheme(theme)}
                    className="flex items-center gap-2 p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
                    title={name}
                  >
                    <div className="flex gap-0.5">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.background }} />
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.sticks }} />
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.clock }} />
                    </div>
                    <span className="text-[10px] text-gray-400 truncate">{name}</span>
                  </button>
                ))}
              </div>

              {/* Custom Saved Themes */}
              {Object.keys(savedThemes).length > 0 && (
                <div className="mb-3">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Your Themes</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(savedThemes).map(([name, theme]) => (
                      <div key={name} className="flex items-center gap-1">
                        <button
                          onClick={() => applyTheme(theme)}
                          className="flex-1 flex items-center gap-2 p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
                          title={name}
                        >
                          <div className="flex gap-0.5">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.background }} />
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.sticks }} />
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.clock }} />
                          </div>
                          <span className="text-[10px] text-gray-400 truncate">{name}</span>
                        </button>
                        <button
                          onClick={() => deleteCustomTheme(name)}
                          className="p-1.5 rounded bg-gray-800 hover:bg-red-900/50 text-gray-500 hover:text-red-400 transition-colors"
                          title="Delete theme"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Current Theme */}
              {!showSaveTheme ? (
                <button
                  onClick={() => {
                    setNewThemeName(suggestThemeName());
                    setShowSaveTheme(true);
                  }}
                  className="w-full p-2 text-xs rounded bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Save Current as Theme
                </button>
              ) : (
                <div className="p-2 rounded bg-gray-800">
                  <input
                    type="text"
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    placeholder="Theme name..."
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-300 mb-2 focus:outline-none focus:border-gray-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveCustomTheme(newThemeName)}
                      className="flex-1 p-1.5 text-xs rounded bg-green-600/80 hover:bg-green-600 text-white transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowSaveTheme(false);
                        setNewThemeName('');
                      }}
                      className="flex-1 p-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Color Settings Section */}
            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Custom Colors</h4>

              <ColorPicker
                color={backgroundColor}
                onChange={setBackgroundColor}
                label="Background"
              />

              <ColorPicker
                color={stickColor}
                onChange={setStickColor}
                label="Idle Elements"
              />

              <ColorPicker
                color={clockColor}
                onChange={setClockColor}
                label="Time Display"
              />
            </div>
          </div>
        </React.Fragment>
      )}

      {/* Info panel at bottom */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 text-center">
        <div className={`text-sm font-light tracking-[0.2em] uppercase ${isRevealing ? 'text-gray-300 animate-pulse' : 'text-gray-500'}`}>
          {displayTime}{!is24Hour && period && <span className="ml-2 text-xs">{period}</span>}
        </div>
        <div className="text-xs font-light tracking-[0.15em] text-gray-600 mt-2">
          {forceReveal ? 'Demo mode (press SPACE to exit)' : countdown}
        </div>
        {!forceReveal && !isContinuous && (
          <div className="text-[10px] font-light tracking-[0.1em] text-gray-700 mt-4">
            Press SPACE to preview time reveal
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockGrid;
