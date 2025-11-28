/**
 * Global game state with observable pattern
 * Provides centralized state management for the GP Vector Manager game
 *
 * @class GameState
 * @module state/GameState
 */
export class GameState {
  /**
   * Create a new GameState instance
   *
   * @param {Object} [initialState] - Initial state values
   */
  constructor(initialState = {}) {
    // Private state object
    this._state = {
      isPaused: false,
      selectedRacerId: 0,
      globalParams: {
        0: { tireAggression: 60, engineMap: 60, risk: 60 },
        1: { tireAggression: 60, engineMap: 60, risk: 60 }
      },
      debugMode: false,
      currentTrack: 's-curve',
      raceStatus: 'loading', // 'loading' | 'ready' | 'racing' | 'finished'
      ...initialState
    };

    // Subscriber registry
    this._listeners = new Set();
  }

  /**
   * Get a state value by key
   *
   * @param {string} key - State key to retrieve
   * @returns {*} The state value
   */
  get(key) {
    return this._state[key];
  }

  /**
   * Set a state value and notify subscribers
   *
   * @param {string} key - State key to update
   * @param {*} value - New value
   */
  set(key, value) {
    const oldValue = this._state[key];
    this._state[key] = value;

    // Only notify if value actually changed
    if (oldValue !== value) {
      this._notify({ key, value, oldValue });
    }
  }

  /**
   * Get the entire state object (read-only copy)
   *
   * @returns {Object} Shallow copy of state
   */
  getAll() {
    return { ...this._state };
  }

  /**
   * Batch update multiple state values
   *
   * @param {Object} updates - Object with key-value pairs to update
   */
  batchUpdate(updates) {
    const changes = [];

    Object.entries(updates).forEach(([key, value]) => {
      const oldValue = this._state[key];
      if (oldValue !== value) {
        this._state[key] = value;
        changes.push({ key, value, oldValue });
      }
    });

    // Single notification for all changes
    if (changes.length > 0) {
      this._notify({ type: 'batch', changes });
    }
  }

  /**
   * Subscribe to state changes
   *
   * @param {Function} listener - Callback function (receives change event)
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this._listeners.delete(listener);
    };
  }

  /**
   * Notify all subscribers of state change
   *
   * @private
   * @param {Object} changeEvent - Change event details
   */
  _notify(changeEvent) {
    this._listeners.forEach(listener => {
      try {
        listener(changeEvent, this._state);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  // Convenience methods for common state operations

  /**
   * Toggle pause state
   *
   * @returns {boolean} New pause state
   */
  togglePause() {
    const newValue = !this._state.isPaused;
    this.set('isPaused', newValue);
    return newValue;
  }

  /**
   * Set selected racer by ID
   *
   * @param {number} racerId - ID of racer to select
   */
  setSelectedRacer(racerId) {
    this.set('selectedRacerId', racerId);
  }

  /**
   * Update racing parameters for a specific racer
   *
   * @param {number} racerId - ID of racer
   * @param {string} param - Parameter name ('tireAggression', 'engineMap', 'risk')
   * @param {number} value - New parameter value
   */
  updateParam(racerId, param, value) {
    const globalParams = { ...this._state.globalParams };

    if (!globalParams[racerId]) {
      globalParams[racerId] = {};
    }

    globalParams[racerId] = {
      ...globalParams[racerId],
      [param]: value
    };

    this.set('globalParams', globalParams);
  }

  /**
   * Get racing parameters for a specific racer
   *
   * @param {number} racerId - ID of racer
   * @returns {Object} Parameters object or default values
   */
  getParams(racerId) {
    return this._state.globalParams[racerId] || {
      tireAggression: 60,
      engineMap: 60,
      risk: 60
    };
  }

  /**
   * Toggle debug mode
   *
   * @returns {boolean} New debug mode state
   */
  toggleDebugMode() {
    const newValue = !this._state.debugMode;
    this.set('debugMode', newValue);
    return newValue;
  }

  /**
   * Set debug mode
   *
   * @param {boolean} enabled - Debug mode state
   */
  setDebugMode(enabled) {
    this.set('debugMode', enabled);
  }

  /**
   * Set current track type
   *
   * @param {string} trackType - Track identifier ('s-curve', 'stadium', 'l-shape', 'test-all')
   */
  setCurrentTrack(trackType) {
    this.set('currentTrack', trackType);
  }

  /**
   * Set race status
   *
   * @param {string} status - Race status ('loading', 'ready', 'racing', 'finished')
   */
  setRaceStatus(status) {
    this.set('raceStatus', status);
  }

  /**
   * Reset state to initial values
   */
  reset() {
    this._state = {
      isPaused: false,
      selectedRacerId: 0,
      globalParams: {
        0: { tireAggression: 60, engineMap: 60, risk: 60 },
        1: { tireAggression: 60, engineMap: 60, risk: 60 }
      },
      debugMode: this._state.debugMode, // Preserve debug mode
      currentTrack: this._state.currentTrack, // Preserve track selection
      raceStatus: 'ready'
    };

    this._notify({ type: 'reset', state: this._state });
  }

  /**
   * Get number of active listeners
   *
   * @returns {number} Listener count
   */
  getListenerCount() {
    return this._listeners.size;
  }

  /**
   * Clear all listeners (useful for cleanup)
   */
  clearListeners() {
    this._listeners.clear();
  }
}
