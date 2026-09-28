// Each digit is represented as a 5x7 grid of stick angles
// 0 = horizontal (—), 90 = vertical (|), 45 = diagonal, -1 = hidden/random
// We use a simplified approach: sticks form the digit shape

// Angle constants for cleaner code
const H = 0;      // Horizontal
const V = 90;     // Vertical
const D1 = 45;    // Diagonal /
const D2 = 135;   // Diagonal \
const X = -1;     // Random/hidden

// 5 columns x 7 rows for each digit
// Using a segment-display inspired approach with sticks
export const DIGIT_PATTERNS = {
  0: [
    [D2, H, H, H, D1],
    [V, X, X, X, V],
    [V, X, X, X, V],
    [V, X, X, X, V],
    [V, X, X, X, V],
    [V, X, X, X, V],
    [D1, H, H, H, D2],
  ],
  1: [
    [X, X, D2, X, X],
    [X, X, V, X, X],
    [X, X, V, X, X],
    [X, X, V, X, X],
    [X, X, V, X, X],
    [X, X, V, X, X],
    [X, X, V, X, X],
  ],
  2: [
    [D2, H, H, H, D1],
    [X, X, X, X, V],
    [X, X, X, X, V],
    [D2, H, H, H, D2],
    [V, X, X, X, X],
    [V, X, X, X, X],
    [D1, H, H, H, D2],
  ],
  3: [
    [D2, H, H, H, D1],
    [X, X, X, X, V],
    [X, X, X, X, V],
    [X, H, H, H, D2],
    [X, X, X, X, V],
    [X, X, X, X, V],
    [D1, H, H, H, D2],
  ],
  4: [
    [V, X, X, X, V],
    [V, X, X, X, V],
    [V, X, X, X, V],
    [D1, H, H, H, D2],
    [X, X, X, X, V],
    [X, X, X, X, V],
    [X, X, X, X, V],
  ],
  5: [
    [D2, H, H, H, D1],
    [V, X, X, X, X],
    [V, X, X, X, X],
    [D1, H, H, H, D1],
    [X, X, X, X, V],
    [X, X, X, X, V],
    [D2, H, H, H, D2],
  ],
  6: [
    [D2, H, H, H, D1],
    [V, X, X, X, X],
    [V, X, X, X, X],
    [D1, H, H, H, D1],
    [V, X, X, X, V],
    [V, X, X, X, V],
    [D1, H, H, H, D2],
  ],
  7: [
    [D2, H, H, H, D1],
    [X, X, X, X, V],
    [X, X, X, X, V],
    [X, X, X, D2, X],
    [X, X, V, X, X],
    [X, X, V, X, X],
    [X, X, V, X, X],
  ],
  8: [
    [D2, H, H, H, D1],
    [V, X, X, X, V],
    [V, X, X, X, V],
    [D1, H, H, H, D2],
    [V, X, X, X, V],
    [V, X, X, X, V],
    [D1, H, H, H, D2],
  ],
  9: [
    [D2, H, H, H, D1],
    [V, X, X, X, V],
    [V, X, X, X, V],
    [D1, H, H, H, D2],
    [X, X, X, X, V],
    [X, X, X, X, V],
    [D2, H, H, H, D2],
  ],
  ':': [
    [X, X, X, X, X],
    [X, X, V, X, X],
    [X, X, X, X, X],
    [X, X, X, X, X],
    [X, X, X, X, X],
    [X, X, V, X, X],
    [X, X, X, X, X],
  ],
  // Letters for AM/PM
  'A': [
    [X, D2, H, D1, X],
    [V, X, X, X, V],
    [V, H, H, H, V],
    [V, X, X, X, V],
    [V, X, X, X, V],
    [X, X, X, X, X],
    [X, X, X, X, X],
  ],
  'P': [
    [D2, H, H, D1, X],
    [V, X, X, X, V],
    [V, H, H, D2, X],
    [V, X, X, X, X],
    [V, X, X, X, X],
    [X, X, X, X, X],
    [X, X, X, X, X],
  ],
  'M': [
    [V, D1, X, D2, V],
    [V, X, V, X, V],
    [V, X, X, X, V],
    [V, X, X, X, V],
    [V, X, X, X, V],
    [X, X, X, X, X],
    [X, X, X, X, X],
  ],
};

// Get target angles for a time string like "12:45"
export const getTimePattern = (timeString) => {
  const chars = timeString.split('');
  const patterns = chars.map(char => DIGIT_PATTERNS[char] || DIGIT_PATTERNS[':']);
  return patterns;
};

