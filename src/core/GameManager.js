/**
 * GameManager - Main orchestrator for the GP Vector Manager game
 *
 * Responsibilities:
 * - Manages race sessions (single track or multi-track test mode)
 * - Coordinates the game loop with fixed timestep physics
 * - Handles mode changes and restarts
 * - Integrates state management with UI updates
 * - Provides clean lifecycle management (initialization and cleanup)
 *
 * @class GameManager
 * @module core/GameManager
 */

import { GameState } from '../state/GameState.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

export class GameManager {
  /**
   * Create a new GameManager instance
   *
   * @param {string} appContainerId - ID of the main app container element
   */
  constructor(appContainerId) {
    // Core references
    this.appContainerId = appContainerId;
    this.appContainer = document.getElementById(appContainerId);

    if (!this.appContainer) {
      throw new Error(`Container element with ID '${appContainerId}' not found`);
    }

    // State management
    this.state = new GameState();

    // Session management
    this.sessions = [];

    // Game loop management
    this.animationFrameId = null;
    this.lastTimestamp = 0;
    this.accumulator = 0;
    this.fixedTimestep = 1000 / GAME_CONFIG.fps; // 16.67ms for 60 FPS

    // UI update throttling
    this.uiUpdateCounter = 0;
    this.uiUpdateInterval = 5; // Update UI every 5 frames
    this.uiControlsUpdateInterval = 30; // Update controls every 30 frames

    // UI component references (will be set when UI components are created)
    this.scoreboard = null;
    this.playerControls = null;

    // Bind game loop to preserve context
    this._boundGameLoop = this.gameLoop.bind(this);
  }

  /**
   * Change game mode (single track or test-all mode)
   * Creates new race sessions and restarts the game loop
   *
   * @param {string} mode - Track mode ('s-curve', 'stadium', 'l-shape', or 'test-all')
   */
  changeMode(mode) {
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
    this._updatePauseButton();

    // Create sessions based on mode
    if (mode === 'test-all') {
      // Multi-track test mode
      if (canvasGrid) {
        canvasGrid.className = 'grid grid-cols-1 lg:grid-cols-3 gap-6';
      }

      // Note: RaceSession will be imported when it's created
      // For now, this is a placeholder that shows the structure
      // Uncomment when RaceSession is available:
      /*
      const RaceSession = await import('./RaceSession.js');
      this.sessions.push(new RaceSession('canvasGrid', 'stadium', 'Stadium'));
      this.sessions.push(new RaceSession('canvasGrid', 'l-shape', 'L-Circuit'));
      this.sessions.push(new RaceSession('canvasGrid', 's-curve', 'S-Curve'));
      */
    } else {
      // Single track mode
      if (canvasGrid) {
        canvasGrid.className = 'grid grid-cols-1 gap-6';
      }

      // Note: RaceSession will be imported when it's created
      // Uncomment when RaceSession is available:
      /*
      const RaceSession = await import('./RaceSession.js');
      this.sessions.push(new RaceSession('canvasGrid', mode, 'Main Race'));
      */
    }

    // Initialize all sessions
    this.sessions.forEach(session => {
      if (session.init) {
        session.init();
      }
    });

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
  }

  /**
   * Restart the current mode
   * Re-initializes sessions without changing tracks
   */
  restart() {
    const currentMode = this.state.get('currentTrack');
    this.changeMode(currentMode);
  }

  /**
   * Toggle pause state
   * Updates state and UI accordingly
   *
   * @returns {boolean} New pause state
   */
  togglePause() {
    const newPauseState = this.state.togglePause();
    this._updatePauseButton();
    return newPauseState;
  }

  /**
   * Select a pilot (racer) to follow with camera
   *
   * @param {number} id - Racer ID to select
   */
  selectPilot(id) {
    this.state.setSelectedRacer(id);
    this.updateUI();
  }

  /**
   * Update racing strategy parameter for a specific racer
   *
   * @param {number} racerId - ID of the racer
   * @param {string} param - Parameter name ('tireAggression', 'engineMap', 'risk')
   * @param {number} value - New parameter value
   */
  updateParam(racerId, param, value) {
    // Update global state
    this.state.updateParam(racerId, param, parseInt(value));

    // Apply to all sessions
    this.sessions.forEach(session => {
      if (session.racers) {
        const racer = session.racers.find(r => r.id === racerId);
        if (racer && racer.params) {
          racer.params[param] = parseInt(value);
        }
      }
    });

    // Update UI
    this.updateUI();
  }

  /**
   * Main game loop with fixed timestep physics
   * Uses accumulator pattern for consistent physics regardless of frame rate
   *
   * @param {number} timestamp - Current timestamp from requestAnimationFrame
   */
  gameLoop(timestamp) {
    // Initialize timestamp on first frame
    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
    }

    // Calculate delta time
    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Handle pause state
    if (this.state.get('isPaused')) {
      // Still render when paused (for track editing), but don't update physics
      this.sessions.forEach(session => {
        if (session.draw) {
          session.draw();
        }
      });

      // Continue loop
      this.animationFrameId = requestAnimationFrame(this._boundGameLoop);
      return;
    }

