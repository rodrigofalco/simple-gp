# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A top-down 2D racing manager game with vanilla JavaScript and HTML5 Canvas. Players manage team strategy (tire aggression, engine mapping, risk) while AI racers compete on various tracks.

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests with Vitest
npm run lint         # ESLint check
```

**Legacy mode:** Open `index.old.html` directly in browser (original single-file version)

## Architecture

### Module Structure

```
src/
├── main.js                 # Entry point, initializes game
├── config/
│   ├── constants.js        # RACER_NAMES, COLORS, NUMBERS, PLAYER_INDICES
│   ├── gameConfig.js       # GAME_CONFIG object (velocity, radius, etc.)
│   └── tracks.js           # getVisualTrackPoints(), getBezierNodes()
├── core/
│   ├── GameManager.js      # Main orchestrator, game loop, state coordination
│   ├── RaceSession.js      # Single race instance, delegates to subsystems
│   └── Racer.js            # Racer entity class
├── engine/
│   └── physics.js          # PhysicsEngine: movement, collisions
├── rendering/
│   ├── Renderer.js         # Main renderer coordinator
│   ├── Camera.js           # Smooth camera following
│   ├── TrackRenderer.js    # Track/finish line/debug splines
│   └── RacerRenderer.js    # Motorcycle sprite rendering
├── input/
│   └── TrackEditor.js      # Debug mode bezier node editing
├── state/
│   └── GameState.js        # Observable state with subscribe/notify
├── ui/
│   ├── TopBar.js           # Track select, pause, restart, debug toggle
│   ├── Scoreboard.js       # Race positions list
│   └── PlayerControls.js   # Strategy panel for players
├── math/
│   ├── geometry.js         # addLine(), addArc() for visual paths
│   └── bezier.js           # getBezierPoint(), generateRacingLineFromNodes()
└── utils/
    └── shuffle.js          # Fisher-Yates array shuffle
```

### Core Systems

**GameManager** - Main orchestrator:
- `changeMode(track)` - Switch tracks, create RaceSessions
- `gameLoop(timestamp)` - Fixed timestep physics (60 FPS)
- `togglePause()`, `selectPilot(id)`, `updateParam()`

**RaceSession** - Race instance:
- Owns: PhysicsEngine, Renderer, TrackEditor, Racer[]
- `init()` - Setup track, create racers on grid
- `update()` - Delegate to physics engine
- `draw()` - Delegate to renderer

**PhysicsEngine** - Movement & collisions:
- `updateRacer(racer, path, frame, totalLaps)` - Path following, fuel/tire drain
- `resolveCollisions(racers)` - Collision detection and separation

**GameState** - Observable store:
- `get(key)`, `set(key, value)`, `subscribe(listener)`
- State: isPaused, selectedRacerId, globalParams, currentTrack

### Track System (Dual-path design)

1. **Visual Path** - `getVisualTrackPoints(type)` returns display geometry
2. **Racing Line** - `getBezierNodes(type)` returns editable control points
3. **Physics Path** - `generateRacingLineFromNodes(nodes)` creates smooth path

Tracks: `'stadium'`, `'l-shape'`, `'s-curve'`, `'test-all'` (shows all 3)

### Key Configuration (src/config/gameConfig.js)

```javascript
GAME_CONFIG = {
  velocity: 1.8,           // Base racer speed
  racerRadius: 7,          // Collision size
  startDelayFrames: 60,    // Pre-race countdown
  targetRacePixels: 9000,  // Race length for lap calculation
  fps: 60                  // Fixed timestep target
}
```

### Racer State

```javascript
{
  pathIndex,              // Current position on racing line
  lap, progress,          // Lap count, progress for sorting
  fuel, tires,            // Degrade based on params
  params: { tireAggression, engineMap, risk }
}
```

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Detailed architecture and migration guide
- [docs/UI_REVIEW.md](docs/UI_REVIEW.md) - UI/UX analysis and recommendations
