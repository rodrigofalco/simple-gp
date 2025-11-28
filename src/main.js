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

    <!-- Main Grid -->
    <div id="gameContainer" class="hidden flex-grow flex gap-4 overflow-hidden">

        <!-- Left Column -->
        <div class="flex-grow flex flex-col gap-4 overflow-y-auto" style="min-width: 0;">
            <div id="canvasGrid" class="grid grid-cols-1 gap-4"></div>

            <!-- Strategy Panel -->
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex-shrink-0">
                <div class="flex justify-between items-center border-b pb-2 mb-3">
                    <h3 class="font-bold text-gray-800">🎮 Estrategia de Equipo</h3>
                    <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Clic en piloto para cámara</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="playerControls"></div>
            </div>
        </div>

        <!-- Right Column -->
        <div class="w-72 flex-shrink-0 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden">
            <div class="p-3 border-b border-gray-100 bg-gray-50">
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
            <div class="p-3 border-t border-gray-100 bg-gray-50">
                <div id="raceStatus" class="w-full py-2 rounded text-center text-sm font-bold bg-gray-200 text-gray-600">
                    Cargando...
                </div>
            </div>
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
    title: 'GP Vector Manager',
    defaultTrack: 's-curve'
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
    if (mode === 'test-all') {
      if (canvasGrid) {
        canvasGrid.className = 'grid grid-cols-1 lg:grid-cols-3 gap-6';
      }
      this.sessions.push(new RaceSession('canvasGrid', 'stadium', 'Stadium'));
      this.sessions.push(new RaceSession('canvasGrid', 'l-shape', 'L-Circuit'));
      this.sessions.push(new RaceSession('canvasGrid', 's-curve', 'S-Curve'));
    } else {
      if (canvasGrid) {
        canvasGrid.className = 'grid grid-cols-1 gap-6';
      }
      this.sessions.push(new RaceSession('canvasGrid', mode, 'Main Race'));
    }

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

  console.log('GP Vector Manager initialized successfully!');
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', initGame);