// Calculate which sticks should form part of the time display
export const calculateStickTargets = (
  gridWidth,
  gridHeight,
  gridCols,
  gridRows,
  timeString,
  stickSpacingX,
  stickSpacingY,
  period = '' // Optional AM/PM for 12-hour display
) => {
  const patterns = getTimePattern(timeString);
  const patternCols = 5; // Each digit/char is 5 cols
  const patternRows = 7; // Each digit/char is 7 rows

  // Calculate total rows needed (add extra rows if we have AM/PM to display below)
  const hasAmPm = period === 'AM' || period === 'PM';
  const totalPatternRows = hasAmPm ? patternRows + 4 : patternRows; // Add 4 rows for AM/PM below

  const totalPatternCols = patterns.length * patternCols + (patterns.length - 1) * 2; // With spacing

  // Calculate scaling to fit the grid
  const digitScaleX = Math.floor(gridCols / totalPatternCols);
  const digitScaleY = Math.floor(gridRows / totalPatternRows);
  const scale = Math.min(digitScaleX, digitScaleY, 3); // Cap at 3x

  // Calculate starting position to center the time
  const totalWidth = totalPatternCols * scale;
  const totalHeight = totalPatternRows * scale;
  const startCol = Math.floor((gridCols - totalWidth) / 2);
  const startRow = Math.floor((gridRows - totalHeight) / 2);

  const targets = {};

  let currentCol = startCol;
  let colonCol = 0; // Track where the colon is for AM/PM placement

  patterns.forEach((pattern, patternIndex) => {
    // Track colon position (it's at index 2 in "HH:MM")
    if (patternIndex === 2) {
      colonCol = currentCol;
    }

    for (let row = 0; row < patternRows; row++) {
      for (let col = 0; col < patternCols; col++) {
        const angle = pattern[row][col];

        // Scale up the pattern
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const gridCol = currentCol + col * scale + sx;
            const gridRow = startRow + row * scale + sy;

            if (gridCol >= 0 && gridCol < gridCols && gridRow >= 0 && gridRow < gridRows) {
              const key = `${gridCol}-${gridRow}`;
              if (angle !== X) {
                targets[key] = angle;
              }
            }
          }
        }
      }
    }

    currentCol += patternCols * scale + 2 * scale; // Move to next character with spacing
  });

  // Add AM/PM below the colon if in 12-hour mode
  if (hasAmPm && period) {
    const ampmChars = period.split(''); // ['A', 'M'] or ['P', 'M']
    const ampmPatterns = ampmChars.map(char => DIGIT_PATTERNS[char]);

    // Position AM/PM centered below the colon
    // The colon is 5 cols wide, AM/PM is 2 chars * 5 cols + spacing = 12 cols
    // Center it around the colon position
    const ampmWidth = 2 * patternCols + 2; // 2 characters + spacing between them
    const ampmStartCol = colonCol + Math.floor((patternCols * scale - ampmWidth * scale) / 2);
    const ampmStartRow = startRow + patternRows * scale + 1 * scale; // 1 row gap below main time

    let ampmCurrentCol = ampmStartCol;

    ampmPatterns.forEach((pattern, idx) => {
      if (!pattern) return;

      // Add extra offset for 'M' (second character) - move 1 tick to the right
      const extraOffset = (idx === 1) ? 1 : 0;

      // Only render the top 5 rows of AM/PM letters (they use rows 0-4, rows 5-6 are empty)
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < patternCols; col++) {
          const angle = pattern[row][col];

          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const gridCol = ampmCurrentCol + col * scale + sx + extraOffset;
              const gridRow = ampmStartRow + row * scale + sy;

              if (gridCol >= 0 && gridCol < gridCols && gridRow >= 0 && gridRow < gridRows) {
                const key = `${gridCol}-${gridRow}`;
                if (angle !== X) {
                  targets[key] = angle;
                }
              }
            }
          }
        }
      }

      ampmCurrentCol += patternCols * scale + 1 * scale; // Move to next letter with smaller spacing
    });
  }

  return targets;
};

// Calculate targets for Analog Clock display
export const calculateAnalogTargets = (
  cols,
  rows,
  hours,
  minutes,
  spacingX,
  spacingY
) => {
  const targets = {};
  const centerX = cols / 2 - 0.5; // Center between cells if even
  const centerY = rows / 2 - 0.5;

  // Max radius that fits (using smaller dimension)
  // Use about 80% of the space
  const maxRadius = Math.min(cols, rows) * 0.4;

  // Angle calculations (0 is 12 o'clock / Up)
  // Hours: 12 hours = 360 deg, 1 hour = 30 deg
  // Minutes add to hour hand position: 60 mins = 30 deg -> 1 min = 0.5 deg
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;

  // Minutes: 60 mins = 360 deg, 1 min = 6 deg
  const minuteAngle = minutes * 6;

  // Helper to add a hand
  const addHand = (angle, length, width = 1) => {
    // Convert angle to radians (subtract 90 because 0 is right in trig, but we want 0 to be up)
    const rad = (angle - 90) * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Iterate along the length of the hand
    // Step size 0.5 to catch all grid cells
    for (let r = 0; r <= length; r += 0.5) {
      const x = centerX + r * cos;
      const y = centerY + r * sin;

      const col = Math.round(x);
      const row = Math.round(y);

      const key = `${col}-${row}`;

      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        // Use the hand angle for the sticks themselves
        targets[key] = angle;

        // Thicker hand logic
        if (width > 1) {
          // For thicker hands, we might want neighbors
          // For now, let's just stick to the main line to avoid messiness
        }
      }
    }
  };

  // Add a center hub
  const addHub = (radius) => {
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= radius * radius) {
          const col = Math.round(centerX + x);
          const row = Math.round(centerY + y);
          if (col >= 0 && col < cols && row >= 0 && row < rows) {
            // Hub sticks can rotate slowly or be static? 
            // Let's make them form a cross or just static 0
            // Or better, point outward?
            const angle = Math.atan2(y, x) * (180 / Math.PI);
            targets[`${col}-${row}`] = angle;
          }
        }
      }
    }
  };

  // Add hour markers
  const addMarkers = () => {
    const radius = Math.min(cols, rows) * 0.45;
    for (let h = 0; h < 12; h++) {
      const angle = h * 30;
      const rad = (angle - 90) * (Math.PI / 180);
      const markerX = centerX + radius * Math.cos(rad);
      const markerY = centerY + radius * Math.sin(rad);

      const col = Math.round(markerX);
      const row = Math.round(markerY);

      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        // Marker sticks point towards center (or perpendicular?)
        // Let's point them inward
        targets[`${col}-${row}`] = angle;
      }
    }
  };

  // Draw Minute Hand
  addHand(minuteAngle, maxRadius, 1);

  // Draw Hour Hand
  addHand(hourAngle, maxRadius * 0.6, 1);

  // Add Hub
  addHub(1.5);

  // Add Markers
  addMarkers();

  return targets;
};
