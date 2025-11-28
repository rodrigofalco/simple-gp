import { BIKE_ARCHETYPES, BIKE_ARCHETYPE_KEYS } from '../config/constants.js';

/**
 * Racer entity class
 * Encapsulates all racer properties and behavior for the GP Vector Manager game
 *
 * @class Racer
 * @module core/Racer
 */
export class Racer {
  /**
   * Create a new Racer instance
   *
   * @param {Object} config - Racer configuration
   * @param {number} config.id - Unique identifier for the racer
   * @param {string} config.name - Display name of the racer
   * @param {string} config.color - Hex color code for the racer's livery
   * @param {number} config.racingNumber - Race number displayed on the racer
   * @param {Object} config.position - Starting position {x, y}
   * @param {number} config.angle - Initial heading angle in radians
   * @param {boolean} config.isPlayer - Whether this racer is controlled by the player
   * @param {Object} [config.params] - Racing parameters (tireAggression, engineMap, risk)
   * @param {string} [config.bikeType] - Bike archetype (speeder, accelerator, turner)
   */
  constructor(config) {
    const {
      id,
      name,
      color,
      racingNumber,
      position,
      angle,
      isPlayer,
      params,
      bikeType
    } = config;

    // Identity
    this.id = id;
    this.name = name;
    this.color = color;
    this.racingNumber = racingNumber;

    // Position and orientation
    this.x = position.x;
    this.y = position.y;
    this.angle = angle;

    // Resources
    this.fuel = 100;
    this.tires = 100;

    // Motion state
    this.currentSpeed = 0;
    this.pathIndex = 0;
    this.lap = 0;
    this.progress = 0;

    // Race state
    this.finished = false;
    this.finishTime = 0;
    this.state = 'waiting'; // 'waiting' | 'racing' | 'finished'

    // Racing parameters (player-controlled or AI defaults)
    this.params = params || {
      tireAggression: 40 + Math.random() * 40,
      engineMap: 40 + Math.random() * 40,
      risk: 30 + Math.random() * 40
    };

    // Launch behavior (randomized per racer)
    this.launchDelay = Math.floor(Math.random() * 15);
    this.launchAccel = 0.05 + Math.random() * 0.02;

    // Path following behavior
    this.laneOffset = (Math.random() * 40) - 20;
    this.wobblePhase = Math.random() * Math.PI * 2;

    // Player flag
    this.isPlayer = isPlayer;

    // Bike archetype - random if not specified
    this.bikeType = bikeType || BIKE_ARCHETYPE_KEYS[Math.floor(Math.random() * BIKE_ARCHETYPE_KEYS.length)];
    this.bikeArchetype = BIKE_ARCHETYPES[this.bikeType];
  }

  /**
   * Get the bike archetype configuration
   * @returns {Object} Archetype with multipliers and info
   */
  getBikeArchetype() {
    return this.bikeArchetype;
  }

  /**
   * Update racer's racing parameters
   *
   * @param {Object} params - New parameters to apply
   * @param {number} [params.tireAggression] - Tire wear rate (0-100)
   * @param {number} [params.engineMap] - Engine power output (0-100)
   * @param {number} [params.risk] - Overtaking aggression (0-100)
   */
  setParams(params) {
    this.params = { ...this.params, ...params };
  }

  /**
   * Reset racer to initial state (for race restart)
   *
   * @param {Object} position - Starting position {x, y}
   * @param {number} angle - Initial heading angle
   */
  reset(position, angle) {
    this.x = position.x;
    this.y = position.y;
    this.angle = angle;
    this.fuel = 100;
    this.tires = 100;
    this.currentSpeed = 0;
    this.pathIndex = 0;
    this.lap = 0;
    this.progress = 0;
    this.finished = false;
    this.finishTime = 0;
    this.state = 'waiting';
    this.launchDelay = Math.floor(Math.random() * 15);
  }

  /**
   * Mark racer as finished
   *
   * @param {number} timestamp - Performance.now() timestamp of finish
   * @param {number} totalLaps - Total laps in the race
   */
  finish(timestamp, totalLaps) {
    this.finished = true;
    this.finishTime = timestamp;
    this.progress = totalLaps + 1000;
    this.state = 'finished';
  }

  /**
   * Get current position as a vector
   *
   * @returns {Object} Position vector {x, y}
   */
  getPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Get current velocity as a vector
   *
   * @returns {Object} Velocity vector {x, y}
   */
  getVelocity() {
    return {
      x: Math.cos(this.angle) * this.currentSpeed,
      y: Math.sin(this.angle) * this.currentSpeed
    };
  }

  /**
   * Check if racer is out of fuel
   *
   * @returns {boolean} True if fuel is depleted
   */
  isOutOfFuel() {
    return this.fuel <= 0;
  }

  /**
   * Check if racer has critical tire wear
   *
   * @returns {boolean} True if tires are below 20%
   */
  hasCriticalTireWear() {
    return this.tires < 20;
  }

  /**
   * Get racer's current state summary
   *
   * @returns {Object} State object with key racer metrics
   */
  getState() {
    return {
      id: this.id,
      name: this.name,
      position: this.getPosition(),
      lap: this.lap,
      progress: this.progress,
      finished: this.finished,
      fuel: this.fuel,
      tires: this.tires,
      speed: this.currentSpeed
    };
  }
}
