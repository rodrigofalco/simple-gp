/**
 * GP Vector Manager - Main Entry Point
 *
 * This is the entry point for the Vite build pipeline.
 * It initializes all game components and starts the game loop.
 */

import { GameManager } from './core/GameManager.js';
import { RaceSession } from './core/RaceSession.js';
import { TopBar } from './ui/TopBar.js';
import { Scoreboard } from './ui/Scoreboard.js';
import { PlayerControls } from './ui/PlayerControls.js';
import { PLAYER_INDICES } from './config/constants.js';

// Global state for selected racer (used by RaceSession for camera following)
window.globalSelectedRacerId = 0;

/**
 * Creates the main game layout HTML structure
 */
function createGameLayout() {
  return `
    <!-- Top Bar -->
    <div id="topBarContainer"></div>

    <div id="loadingMessage" class="text-center text-lg text-blue-600">Preparando Pista...</div>

    <!-- Main Game Container (relative positioning for overlays) -->
    <div id="gameContainer" class="hidden relative" style="width: 100%; height: calc(100vh - 64px);">

        <!-- Full-Screen Track Canvas (background) -->
        <div id="canvasGrid" class="absolute inset-0 grid grid-cols-1" style="z-index: 0;"></div>

        <!-- Floating Position List Panel (top-right) -->
        <div class="absolute top-4 right-4 w-72 flex flex-col bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden" style="z-index: 10; max-height: calc(100vh - 128px);">
            <div class="p-3 border-b border-gray-100 bg-gray-50/90">
                <h2 class="font-bold text-gray-700 flex justify-between items-center">
                    Posiciones
                    <span class="text-xs font-normal bg-white px-2 py-0.5 rounded border text-gray-500">
                        Vueltas: <span id="lapCount" class="font-bold text-gray-800">0</span>/<span id="totalLapsDisplay">0</span>
                    </span>
                </h2>
            </div>
            <div class="flex-grow overflow-y-auto p-2">
                <ul id="scoreboard" class="space-y-1"></ul>
            </div>
            <div class="p-3 border-t border-gray-100 bg-gray-50/90">
                <div id="raceStatus" class="w-full py-2 rounded text-center text-sm font-bold bg-gray-200 text-gray-600">
                    Cargando...
                </div>
            </div>
        </div>

        <!-- Floating Strategy Panel (bottom-left) -->
        <div class="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200" style="z-index: 10; max-width: 500px; max-height: 40vh; overflow-y: auto;">
            <div class="flex justify-between items-center border-b pb-2 mb-3">
                <h3 class="font-bold text-gray-800">🎮 Estrategia de Equipo</h3>
                <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Clic en piloto para cámara</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="playerControls"></div>
        </div>
    </div>
  `;
}

/**
 * Initialize the game
 */
