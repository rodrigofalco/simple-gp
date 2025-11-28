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
  velocity: 2.4,                    // Increased from 1.8 - higher base speed
  startDelayFrames: 260,            // ~4.3 seconds to match countdown animation (3,2,1,GO!)

  // Path generation
  stepSize: STEP_SIZE,

  // Rendering
  fps: 60,

  // Fuel and tire drain - balanced for 3-lap races without param changes
  fuelDrainBase: 0.003,             // Reduced for full race completion
  fuelDrainEngineMultiplier: 0.002,
  tireDrainBase: 0.0025,            // Reduced for full race completion
  tireDrainTireMultiplier: 0.003,

  // Speed modifiers
  speedBaseMultiplier: 0.85,        // Increased from 0.82
  speedEngineBonus: 0.35,           // Increased from 0.3
  speedNoFuelPenalty: 0.4,
  speedLowTireThreshold: 20,
  speedLowTireBase: 0.6,
  speedLowTireMultiplier: 0.4,
  speedRandomVariation: 0.03,       // Reduced randomness slightly

  // Acceleration - longer acceleration periods
  launchAcceleration: 0.004,        // Halved from 0.008 - slower launch
  normalAcceleration: 0.006,        // Halved from 0.012 - much longer to reach top speed
  deceleration: 0.003,              // Increased from 0.002 - faster slowdown

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
