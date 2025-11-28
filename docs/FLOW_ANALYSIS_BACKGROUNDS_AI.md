# Flow Analysis: Background Images & AI Bezier Optimization

**Date:** 2025-11-28
**Objective:** Plan integration of track background images and improve AI racer curve handling using Bezier curves

---

## TABLE OF CONTENTS
1. [Current System Architecture](#current-system-architecture)
2. [Feature 1: Background Images Integration](#feature-1-background-images-integration)
3. [Feature 2: AI Bezier Curve Optimization](#feature-2-ai-bezier-curve-optimization)
4. [Implementation Priority & Effort](#implementation-priority--effort)
5. [Testing Strategy](#testing-strategy)

---

## CURRENT SYSTEM ARCHITECTURE

### Rendering Pipeline Overview

```
Game Loop (main.js:155-165)
├── GameManager.gameLoop(timestamp)
│   └── For each RaceSession:
│       ├── session.update()        → Physics: updateRacer(), resolveCollisions()
│       ├── session.updateCamera()  → Camera.follow(racer)
│       └── session.draw()          → Renderer.render()
│           ├── Clear canvas
│           ├── Apply camera transform: ctx.translate(-cam.x, -cam.y)
│           ├── Draw track
│           ├── Draw finish line
│           ├── Draw debug elements (optional)
│           └── Draw racers
```

### Current Track Rendering (TrackRenderer.js:14-85)

```javascript
drawTrack(visualPath) {
  // Draws 140px wide gray track (#374151)
  // Uses filled path with lineTo() every 4th point
  // Adds white borders (perpendicular offset at 10-point intervals)
}

drawFinishLine(visualPath) {
  // Draws checkered pattern (10 segments, black/white alternating)
  // At first 10 points of the racing line
}
```

### Racer Movement & Path Following (physics.js:24-157)

```javascript
updateRacer(racer, path, frame, totalLaps) {
  // 1. Look-ahead steering:
  //    - Target point: path[racer.pathIndex + 35] (35 points ahead)
  //    - Calculate tangent vector from 5 ahead/5 behind
  //    - Create perpendicular vector for lane offset

  // 2. Lane behavior:
  //    - Base offset: racer.laneOffset (-20 to +20 pixels)
  //    - Wobble: sin(frame * freq) * amplitude (±2-5 pixels)
  //    - Final position: centerPt + perpendicular * offset

  // 3. Steering:
  //    - Calculate angle to target position
  //    - Clamp to maxSteerAngle (0.12 rad ≈ 7°)
  //    - Add random noise (±0.01)

  // 4. Speed:
  //    - Acceleration: 0.02-0.07 (depending on launch phase)
  //    - Deceleration: 0.002
  //    - Affected by fuel/tire status, engineMap param

  // 5. Path progression:
  //    - Check if within pathCheckDistance (60px) of next milestone
  //    - Jump pathIndex ahead by pathCheckSkip (100 points)
  //    - Detect lap wrapping at index wraparound
}
```

### Bezier Curve System (bezier.js:27-88)

```javascript
getBezierPoint(t, p0, cp1, cp2, p3) {
  // Cubic Bezier formula: B(t) = (1-t)³P₀ + 3(1-t)²tCP₁ + 3(1-t)t²CP₂ + t³P₃
  // Returns smooth interpolation between control points
}

generateRacingLineFromNodes(nodes) {
  // Input: Array of bezier nodes with handleIn/handleOut offsets
  // Process:
  //   For each node i (wrapping):
  //     Sample 60 points from t=0 to t=1 using getBezierPoint()
  //     Using: node[i], node[i].handleOut, node[i+1].handleIn, node[i+1]
  // Output: Array of ~420+ path points for stadium track
}
```

### Canvas & Rendering (RaceSession.js:54-90, Renderer.js:24-52)

```
Canvas: 700×400 pixels, gray-900 background
Camera: Viewport 700×400, smooth follow with 0.1 smoothing
Rendering order:
  1. clearRect()
  2. save() + translate(-camera.x, -camera.y)
  3. drawTrack()       ← GRAY BACKGROUND (currently static)
  4. drawFinishLine()
  5. drawDebugSplines() (if debugMode)
  6. drawRacer()       × N racers
  7. restore()
```

---

## FEATURE 1: BACKGROUND IMAGES INTEGRATION

### Goal
Replace procedurally drawn track backgrounds with image assets while maintaining camera movement and Z-order.

### Implementation Strategy

#### Phase 1: Asset Pipeline Setup

**Step 1.1: Create Assets Directory Structure**

```bash
src/
├── assets/
│   ├── backgrounds/
│   │   ├── stadium-bg.png      (1400×800 recommended, 2x canvas size)
│   │   ├── l-shape-bg.png
│   │   └── s-curve-bg.png
│   └── sprites/
│       └── motorcycles/ (future)
└── ...
```

**Why 2x canvas size:** Better quality when camera zooms/scales, seamless panning.

**Step 1.2: Image Asset Loader Module** (`src/assets/imageLoader.js`)

```javascript
// New file
class ImageLoader {
  constructor() {
    this.cache = {};
    this.loading = {};
  }

  async loadImage(trackType) {
    // Load: src/assets/backgrounds/{trackType}-bg.png
    // Cache in this.cache[trackType]
    // Return cached image or promise
  }

  getImage(trackType) {
    // Synchronous getter from cache
    return this.cache[trackType] || null;
  }
}

export const imageLoader = new ImageLoader();
```

**Step 1.3: Integration Point - RaceSession Initialization**

**File:** `src/core/RaceSession.js`

Current code (line 54):
```javascript
constructor(containerId, trackType, trackTitle) {
  // ...existing code...
}
```

**Modification:**
```javascript
async init() {
  // ...existing code (line 95-110)...

  // NEW: Load background image
  this.backgroundImage = await imageLoader.loadImage(this.trackType);

  // ...rest of init...
}
```

**Step 1.4: Render Integration Point**

**File:** `src/rendering/Renderer.js`

Current code (line 24-52):
```javascript
render(session, debugMode = false, selectedRacerId = null) {
  const { canvas, camera } = session;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // RENDER ORDER:
  const trackPath = session.visualPath;
  const racingLine = session.racingPath;

  trackRenderer.drawTrack(trackPath);
  trackRenderer.drawFinishLine(trackPath);

  // ... rest ...
}
```

**Modification:**
```javascript
render(session, debugMode = false, selectedRacerId = null) {
  const { canvas, camera } = session;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Option A: Background fixed to canvas (no camera movement)
  if (session.backgroundImage) {
    ctx.drawImage(session.backgroundImage, 0, 0, canvas.width, canvas.height);
  }

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Option B: Background moves with camera (alternate implementation)
  // if (session.backgroundImage) {
  //   const bgOffsetX = Math.floor(-camera.x / 2);  // Parallax effect
  //   const bgOffsetY = Math.floor(-camera.y / 2);
  //   ctx.drawImage(session.backgroundImage, bgOffsetX, bgOffsetY);
  // }

  trackRenderer.drawTrack(trackPath);
  trackRenderer.drawFinishLine(trackPath);

  // ... rest ...
}
```

#### Phase 2: Visual Track Rendering Adjustments

**Option A: Keep Track Semi-Transparent (Recommended)**

**File:** `src/rendering/TrackRenderer.js`

Current code (line 14-30):
```javascript
ctx.fillStyle = '#374151';
ctx.fill();
```

**Modification:**
```javascript
ctx.globalAlpha = 0.7;  // 70% opaque track overlay
ctx.fillStyle = '#374151';
ctx.fill();
ctx.globalAlpha = 1.0;  // Reset
```

Benefits:
- Background image shows through track
- Maintains visual clarity of track boundaries
- Provides context of track shape

**Option B: Remove Track Fill, Keep Borders Only**

```javascript
// Don't call ctx.fill() if background exists
if (!session.backgroundImage) {
  ctx.fillStyle = '#374151';
  ctx.fill();
}

// Always draw borders
ctx.strokeStyle = '#f8fafc';
ctx.lineWidth = 2;
ctx.stroke();
```

Benefits:
- Full background visibility
- Borders still define track edges
- Cleaner visual appearance

#### Phase 3: Image Optimization & Performance

**Considerations:**

1. **Image Size Management:**
   - Limit backgrounds to 1400×800 max (compressed)
   - Use PNG with 8-bit color where possible
   - Target file size: <200KB per image

2. **Lazy Loading:**
   - Load background only when track is selected
   - Use `RaceSession.init()` as loading trigger
   - Show loading indicator while image loads

3. **Canvas Resolution:**
   - Current: 700×400
   - Consider: 1400×800 option for higher DPI devices
   - Use `window.devicePixelRatio` to detect

**Code Addition (imageLoader.js):**
```javascript
async loadImage(trackType) {
  if (this.cache[trackType]) {
    return this.cache[trackType];
  }

  if (this.loading[trackType]) {
    return this.loading[trackType];
  }

  this.loading[trackType] = (async () => {
    const img = new Image();
    img.src = `/src/assets/backgrounds/${trackType}-bg.png`;

    return new Promise((resolve, reject) => {
      img.onload = () => {
        this.cache[trackType] = img;
        delete this.loading[trackType];
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`Failed to load background: ${trackType}`);
        delete this.loading[trackType];
        resolve(null);  // Graceful fallback
      };
    });
  })();

  return this.loading[trackType];
}
```

#### Phase 4: Fallback & Graceful Degradation

**File:** `src/rendering/TrackRenderer.js`

Current assumption: Image always exists. Fallback:

```javascript
drawTrack(visualPath) {
  // Always draw track geometry as base layer
  ctx.fillStyle = '#374151';
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Borders always visible
  ctx.strokeStyle = '#f8fafc';
  ctx.stroke();
}
```

### Data Flow Diagram

```
RaceSession.constructor()
  ↓
RaceSession.init()
  ├── await imageLoader.loadImage(trackType)
  └── this.backgroundImage = <Image>
      ↓
GameManager.gameLoop()
  ├── session.draw()
  │   └── Renderer.render(session)
  │       ├── ctx.drawImage(backgroundImage)  ← NEW
  │       ├── ctx.translate(-camera.x, -camera.y)
  │       ├── trackRenderer.drawTrack()       (semi-transparent if bg exists)
  │       ├── trackRenderer.drawFinishLine()
  │       └── Draw racers
  │
  └── Canvas output: Background + Track overlay + Racers
```

### Implementation Checklist

- [ ] Create `src/assets/backgrounds/` directory
- [ ] Create background images (stadium-bg.png, l-shape-bg.png, s-curve-bg.png)
- [ ] Create `src/assets/imageLoader.js` module
- [ ] Modify `RaceSession.js` to load background in `init()`
- [ ] Modify `Renderer.js` to draw background
- [ ] Update `TrackRenderer.js` to reduce track opacity (optional)
- [ ] Test with all 3 track types
- [ ] Performance test (FPS monitoring)
- [ ] Test fallback when image fails to load

---

## FEATURE 2: AI BEZIER CURVE OPTIMIZATION

### Current Limitations

The AI racers follow a pre-generated path from Bezier curves, but the path-following algorithm has room for improvement:

#### Limitation 1: Fixed Look-Ahead Distance
**Problem:** 35-point look-ahead works for straight sections but sub-optimal for curves.

Current code (physics.js:68-71):
```javascript
const lookAhead = 35;  // FIXED
const targetIdx = (racer.pathIndex + lookAhead) % path.length;
const centerPt = path[targetIdx];
```

**Issue:**
- Too short for gentle curves → poor anticipation
- Too long for sharp curves → overshooting

#### Limitation 2: Linear Path Sampling
**Problem:** Path points are evenly spaced (60 per Bezier segment), not arc-length parameterized.

**Effect:**
- Sharp curves have same point density as straights
- Racer speed is uniform → can't properly handle curve complexity
- No curvature-based adjustments

#### Limitation 3: Steering Limited to Lane Offsets
**Problem:** Racer only modulates lateral position, doesn't use curve information for speed.

Current code (physics.js:93-117):
```javascript
const steerAngle = Math.atan2(tyDiff, txDiff) - racer.angle;
// Clamp to maxSteerAngle: 0.12 rad (7 degrees)
```

**Issue:**
- Speed is set globally based on fuel/tires, not curve radius
- No early deceleration before sharp turns
- Aggressive racers can't take different lines

#### Limitation 4: No Curve Information Exposure
**Problem:** Racer class doesn't have access to path curvature data.

**Impact:**
- Can't vary speed based on turn tightness
- Can't choose optimal racing line dynamically
- AI racers all follow identical path (no skill differentiation)

### Proposed Improvements

#### Improvement 1: Curvature-Aware Look-Ahead Distance

**Goal:** Adapt look-ahead to path complexity.

**Solution:** Calculate curvature at current position, scale look-ahead dynamically.

**Implementation (physics.js new function):**

```javascript
calculateCurvature(path, pathIndex, window = 5) {
  // Calculate curvature at pathIndex using surrounding points
  // Returns: radius of curvature (larger = straighter, smaller = tighter turn)

  const prev = path[(pathIndex - window + path.length) % path.length];
  const curr = path[pathIndex];
  const next = path[(pathIndex + window) % path.length];

  // Vector from prev to curr
  const dx1 = curr.x - prev.x;
  const dy1 = curr.y - prev.y;
  const d1 = Math.sqrt(dx1*dx1 + dy1*dy1);

  // Vector from curr to next
  const dx2 = next.x - curr.x;
  const dy2 = next.y - curr.y;
  const d2 = Math.sqrt(dx2*dx2 + dy2*dy2);

  // Cross product magnitude (area of triangle)
  const cross = Math.abs(dx1*dy2 - dy1*dx2);

  // Curvature = 2 * area / (side1 * side2 * side3)
  const perimeter = d1 + d2;
  const curvature = cross > 0 ? (2 * cross) / (d1 * d2 * perimeter) : 0;

  return curvature;  // 0 = straight, higher = tighter
}
```

**Usage in updateRacer():**

```javascript
const baseLookAhead = 35;
const curvature = calculateCurvature(path, racer.pathIndex);
const lookAhead = Math.round(
  baseLookAhead * (1 + curvature * 2)  // Increase for curves
);
const targetIdx = (racer.pathIndex + lookAhead) % path.length;
```

**Effect:**
- Straight sections: lookAhead = 35 (default)
- Gentle curves: lookAhead = 40-50 (better anticipation)
- Sharp turns: lookAhead = 30-35 (reduced for precision)

#### Improvement 2: Arc-Length Parameterized Path

**Goal:** Ensure uniform point density relative to actual track distance.

**Current Problem:**
```
Stadium track: 7 Bezier segments × 60 points/segment = 420 total points
But actual distances vary:
  - Straight section (500px): 60 points → 8.3px per point
  - Tight curve (200px): 60 points → 3.3px per point
```

**Solution:** Generate path with arc-length parameterization.

**New function (bezier.js):**

```javascript
generateRacingLineArcLength(nodes, targetSpacing = 5) {
  // targetSpacing: desired pixels between path points
  // Output: More points in curves, fewer in straights

  const points = [];
  let totalDistance = 0;

  for (let i = 0; i < nodes.length; i++) {
    const p0 = nodes[i];
    const cp1 = {
      x: p0.x + p0.handleOut.x,
      y: p0.y + p0.handleOut.y
    };

    const p3 = nodes[(i + 1) % nodes.length];
    const cp2 = {
      x: p3.x + p3.handleIn.x,
      y: p3.y + p3.handleIn.y
    };

    // Adaptive sampling: more points for high curvature
    const segmentLength = estimateBezierLength(p0, cp1, cp2, p3);
    const pointsNeeded = Math.ceil(segmentLength / targetSpacing);

    for (let t = 0; t <= 1; t += 1 / pointsNeeded) {
      const pt = getBezierPoint(t, p0, cp1, cp2, p3);
      points.push(pt);

      if (points.length > 1) {
        const prev = points[points.length - 2];
        const dist = Math.hypot(pt.x - prev.x, pt.y - prev.y);
        totalDistance += dist;
      }
    }
  }

  return points;
}

function estimateBezierLength(p0, cp1, cp2, p3, samples = 10) {
  // Approximate Bezier length using sampling
  let length = 0;
  let prevPt = p0;

  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const pt = getBezierPoint(t, p0, cp1, cp2, p3);
    length += Math.hypot(pt.x - prevPt.x, pt.y - prevPt.y);
    prevPt = pt;
  }

  return length;
}
```

**Integration (RaceSession.init()):**

```javascript
// Current:
this.racingPath = generateRacingLineFromNodes(racingNodes);

// New (opt-in):
this.racingPath = generateRacingLineArcLength(racingNodes, targetSpacing = 5);
```

**Benefits:**
- More points in tight curves (better steering precision)
- Fewer points in straights (better performance)
- Curvature information naturally encoded in point density

#### Improvement 3: Curvature-Aware Speed Adjustment

**Goal:** Vary speed based on turn tightness.

**Current code (physics.js:54-65):**
```javascript
// Speed: uniform acceleration/deceleration
const targetSpeed = config.velocity + config.normalAcceleration;
```

**New approach:**

```javascript
calculateTargetSpeed(racer, path, pathIndex, params) {
  const baseSpeed = config.velocity;

  // 1. Fuel/tire penalties (existing)
  let speedMultiplier = 0.82 + (params.engineMap / 100) * 0.3;
  if (racer.fuel <= 0) speedMultiplier *= 0.6;
  if (racer.tires < 20) speedMultiplier *= 0.7;

  // 2. Curve-based speed reduction (NEW)
  const curvature = calculateCurvature(path, pathIndex, window = 10);
  const curveSpeedFactor = 1 - Math.min(curvature * 5, 0.5);  // 0.5-1.0 range

  // 3. Risk parameter affects aggressiveness (NEW)
  // High risk: faster through curves (factor closer to 1)
  // Low risk: slower through curves (factor closer to 0.5)
  const riskFactor = 0.5 + (params.risk / 100) * 0.5;

  // 4. Final speed
  const curvatureAdjustedFactor = 0.5 + (curveSpeedFactor * riskFactor);

  return baseSpeed * speedMultiplier * curvatureAdjustedFactor;
}
```

**Usage in updateRacer():**

```javascript
racer.targetSpeed = calculateTargetSpeed(
  racer, path, racer.pathIndex, racer.params
);

// Smooth acceleration/deceleration
if (racer.currentSpeed < racer.targetSpeed) {
  racer.currentSpeed += config.normalAcceleration;
} else {
  racer.currentSpeed -= config.deceleration;
}
```

**Effect:**
- Aggressive racers (risk=70): Take curves at 80-100% speed
- Conservative racers (risk=30): Take curves at 50-70% speed
- Auto-deceleration before tight turns based on curvature
- Skill differentiation emerges naturally

#### Improvement 4: Dynamic Racing Line Selection

**Goal:** Allow racers to choose different lines based on skill/risk.

**Current:** All racers follow identical Bezier-generated path.

**New approach:** Generate 3 racing lines (conservative, optimal, aggressive) and racer AI picks based on params.

**Implementation (tracks.js):**

```javascript
// Add to each track definition:
getMultipleRacingLines(type) {
  const nodes = getBezierNodes(type);

  // Conservative line: stays near track center, wider turns
  const conservativeLine = generateRacingLineFromNodes(nodes, offsetInward = 0);

  // Optimal line: uses track width efficiently
  const optimalLine = generateRacingLineFromNodes(nodes, offsetInward = 10);

  // Aggressive line: tight turns, risks outer wall
  const aggressiveLine = generateRacingLineFromNodes(nodes, offsetInward = -15);

  return {
    conservative: conservativeLine,
    optimal: optimalLine,
    aggressive: aggressiveLine
  };
}
```

**Racer Path Selection (Racer.js constructor):**

```javascript
selectRacingLine(risk) {
  // risk: 30-70 (from player params)
  if (risk < 40) return this.racingLines.conservative;
  if (risk < 60) return this.racingLines.optimal;
  return this.racingLines.aggressive;
}
```

**Effect:**
- Conservative racers take wider turns, slower but more stable
- Aggressive racers cut curves tightly, faster but risk crashes
- Visual differentiation in racer behavior
- Natural skill progression for players

### Summary of Improvements

| Improvement | Current | Improved | Benefit |
|-------------|---------|----------|---------|
| **Look-ahead Distance** | Fixed 35 points | Curvature-scaled 30-50 | Better curve anticipation |
| **Path Sampling** | Uniform 60 points/segment | Arc-length adaptive | More precision in curves |
| **Speed Control** | Global params only | Curvature-aware | Natural speed for curves |
| **Racing Lines** | Single path for all | 3 options (risk-based) | Player differentiation |

### Implementation Checklist

- [ ] Add `calculateCurvature()` function to physics.js
- [ ] Implement dynamic look-ahead in `updateRacer()`
- [ ] Add `generateRacingLineArcLength()` to bezier.js
- [ ] Add `estimateBezierLength()` helper to bezier.js
- [ ] Add `calculateTargetSpeed()` to physics.js
- [ ] Integrate curvature-aware speed in `updateRacer()`
- [ ] Add `getMultipleRacingLines()` to tracks.js
- [ ] Add line selection logic to Racer class
- [ ] Test racer behavior with aggressive/conservative params
- [ ] Tune curvature weighting factors empirically
- [ ] Performance test (ensure no FPS impact)

---

## IMPLEMENTATION PRIORITY & EFFORT

### Phase 1: Background Images (2-4 hours)

**Effort:** Low | **Impact:** High (visual improvement)
**Dependencies:** None | **Risk:** Low

1. Create asset infrastructure (imageLoader.js)
2. Create placeholder background images (basic colored rectangles)
3. Integrate into RaceSession and Renderer
4. Test fallback behavior

**Deliverable:** Backgrounds showing on tracks without breaking functionality

### Phase 2: AI Curvature Awareness (4-6 hours)

**Effort:** Medium | **Impact:** High (gameplay improvement)
**Dependencies:** None | **Risk:** Medium

1. Implement `calculateCurvature()` function
2. Test curvature values on different track sections
3. Integrate curvature-aware look-ahead
4. Tune weighting factors through observation

**Deliverable:** Racers more responsive on curves, better lap times

### Phase 3: Arc-Length Parameterization (3-5 hours)

**Effort:** Medium | **Impact:** Medium (precision improvement)
**Dependencies:** Phase 2 recommended | **Risk:** Medium

1. Implement `estimateBezierLength()`
2. Implement `generateRacingLineArcLength()`
3. Switch path generation in RaceSession
4. Compare performance vs. uniform sampling

**Deliverable:** Smoother path following, better curve handling

### Phase 4: Speed Modulation (2-3 hours)

**Effort:** Low-Medium | **Impact:** Medium (realism)
**Dependencies:** Phase 2 | **Risk:** Low

1. Implement `calculateTargetSpeed()`
2. Integrate into `updateRacer()`
3. Tune curvature weight and risk factor
4. Test on all track types

**Deliverable:** Racers slow down for tight turns, faster on straights

### Phase 5: Multiple Racing Lines (4-6 hours)

**Effort:** Medium | **Impact:** High (gameplay variety)
**Dependencies:** Phases 3-4 | **Risk:** Medium

1. Extend track definitions with 3 racing lines
2. Implement line selection in Racer class
3. Test behavior across risk levels
4. Tune offset values for each track

**Deliverable:** Different racer behaviors visible, skill differentiation

### Recommended Execution Order

```
Week 1:
├── Phase 1: Background Images (parallel with Phase 2)
└── Phase 2: Curvature Awareness

Week 2:
├── Phase 3: Arc-Length Parameterization
├── Phase 4: Speed Modulation (parallel)
└── Phase 5: Multiple Racing Lines (parallel)
```

**Total Estimated Effort:** 15-24 hours
**Total Estimated Impact:** 8.5/10 (gameplay + visuals)

---

## TESTING STRATEGY

### Phase 1: Background Images Testing

**Unit Tests:**
- [ ] imageLoader successfully caches loaded images
- [ ] imageLoader handles failed image loads gracefully
- [ ] Renderer draws background when image exists
- [ ] Renderer skips background when image is null

**Integration Tests:**
- [ ] All 3 tracks load backgrounds successfully
- [ ] Camera movement doesn't break background alignment
- [ ] Background doesn't interfere with racer/track rendering
- [ ] Performance maintained (60 FPS on canvas operations)

**Manual Tests:**
- [ ] Visually verify backgrounds look appropriate for each track
- [ ] Test track transitions (stadium → l-shape)
- [ ] Verify track overlays are readable with backgrounds
- [ ] Test on different screen sizes

### Phase 2-5: AI Optimization Testing

**Unit Tests:**
- [ ] `calculateCurvature()` returns reasonable values (0-0.5 range)
- [ ] `generateRacingLineArcLength()` produces consistent point spacing
- [ ] `calculateTargetSpeed()` scales correctly with risk parameter

**Integration Tests:**
- [ ] Racers complete laps successfully with curvature adjustments
- [ ] No crashes from invalid path indices
- [ ] Lap times reasonable for different risk levels

**Behavioral Tests:**
- [ ] Aggressive racers (risk=70) noticeably faster than conservative (risk=30)
- [ ] Racers auto-decelerate before sharp turns
- [ ] Different racer starting positions don't break path following

**Performance Tests:**
- [ ] Physics calculations remain <16ms per frame (60 FPS target)
- [ ] No memory leaks from path generation
- [ ] Curvature calculations cached/optimized

### Test Suite Structure

```
tests/
├── assets/
│   └── imageLoader.test.js
├── engine/
│   └── physics.test.js      (curvature, speed calculations)
├── math/
│   └── bezier.test.js       (arc-length parameterization)
└── integration/
    └── raceSession.test.js  (end-to-end racer behavior)
```

**Test Execution:**
```bash
npm run test                 # Run all tests
npm run test -- --ui        # Interactive UI
npm run test -- --coverage  # Coverage report
```

---

## APPENDIX: CODE INTEGRATION MAPS

### Background Images - File Modifications Summary

```
NEW FILES:
├── src/assets/backgrounds/
│   ├── stadium-bg.png
│   ├── l-shape-bg.png
│   └── s-curve-bg.png
└── src/assets/imageLoader.js

MODIFIED FILES:
├── src/core/RaceSession.js
│   └── Add in init(): this.backgroundImage = await imageLoader.loadImage()
├── src/rendering/Renderer.js
│   └── Add after clearRect: if (session.backgroundImage) ctx.drawImage()
└── src/rendering/TrackRenderer.js
    └── Optional: Add ctx.globalAlpha = 0.7 to drawTrack()
```

### AI Optimization - File Modifications Summary

```
MODIFIED FILES:
├── src/engine/physics.js
│   ├── Add: calculateCurvature(path, pathIndex, window)
│   ├── Add: calculateTargetSpeed(racer, path, pathIndex, params)
│   └── Modify in updateRacer(): Dynamic lookAhead + speed adjustment
├── src/math/bezier.js
│   ├── Add: estimateBezierLength(p0, cp1, cp2, p3, samples)
│   └── Add: generateRacingLineArcLength(nodes, targetSpacing)
├── src/config/tracks.js
│   └── Add: getMultipleRacingLines(type) for each track
└── src/core/Racer.js
    └── Add: selectRacingLine(risk) method
```

---

## NEXT STEPS

1. **Approve implementation plan** - Review this document and confirm priority order
2. **Create feature branches** - `feature/background-images` and `feature/ai-bezier-optimization`
3. **Start Phase 1** - Background images (lowest risk, high visual impact)
4. **Parallel Phase 2** - Curvature awareness (foundation for later phases)
5. **Iterate on Phases 3-5** - Based on Phase 1-2 success

**Questions for stakeholder review:**
- Preference: Fixed or parallax background movement?
- Should background images be packaged with build or loaded from CDN?
- Priority: Visual appeal (Phase 1) vs. Gameplay improvement (Phases 2-5)?
- Target FPS: Maintain 60 FPS or acceptable at 30 FPS for richer backgrounds?

---

**Document Version:** 1.0
**Last Updated:** 2025-11-28
**Status:** Ready for Implementation
