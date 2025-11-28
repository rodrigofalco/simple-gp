/**
 * Game Configuration
 * Central configuration for physics, game rules, and rendering parameters
 */

// Path generation constant (exported separately for tracks.js)
export const STEP_SIZE = 2;

export const GAME_CONFIG = {
  // Physics parameters
  targetRacePixels: 9000,
  racerRadius: 7,
  velocity: 1.8,
  startDelayFrames: 60,

  // Path generation
  stepSize: STEP_SIZE,

  // Rendering
  fps: 60,

  // Fuel and tire drain
  fuelDrainBase: 0.008,
  fuelDrainEngineMultiplier: 0.005,
  tireDrainBase: 0.006,
  tireDrainTireMultiplier: 0.006,

  // Speed modifiers
  speedBaseMultiplier: 0.82,
  speedEngineBonus: 0.3,
  speedNoFuelPenalty: 0.4,
  speedLowTireThreshold: 20,
  speedLowTireBase: 0.6,
  speedLowTireMultiplier: 0.4,
  speedRandomVariation: 0.04,

  // Acceleration
  launchAcceleration: 0.02,
  normalAcceleration: 0.02,
  deceleration: 0.002,

  // Finished racer speed
  finishedSpeedMultiplier: 0.5,

  // Steering
  lookAheadDistance: 35,
  maxSteerAngle: 0.12,
  steeringRandomNoise: 0.02,
  emergencyTurnThreshold: Math.PI / 1.9,
  sharpTurnDamping: 0.1,

  // Lane behavior
  wobbleAmplitude: 5,
  wobbleFrequency: 0.05,

  // Collision detection
  riskBufferScale: 8,
  collisionForce: 0.2,

  // Path following
  pathCheckDistance: 60,
  pathCheckSkip: 100,
  lapWrapThreshold: 0.9,
  lapWrapMinDistance: 30
};
