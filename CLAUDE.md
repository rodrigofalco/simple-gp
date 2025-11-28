# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A top-down 2D racing manager game built as a single HTML file with vanilla JavaScript and HTML5 Canvas. Players manage team strategy (tire aggression, engine mapping, risk) while AI racers compete on various tracks.

## Development

**Run the game:** Open `index.html` directly in a browser (no build step required)

**No dependencies to install** - uses CDN-loaded Tailwind CSS and Firebase (Firebase is stubbed, not functional)

## Architecture

### Single-File Structure
Everything lives in `index.html`:
- HTML layout with Tailwind CSS styling
- Game logic in a single `<script>` block
- No external JS files or modules

### Core Systems

**Track System (Dual-path design):**
- `getVisualTrackPoints(type)` - Returns display geometry using `addLine()`/`addArc()` helpers
- `getBezierNodes(type)` - Returns editable control points for racing line
- `generateRacingLineFromNodes()` - Converts Bezier nodes to physics path
- Tracks: `'stadium'`, `'l-shape'`, `'s-curve'`

**RaceSession Class** - Manages a single race instance:
- `init()` - Sets up track, creates racers with randomized grid positions
- `update()` - Physics tick: racer movement, fuel/tire wear, collisions
- `draw()` - Renders track, finish line, debug overlays, racers
- Supports Bezier node dragging in debug mode

**Racer State:**
```javascript
{
  pathIndex,    // Current position on racing line
  lap,          // Completed laps
  progress,     // lap + (pathIndex/pathLength) for sorting
  fuel, tires,  // Degrade based on params
  params: { tireAggression, engineMap, risk }
}
```

### Key Constants
- `VELOCITY = 1.8` - Base racer speed
- `RACER_RADIUS = 7` - Collision size
- `START_DELAY_FRAMES = 60` - Pre-race countdown
- `PLAYER_INDICES = [0, 1]` - Which racers are player-controlled

### Global Functions
- `changeMode(trackType)` - Switch tracks, restart sessions
- `updateParam(racerId, param, value)` - Modify strategy parameters
- `selectPilot(id)` - Change camera focus
- `togglePause()` / `restartAll()` - Race controls