async function initGame() {
  const app = document.getElementById('app');
  if (!app) {
    console.error('App container not found');
    return;
  }

  // Create layout
  app.innerHTML = createGameLayout();

  // Initialize UI components
  const topBar = new TopBar('topBarContainer');
  topBar.render({
    title: 'GP Vector Manager - General Roca Circuit',
    defaultTrack: 'general-roca'
  });

  const scoreboard = new Scoreboard('scoreboard');
  const playerControls = new PlayerControls('playerControls');

  // Create game manager (we'll inject RaceSession support)
  const gameManager = new GameManager('app');

  // Set UI components
  gameManager.setUIComponents({
    scoreboard,
    playerControls
  });

  // Override changeMode to actually create RaceSessions
  const originalChangeMode = gameManager.changeMode.bind(gameManager);
  gameManager.changeMode = function(mode) {
    // Stop existing game loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clear existing sessions
    this.sessions.forEach(session => {
      if (session.destroy) {
        session.destroy();
      }
    });
    this.sessions = [];

    // Clear canvas container
    const canvasGrid = document.getElementById('canvasGrid');
    if (canvasGrid) {
      canvasGrid.innerHTML = '';
    }

    // Update state
    this.state.set('isPaused', false);
    this.state.setCurrentTrack(mode);
    this.state.setRaceStatus('loading');

    // Update pause button UI
    topBar.updatePauseButton(false);

    // Create sessions based on mode
    if (canvasGrid) {
      canvasGrid.className = 'grid grid-cols-1 gap-6';
    }
    // Only create General Roca track
    this.sessions.push(new RaceSession('canvasGrid', 'general-roca', 'General Roca Circuit'));

    // Initialize all sessions (async)
    Promise.all(this.sessions.map(session => session.init())).then(() => {
      // Update UI
      this.updateUI();

      // Update state
      this.state.setRaceStatus('ready');

      // Reset game loop timing
      this.lastTimestamp = 0;
      this.accumulator = 0;
      this.uiUpdateCounter = 0;

      // Start game loop
      this.animationFrameId = requestAnimationFrame(this._boundGameLoop);
    });
  };

  // Bind top bar event handlers
  topBar.bindEventHandlers({
    onTrackChange: (track) => {
      gameManager.changeMode(track);
    },
    onPauseToggle: () => {
      const isPaused = gameManager.togglePause();
      topBar.updatePauseButton(isPaused);
    },
    onRestart: () => {
      gameManager.restart();
    },
    onDebugToggle: (enabled) => {
      gameManager.sessions.forEach(session => {
        if (enabled) {
          session.enableTrackEditor();
        } else {
          session.disableTrackEditor();
        }
      });
    }
  });

  // Override scoreboard update to handle pilot selection
  const originalScoreboardUpdate = scoreboard.update.bind(scoreboard);
  scoreboard.update = function(racers, totalLaps, selectedRacerId) {
    originalScoreboardUpdate(racers, totalLaps, selectedRacerId, (id) => {
      window.globalSelectedRacerId = id;
      gameManager.selectPilot(id);
    });
  };

  // Override player controls update
  const originalPlayerControlsUpdate = playerControls.update.bind(playerControls);
  playerControls.update = function(racers, globalParams, selectedRacerId) {
    originalPlayerControlsUpdate(racers, PLAYER_INDICES, globalParams, selectedRacerId, {
      onSelectPilot: (id) => {
        window.globalSelectedRacerId = id;
        gameManager.selectPilot(id);
      },
      onUpdateParam: (racerId, param, value) => {
        gameManager.updateParam(racerId, param, value);
      }
    });
  };

  // Hide loading, show game
  document.getElementById('loadingMessage').classList.add('hidden');
  document.getElementById('gameContainer').classList.remove('hidden');

  // Start with default track
  gameManager.changeMode('s-curve');

  // Expose gameManager for debugging
  window.gameManager = gameManager;

  // Expose track editor helper for easy access
  window.enableTrackEditor = () => {
    if (gameManager.sessions && gameManager.sessions.length > 0) {
      gameManager.sessions[0].enableTrackEditor();
      console.log('Track editor ENABLED');
      console.log('Press C to toggle node creation mode, D to dump nodes');
    }
  };
  window.disableTrackEditor = () => {
    if (gameManager.sessions && gameManager.sessions.length > 0) {
      gameManager.sessions[0].disableTrackEditor();
      console.log('Track editor DISABLED');
    }
  };

  // Add keyboard controls for zoom
  document.addEventListener('keydown', (e) => {
    if (!gameManager.sessions || gameManager.sessions.length === 0) return;

    const session = gameManager.sessions[0];
    const camera = session.camera;

    switch(e.key) {
      case 'z':
      case 'Z':
        // Zoom out
        camera.adjustZoom(-0.1);
        e.preventDefault();
        break;
      case 'x':
      case 'X':
        // Zoom in
        camera.adjustZoom(0.1);
        e.preventDefault();
        break;
      case 'f':
      case 'F':
        // Reset camera to center of track
        camera.reset();
        camera.x = 1376;
        camera.y = 768;
        e.preventDefault();
        break;
      case '1':
        // Reset zoom to normal
        camera.setZoom(1.0);
        e.preventDefault();
        break;
    }
  });

  // Add click-to-log coordinates for track debugging
  window.trackPoints = [];
  const canvasGrid = document.getElementById('canvasGrid');
  if (canvasGrid) {
    canvasGrid.addEventListener('click', (e) => {
      if (!gameManager.sessions || gameManager.sessions.length === 0) return;

      const session = gameManager.sessions[0];
      const canvas = session.canvas;
      const camera = session.camera;
      const rect = canvas.getBoundingClientRect();

      // Calculate canvas-relative coordinates
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      // Transform to world coordinates (inverse of the rendering transform)
      // Reverse: translate(center), scale(zoom), translate(-center-camera)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Undo the center translation
      let worldX = canvasX - centerX;
      let worldY = canvasY - centerY;

      // Undo the zoom scale
      worldX = worldX / camera.zoom;
      worldY = worldY / camera.zoom;

      // Undo the camera translation
      worldX = worldX + centerX + camera.x;
      worldY = worldY + centerY + camera.y;

      // Add to collected points
      window.trackPoints.push({ x: Math.round(worldX), y: Math.round(worldY) });

      console.log(`Point ${window.trackPoints.length}: {x: ${Math.round(worldX)}, y: ${Math.round(worldY)}}`);
      console.log('All points so far:');
      console.log(JSON.stringify(window.trackPoints, null, 2));
    }, true);
  }

  console.log('GP Vector Manager initialized successfully!');
  console.log('Zoom Controls: Z=Zoom Out, X=Zoom In, F=Fit Track, 1=Reset Zoom');
  console.log('Track Point Logger: Click on the track to capture coordinates (logged to console and window.trackPoints array)');
  console.log('');
  console.log('=== TRACK EDITOR GUIDE ===');
  console.log('Commands available in console:');
  console.log('  enableTrackEditor()   - Enable the editor');
  console.log('  disableTrackEditor()  - Disable the editor');
  console.log('');
  console.log('Keyboard shortcuts (when editor is enabled):');
  console.log('  C - Toggle node creation mode (click to add points)');
  console.log('  D - Dump nodes to console as JSON');
  console.log('  Delete/Backspace - Remove last node');
  console.log('  R - Reset all nodes');
  console.log('');
  console.log('To start editing: enableTrackEditor()');
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', initGame);
