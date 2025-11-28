# Architecture Document: GP Vector Manager

## Executive Summary

This document provides a comprehensive architectural analysis of the GP Vector Manager top-down racing game and recommends a structured migration path from a single-file monolith (~850 lines) to a maintainable, scalable multi-file architecture using ES modules.

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Identified Concerns and Modules](#2-identified-concerns-and-modules)
3. [Recommended Folder Structure](#3-recommended-folder-structure)
4. [File Breakdown and Module Separation](#4-file-breakdown-and-module-separation)
5. [Build Tool Recommendation](#5-build-tool-recommendation)
6. [State Management Approach](#6-state-management-approach)
7. [Game Loop and Rendering Pipeline](#7-game-loop-and-rendering-pipeline)
8. [Testing Strategy](#8-testing-strategy)
9. [Development Workflow](#9-development-workflow)
10. [Migration Plan](#10-migration-plan)
11. [Long-Term Considerations](#11-long-term-considerations)

---

## 1. Current Architecture Analysis

### 1.1 Current State

The entire application resides in `/Users/rodrigoifalco/clients/coco/simple-gp/index.html`:

- **Lines 1-24**: HTML head with external dependencies (Tailwind CDN, Firebase SDK, Google Fonts)
- **Lines 25-93**: HTML structure (top bar, game container, scoreboard, controls)
- **Lines 95-853**: Inline JavaScript containing all game logic

### 1.2 Architectural Violations Identified

| Issue | Location | Impact |
|-------|----------|--------|
| **Monolithic Structure** | Entire file | High - No separation of concerns |
| **Global State Mutation** | Lines 108-115 | High - Unpredictable state changes |
| **Mixed Responsibilities** | `RaceSession` class | Medium - Handles rendering, physics, input, and state |
| **Tight Coupling** | DOM manipulation throughout | Medium - Hard to test and modify |
| **No Dependency Injection** | Constructor hardcodes dependencies | Medium - Difficult to mock/test |
| **Magic Numbers** | Lines 102-106 | Low - Configuration scattered |
| **Inline Event Handlers** | HTML onclick attributes | Low - Mixing markup and logic |

### 1.3 Current Data Flow

```
Global State (sessions[], globalParams, isPaused, etc.)
       |
       v
   gameLoop() -- calls --> RaceSession.update()
       |                         |
       |                         +--> updateRacerLogic()
       |                         +--> resolveCollisions()
       |                         +--> updateCamera()
       v
   RaceSession.draw() -- renders --> Canvas
       |
       v
   updateGlobalScoreboard() -- updates --> DOM
```

---

## 2. Identified Concerns and Modules

### 2.1 Distinct Domains

| Domain | Current Lines | Responsibility |
|--------|---------------|----------------|
| **Configuration** | 97-106 | Constants, game parameters |
| **Geometry/Math** | 126-174 | Bezier curves, path generation |
| **Track Definitions** | 176-265 | Visual tracks and racing line nodes |
| **Race Session** | 267-671 | Core game class (needs decomposition) |
| **UI/Controls** | 673-832 | Scoreboard, player controls, DOM updates |
| **Game Loop** | 834-843 | Main loop orchestration |
| **Bootstrap** | 845-853 | Initialization |

### 2.2 RaceSession Decomposition

The `RaceSession` class (404 lines) violates Single Responsibility Principle. It should be split:

| Sub-Module | Methods | New Location |
|------------|---------|--------------|
| **Physics Engine** | `updateRacerLogic()`, `resolveCollisions()` | `engine/physics.js` |
| **Renderer** | `draw()`, `drawRacer()` | `rendering/renderer.js` |
| **Input Handler** | `onMouseDown()`, `onMouseMove()`, `onMouseUp()`, `getMousePos()` | `input/trackEditor.js` |
| **Camera Controller** | `updateCamera()` | `rendering/camera.js` |
| **Race State** | `init()`, `checkFinishState()` | `state/raceState.js` |

---

## 3. Recommended Folder Structure

```
simple-gp/
|-- index.html                 # Minimal HTML shell
|-- package.json               # Dependencies and scripts
|-- vite.config.js             # Build configuration
|-- .gitignore
|-- CLAUDE.md                  # Project instructions
|
|-- src/
|   |-- main.js                # Entry point, bootstrap
|   |
|   |-- config/
|   |   |-- constants.js       # RACER_NAMES, COLORS, NUMBERS
|   |   |-- gameConfig.js      # TARGET_RACE_PIXELS, VELOCITY, etc.
|   |   `-- tracks.js          # Track definitions (visual + bezier nodes)
|   |
|   |-- core/
|   |   |-- GameManager.js     # Orchestrates sessions, game loop
|   |   |-- RaceSession.js     # Simplified session container
|   |   `-- Racer.js           # Racer entity class
|   |
|   |-- engine/
|   |   |-- physics.js         # Movement, collision detection
|   |   `-- pathFollowing.js   # Racing line navigation
|   |
|   |-- rendering/
|   |   |-- Renderer.js        # Canvas rendering orchestration
|   |   |-- TrackRenderer.js   # Track-specific drawing
|   |   |-- RacerRenderer.js   # Racer sprite drawing
|   |   `-- Camera.js          # Camera follow logic
|   |
|   |-- input/
|   |   |-- InputManager.js    # Centralized input handling
|   |   `-- TrackEditor.js     # Debug mode bezier editing
|   |
|   |-- state/
|   |   |-- GameState.js       # Global state container
|   |   `-- RaceState.js       # Per-session race state
|   |
|   |-- ui/
|   |   |-- Scoreboard.js      # Scoreboard component
|   |   |-- PlayerControls.js  # Strategy panel component
|   |   `-- TopBar.js          # Header controls
|   |
|   |-- math/
|   |   |-- geometry.js        # addLine, addArc utilities
|   |   `-- bezier.js          # Bezier curve calculations
|   |
|   `-- utils/
|       |-- shuffle.js         # Array shuffle utility
|       `-- dom.js             # DOM helper functions
|
|-- tests/
|   |-- unit/
|   |   |-- physics.test.js
|   |   |-- bezier.test.js
|   |   `-- geometry.test.js
|   |
|   |-- integration/
|   |   `-- raceSession.test.js
|   |
|   `-- setup.js               # Test configuration
|
|-- docs/
|   |-- ARCHITECTURE.md        # This document
|   `-- API.md                 # Public API documentation
|
`-- assets/                    # Future: sprites, sounds
    `-- .gitkeep
```

---

## 4. File Breakdown and Module Separation

### 4.1 Configuration Module

**`src/config/constants.js`**
```javascript
// Extract from lines 97-99
export const RACER_NAMES = ["Joan", "Juan", "Brayan", "Fico", "Juani", "Edu", "Mechi", "Coco", "Gonza", "Dani", "Martin"];
export const RACER_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#64748b', '#14b8a6'];
export const RACER_NUMBERS = [1, 5, 7, 14, 18, 21, 25, 27, 31, 33, 37];
export const PLAYER_INDICES = [0, 1];
```

**`src/config/gameConfig.js`**
```javascript
// Extract from lines 102-106
export const GAME_CONFIG = {
  targetRacePixels: 9000,
  racerRadius: 7,
  velocity: 1.8,
  startDelayFrames: 60,
  stepSize: 2,
  fps: 60
};
```

**`src/config/tracks.js`**
```javascript
// Extract from lines 176-265
// Contains getVisualTrackPoints() and getBezierNodes()
export const TRACK_TYPES = {
  'l-shape': { ... },
  's-curve': { ... },
  'stadium': { ... }
};
```

### 4.2 Math Utilities

**`src/math/geometry.js`**
```javascript
// Extract from lines 127-144
export function addLine(path, x1, y1, x2, y2, stepSize = 2) { ... }
export function addArc(path, cx, cy, r, startAngle, endAngle, stepSize = 2) { ... }
```

**`src/math/bezier.js`**
```javascript
// Extract from lines 147-174
export function getBezierPoint(p0, cp1, cp2, p3, t) { ... }
export function generateRacingLineFromNodes(nodes, pointsPerSegment = 60) { ... }
```

### 4.3 Core Game Classes

**`src/core/Racer.js`**
```javascript
// New class extracted from racer object creation (lines 375-400)
export class Racer {
  constructor(id, name, color, racingNumber, position, angle, isPlayer) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.racingNumber = racingNumber;
    this.x = position.x;
    this.y = position.y;
    this.angle = angle;
    this.isPlayer = isPlayer;

    // State
    this.fuel = 100;
    this.tires = 100;
    this.currentSpeed = 0;
    this.pathIndex = 0;
    this.lap = 0;
    this.progress = 0;
    this.finished = false;
    this.finishTime = 0;

    // Behavior parameters
    this.params = { tireAggression: 60, engineMap: 60, risk: 60 };
    this.launchDelay = Math.floor(Math.random() * 15);
    this.launchAccel = 0.05 + Math.random() * 0.02;
    this.laneOffset = (Math.random() * 40) - 20;
    this.wobblePhase = Math.random() * Math.PI * 2;
  }

  setParams(params) { ... }
  reset() { ... }
}
```

**`src/core/RaceSession.js`**
```javascript
// Simplified orchestrator (extracted from lines 267-671)
import { Camera } from '../rendering/Camera.js';
import { PhysicsEngine } from '../engine/physics.js';
import { RaceState } from '../state/RaceState.js';

export class RaceSession {
  constructor(trackType, title, config) {
    this.trackType = trackType;
    this.title = title;
    this.physics = new PhysicsEngine(config);
    this.camera = new Camera();
    this.state = new RaceState();
    // ...
  }

  init() { ... }
  update(deltaTime) { ... }
  getRacers() { ... }
}
```

**`src/core/GameManager.js`**
```javascript
// New orchestrator class
import { RaceSession } from './RaceSession.js';
import { GameState } from '../state/GameState.js';

export class GameManager {
  constructor(canvasContainerId) {
    this.sessions = [];
    this.state = new GameState();
    this.animationFrameId = null;
    this.lastTimestamp = 0;
  }

  changeMode(mode) { ... }
  restart() { ... }
  togglePause() { ... }
  gameLoop(timestamp) { ... }
  destroy() { ... }
}
```

### 4.4 Rendering Module

**`src/rendering/Renderer.js`**
```javascript
// Coordinates all rendering
export class Renderer {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = camera;
    this.trackRenderer = new TrackRenderer(this.ctx);
    this.racerRenderer = new RacerRenderer(this.ctx);
  }

  render(session, debugMode) {
    this.clear();
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);

    this.trackRenderer.draw(session.visualPath);
    if (debugMode) {
      this.trackRenderer.drawDebugSpline(session.racingPath, session.bezierNodes);
    }
    session.racers.forEach(r => this.racerRenderer.draw(r));

    this.ctx.restore();
  }
}
```

**`src/rendering/Camera.js`**
```javascript
// Extract from lines 558-563
export class Camera {
  constructor(viewportWidth = 700, viewportHeight = 400) {
    this.x = 0;
    this.y = 0;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.smoothing = 0.1;
  }

  follow(target) {
    const tx = target.x - this.viewportWidth / 2;
    const ty = target.y - this.viewportHeight / 2;
    this.x += (tx - this.x) * this.smoothing;
    this.y += (ty - this.y) * this.smoothing;
  }
}
```

### 4.5 Physics Engine

**`src/engine/physics.js`**
```javascript
// Extract from lines 444-536, 538-556
import { GAME_CONFIG } from '../config/gameConfig.js';

export class PhysicsEngine {
  constructor(config = GAME_CONFIG) {
    this.config = config;
  }

  updateRacer(racer, racingPath, frameCount, isPaused) {
    // Movement logic from updateRacerLogic()
  }

  resolveCollisions(racers) {
    // Collision resolution from resolveCollisions()
  }

  calculateSpeedMultiplier(racer) { ... }
  calculateSteering(racer, targetAngle) { ... }
}
```

### 4.6 State Management

**`src/state/GameState.js`**
```javascript
// Extract global state from lines 108-115
export class GameState {
  constructor() {
    this.isPaused = false;
    this.selectedRacerId = 0;
    this.globalParams = {
      0: { tireAggression: 60, engineMap: 60, risk: 60 },
      1: { tireAggression: 60, engineMap: 60, risk: 60 }
    };
  }

  // Observer pattern for UI updates
  subscribe(listener) { ... }
  notify() { ... }

  setSelectedRacer(id) { ... }
  updateParams(racerId, param, value) { ... }
  togglePause() { ... }
}
```

### 4.7 UI Components

**`src/ui/Scoreboard.js`**
```javascript
// Extract from lines 674-718
export class Scoreboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  update(racers, totalLaps, selectedRacerId, onSelectPilot) {
    // Generate scoreboard HTML
  }
}
```

**`src/ui/PlayerControls.js`**
```javascript
// Extract from lines 779-832
export class PlayerControls {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  update(racers, playerIndices, globalParams, selectedRacerId, callbacks) {
    // Generate controls HTML
  }
}
```

### 4.8 Input Handling

**`src/input/TrackEditor.js`**
```javascript
// Extract from lines 297-345
export class TrackEditor {
  constructor(session) {
    this.session = session;
    this.dragTarget = null;
    this.enabled = false;
  }

  enable() { this.enabled = true; }
  disable() { this.enabled = false; }

  onMouseDown(e) { ... }
  onMouseMove(e) { ... }
  onMouseUp() { ... }
}
```

---

## 5. Build Tool Recommendation

### 5.1 Recommended: Vite

**Why Vite over alternatives:**

| Criteria | Vite | esbuild | Webpack |
|----------|------|---------|---------|
| Zero config | Excellent | Good | Poor |
| Dev server speed | Excellent | N/A | Slow |
| HMR support | Native | Manual | Requires config |
| ES modules | Native | Native | Requires config |
| Learning curve | Low | Low | High |
| Production builds | Fast (uses esbuild) | Fast | Slow |

### 5.2 Vite Configuration

**`vite.config.js`**
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020'
  },
  server: {
    port: 3000,
    open: true
  }
});
```

**`package.json`**
```json
{
  "name": "gp-vector-manager",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src/"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "eslint": "^8.0.0",
    "jsdom": "^24.0.0"
  }
}
```

### 5.3 Updated index.html

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Top-Down GP Manager</title>
  <link rel="stylesheet" href="/src/styles/main.css">
</head>
<body class="h-screen flex flex-col overflow-hidden p-4">
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

---

## 6. State Management Approach

### 6.1 Recommended Pattern: Simple Observable Store

Given the application complexity, a lightweight observable pattern is sufficient (no Redux/Zustand needed):

```javascript
// src/state/GameState.js
export class GameState {
  #state = {};
  #listeners = new Set();

  constructor(initialState) {
    this.#state = { ...initialState };
  }

  get(key) {
    return this.#state[key];
  }

  set(key, value) {
    this.#state[key] = value;
    this.#notify();
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #notify() {
    this.#listeners.forEach(fn => fn(this.#state));
  }
}
```

### 6.2 State Structure

```javascript
const initialState = {
  // UI State
  isPaused: false,
  selectedRacerId: 0,
  debugMode: false,
  currentTrack: 's-curve',

  // Player Configuration
  globalParams: {
    0: { tireAggression: 60, engineMap: 60, risk: 60 },
    1: { tireAggression: 60, engineMap: 60, risk: 60 }
  },

  // Race State (derived from sessions)
  raceStatus: 'loading', // 'loading' | 'ready' | 'racing' | 'finished'
  currentLap: 0,
  totalLaps: 5
};
```

### 6.3 State Flow Diagram

```
User Action (click, key press)
        |
        v
   InputManager
        |
        v
   GameState.set()
        |
        v
   notify() --> Listeners
        |           |
        v           v
   GameManager   UI Components
   (game logic)  (DOM updates)
```

---

## 7. Game Loop and Rendering Pipeline

### 7.1 Current Issues

- Frame rate dependent physics (`animationFrameId % 5 === 0`)
- DOM updates inside game loop (expensive)
- No delta time calculation

### 7.2 Recommended Architecture

**Fixed timestep with interpolation:**

```javascript
// src/core/GameManager.js
const FIXED_TIMESTEP = 1000 / 60; // 60 FPS physics

export class GameManager {
  constructor() {
    this.accumulator = 0;
    this.lastTime = 0;
    this.uiUpdateCounter = 0;
  }

  gameLoop(currentTime) {
    if (this.state.isPaused) {
      this.animationFrameId = requestAnimationFrame(t => this.gameLoop(t));
      return;
    }

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.accumulator += deltaTime;

    // Fixed timestep physics updates
    while (this.accumulator >= FIXED_TIMESTEP) {
      this.sessions.forEach(s => s.update(FIXED_TIMESTEP));
      this.accumulator -= FIXED_TIMESTEP;
    }

    // Render with interpolation factor
    const alpha = this.accumulator / FIXED_TIMESTEP;
    this.sessions.forEach(s => s.render(alpha));

    // Throttled UI updates (every 5 frames)
    this.uiUpdateCounter++;
    if (this.uiUpdateCounter % 5 === 0) {
      this.updateUI();
    }

    this.animationFrameId = requestAnimationFrame(t => this.gameLoop(t));
  }
}
```

### 7.3 Rendering Pipeline

```
1. Clear canvas
2. Apply camera transform
3. Draw static elements (track, finish line)
4. Draw dynamic elements (racers) with interpolation
5. Draw debug overlays (if enabled)
6. Restore canvas state
7. Update UI (throttled)
```

---

## 8. Testing Strategy

### 8.1 Test Pyramid

```
        /\
       /  \  E2E (Playwright) - 10%
      /----\
     /      \  Integration - 30%
    /--------\
   /          \  Unit Tests - 60%
  /____________\
```

### 8.2 Unit Tests

**What to test:**
- Math utilities (bezier, geometry)
- Physics calculations (speed, collisions)
- State management (GameState)
- Pure functions

**Example test:**

```javascript
// tests/unit/bezier.test.js
import { describe, it, expect } from 'vitest';
import { getBezierPoint } from '../../src/math/bezier.js';

describe('getBezierPoint', () => {
  it('returns start point at t=0', () => {
    const p0 = { x: 0, y: 0 };
    const cp1 = { x: 10, y: 0 };
    const cp2 = { x: 20, y: 0 };
    const p3 = { x: 30, y: 0 };

    const result = getBezierPoint(p0, cp1, cp2, p3, 0);

    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
  });

  it('returns end point at t=1', () => {
    const p0 = { x: 0, y: 0 };
    const cp1 = { x: 10, y: 0 };
    const cp2 = { x: 20, y: 0 };
    const p3 = { x: 30, y: 0 };

    const result = getBezierPoint(p0, cp1, cp2, p3, 1);

    expect(result.x).toBeCloseTo(30);
    expect(result.y).toBeCloseTo(0);
  });
});
```

### 8.3 Integration Tests

**What to test:**
- RaceSession initialization and update cycle
- Physics + Racer interaction
- State changes triggering UI updates

```javascript
// tests/integration/raceSession.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { RaceSession } from '../../src/core/RaceSession.js';

describe('RaceSession', () => {
  let session;

  beforeEach(() => {
    session = new RaceSession('stadium', 'Test Race');
    session.init();
  });

  it('initializes with correct number of racers', () => {
    expect(session.getRacers()).toHaveLength(11);
  });

  it('all racers start at lap 0', () => {
    session.getRacers().forEach(racer => {
      expect(racer.lap).toBe(0);
    });
  });
});
```

### 8.4 Test Configuration

**`vitest.config.js`**
```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/']
    }
  }
});
```

---

## 9. Development Workflow

### 9.1 Branch Strategy

```
main (stable releases)
  |
  +-- develop (integration branch)
        |
        +-- feature/module-separation
        +-- feature/state-management
        +-- fix/collision-detection
```

### 9.2 Recommended Workflow

1. **Feature branches** from `develop`
2. **Pull requests** with code review
3. **CI pipeline** runs tests and lint
4. **Squash merge** to develop
5. **Release branches** from develop to main

### 9.3 Development Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "typecheck": "tsc --noEmit"
  }
}
```

### 9.4 Code Quality Tools

**ESLint Configuration (`.eslintrc.cjs`):**
```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error'
  }
};
```

---

## 10. Migration Plan

### Phase 1: Setup Build Pipeline (Day 1)

**Steps:**
1. Initialize npm project
2. Install Vite and dependencies
3. Create minimal index.html
4. Create `src/main.js` that imports existing inline code
5. Verify game works unchanged

**Deliverables:**
- Working dev server with HMR
- Build produces single bundle (same as before)

### Phase 2: Extract Configuration (Day 2)

**Steps:**
1. Create `src/config/` directory
2. Move constants to `constants.js`
3. Move game parameters to `gameConfig.js`
4. Update imports in main.js

**Risk:** Low - no logic changes

### Phase 3: Extract Math Utilities (Day 2-3)

**Steps:**
1. Create `src/math/` directory
2. Extract `geometry.js` (addLine, addArc)
3. Extract `bezier.js` (getBezierPoint, generateRacingLineFromNodes)
4. Add unit tests for math functions

**Risk:** Low - pure functions, easy to test

### Phase 4: Extract Racer Entity (Day 3-4)

**Steps:**
1. Create `src/core/Racer.js` class
2. Refactor racer creation to use class
3. Ensure all racer properties are encapsulated
4. Add unit tests

**Risk:** Medium - touches core game logic

### Phase 5: Extract Rendering (Day 4-5)

**Steps:**
1. Create `src/rendering/` directory
2. Extract `Camera.js`
3. Extract `TrackRenderer.js`
4. Extract `RacerRenderer.js`
5. Create coordinating `Renderer.js`

**Risk:** Medium - visual regressions possible

### Phase 6: Extract Physics (Day 5-6)

**Steps:**
1. Create `src/engine/physics.js`
2. Move `updateRacerLogic()` logic
3. Move `resolveCollisions()` logic
4. Add unit tests for physics calculations

**Risk:** High - core gameplay affected

### Phase 7: Extract State Management (Day 6-7)

**Steps:**
1. Create `src/state/GameState.js`
2. Move global variables to state
3. Implement observer pattern
4. Connect UI updates to state changes

**Risk:** High - affects entire application

### Phase 8: Extract UI Components (Day 7-8)

**Steps:**
1. Create `src/ui/` directory
2. Extract `Scoreboard.js`
3. Extract `PlayerControls.js`
4. Remove inline event handlers from HTML

**Risk:** Medium - UI logic refactoring

### Phase 9: Final Integration (Day 8-9)

**Steps:**
1. Create `GameManager.js` orchestrator
2. Wire all modules together
3. Comprehensive integration testing
4. Performance profiling

**Risk:** Medium - integration issues possible

### Phase 10: Documentation and Cleanup (Day 9-10)

**Steps:**
1. Add JSDoc comments to all modules
2. Create API documentation
3. Update CLAUDE.md with new structure
4. Remove dead code

---

## 11. Long-Term Considerations

### 11.1 Scalability Concerns

| Concern | Current Impact | Future Risk | Mitigation |
|---------|----------------|-------------|------------|
| Track count | 3 tracks | Adding tracks requires code changes | Create track JSON format |
| Racer count | 11 racers | Performance with more racers | Implement spatial partitioning |
| Session count | 1-3 sessions | Multiple canvases expensive | Use single canvas with viewports |

### 11.2 Technical Debt to Address

1. **Remove Tailwind CDN**: Bundle styles or use CSS modules
2. **Remove Firebase stub**: Clean up unused initialization
3. **Implement proper error handling**: Add try/catch, error boundaries
4. **Add TypeScript**: Gradual migration for type safety

### 11.3 Feature Roadmap Compatibility

The proposed architecture supports these future features:

- **AI Opponents**: Add `AIController` in `src/ai/`
- **Multiplayer**: State synchronization via `GameState`
- **Track Editor**: Extend `TrackEditor` with save/load
- **Sound Effects**: Add `src/audio/` module
- **Mobile Controls**: Add touch handling in `InputManager`

### 11.4 Performance Optimizations

**Immediate:**
- Throttle DOM updates
- Use requestAnimationFrame correctly
- Implement delta time physics

**Future:**
- Object pooling for racers
- OffscreenCanvas for rendering
- Web Workers for physics

---

## Appendix A: Dependency Graph

```
main.js
  |
  +-- GameManager
  |     |-- RaceSession
  |     |     |-- PhysicsEngine
  |     |     |-- Renderer
  |     |     |     |-- TrackRenderer
  |     |     |     |-- RacerRenderer
  |     |     |     +-- Camera
  |     |     |-- TrackEditor
  |     |     +-- RaceState
  |     +-- GameState
  |
  +-- UI Components
  |     |-- Scoreboard
  |     |-- PlayerControls
  |     +-- TopBar
  |
  +-- Config
        |-- constants
        |-- gameConfig
        +-- tracks
```

## Appendix B: File Size Estimates

| Module | Estimated Lines | Priority |
|--------|-----------------|----------|
| `config/constants.js` | 15 | P1 |
| `config/gameConfig.js` | 20 | P1 |
| `config/tracks.js` | 100 | P1 |
| `math/geometry.js` | 30 | P1 |
| `math/bezier.js` | 50 | P1 |
| `core/Racer.js` | 80 | P2 |
| `core/RaceSession.js` | 120 | P2 |
| `core/GameManager.js` | 100 | P3 |
| `engine/physics.js` | 150 | P2 |
| `rendering/Renderer.js` | 50 | P2 |
| `rendering/TrackRenderer.js` | 80 | P2 |
| `rendering/RacerRenderer.js` | 60 | P2 |
| `rendering/Camera.js` | 30 | P2 |
| `state/GameState.js` | 60 | P3 |
| `ui/Scoreboard.js` | 70 | P3 |
| `ui/PlayerControls.js` | 80 | P3 |
| `input/TrackEditor.js` | 60 | P3 |
| **Total** | **~1155** | - |

---

## Conclusion

This architecture document provides a clear path from a single-file monolith to a professional, maintainable codebase. The key principles are:

1. **Incremental migration** - No big-bang rewrites
2. **Single Responsibility** - Each module does one thing well
3. **Dependency Injection** - Testable, loosely coupled code
4. **Observable State** - Predictable data flow
5. **Test-First** - Unit tests for critical logic

Following this plan will result in a codebase that is easier to understand, test, extend, and maintain while preserving all existing functionality.