    // Accumulator pattern for fixed timestep physics
    this.accumulator += deltaTime;

    // Prevent spiral of death (if update takes too long)
    if (this.accumulator > this.fixedTimestep * 5) {
      this.accumulator = this.fixedTimestep * 5;
    }

    // Fixed timestep physics updates
    while (this.accumulator >= this.fixedTimestep) {
      // Update all sessions
      this.sessions.forEach(session => {
        if (session.update) {
          session.update();
        }
      });

      this.accumulator -= this.fixedTimestep;
    }

    // Render all sessions
    this.sessions.forEach(session => {
      if (session.draw) {
        session.draw();
      }
    });

    // Throttled UI updates
    this.uiUpdateCounter++;

    // Update scoreboard every 5 frames
    if (this.uiUpdateCounter % this.uiUpdateInterval === 0) {
      this._updateScoreboard();
    }

    // Update player controls every 30 frames
    if (this.uiUpdateCounter % this.uiControlsUpdateInterval === 0) {
      this._updatePlayerControls();
    }

    // Continue game loop
    this.animationFrameId = requestAnimationFrame(this._boundGameLoop);
  }

  /**
   * Update all UI components
   * Called when significant state changes occur
   */
  updateUI() {
    this._updateScoreboard();
    this._updatePlayerControls();
  }

  /**
   * Update scoreboard UI
   * Displays current race positions and lap information
   *
   * @private
   */
  _updateScoreboard() {
    if (this.sessions.length === 0) return;
    if (!this.scoreboard) return;

    // Use first session for scoreboard (main race)
    const session = this.sessions[0];
    if (!session.racers) return;

    // Sort racers by position
    const sorted = [...session.racers].sort((a, b) => {
      if (a.finished && b.finished) {
        return a.finishTime - b.finishTime;
      }
      if (a.finished !== b.finished) {
        return a.finished ? -1 : 1;
      }
      return b.progress - a.progress;
    });

    // Update scoreboard component
    if (this.scoreboard.update) {
      this.scoreboard.update(
        sorted,
        session.totalLaps,
        this.state.get('selectedRacerId')
      );
    }

    // Update lap counter
    const lapCountEl = document.getElementById('lapCount');
    if (lapCountEl && sorted.length > 0) {
      lapCountEl.textContent = sorted[0].lap;
    }

    const totalLapsEl = document.getElementById('totalLapsDisplay');
    if (totalLapsEl) {
      totalLapsEl.textContent = session.totalLaps;
    }
  }

  /**
   * Update player controls UI
   * Shows strategy parameters for player-controlled racers
   *
   * @private
   */
  _updatePlayerControls() {
    if (this.sessions.length === 0) return;
    if (!this.playerControls) return;

    const session = this.sessions[0];
    if (!session.racers) return;

    // Update player controls component
    if (this.playerControls.update) {
      this.playerControls.update(
        session.racers,
        this.state.get('globalParams'),
        this.state.get('selectedRacerId')
      );
    }
  }

  /**
   * Update pause button UI
   * Changes button text and style based on pause state
   *
   * @private
   */
  _updatePauseButton() {
    const pauseBtn = document.getElementById('pauseBtn');
    if (!pauseBtn) return;

    const isPaused = this.state.get('isPaused');

    if (isPaused) {
      pauseBtn.textContent = '▶️ Seguir';
      pauseBtn.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-4 rounded shadow-sm text-sm w-24 text-center';
    } else {
      pauseBtn.textContent = '⏸️ Pausa';
      pauseBtn.className = 'bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1.5 px-4 rounded shadow-sm text-sm w-24 text-center';
    }
  }

  /**
   * Set UI component references
   * Called during initialization to connect UI components
   *
   * @param {Object} components - Object containing UI component instances
   * @param {Object} components.scoreboard - Scoreboard component
   * @param {Object} components.playerControls - Player controls component
   */
  setUIComponents(components) {
    this.scoreboard = components.scoreboard || null;
    this.playerControls = components.playerControls || null;
  }

  /**
   * Clean up resources and stop game loop
   * Should be called before destroying the GameManager instance
   */
  destroy() {
    // Stop game loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Destroy all sessions
    this.sessions.forEach(session => {
      if (session.destroy) {
        session.destroy();
      }
    });
    this.sessions = [];

    // Clear state listeners
    if (this.state && this.state.clearListeners) {
      this.state.clearListeners();
    }

    // Clear UI components
    this.scoreboard = null;
    this.playerControls = null;
  }

  /**
   * Get current game statistics
   * Useful for debugging and monitoring
   *
   * @returns {Object} Game statistics
   */
  getStats() {
    return {
      sessionCount: this.sessions.length,
      currentTrack: this.state.get('currentTrack'),
      isPaused: this.state.get('isPaused'),
      raceStatus: this.state.get('raceStatus'),
      fps: Math.round(1000 / this.fixedTimestep),
      accumulator: this.accumulator,
      listenerCount: this.state.getListenerCount()
    };
  }
}
