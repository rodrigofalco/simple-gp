/**
 * Physics Engine
 * Handles racer movement, collision detection, and physics simulation
 *
 * Extracted from the monolithic index.html RaceSession class.
 * This is critical gameplay code - kept as close to original as possible.
 */

import { GAME_CONFIG } from '../config/gameConfig.js';

export class PhysicsEngine {
  constructor(config = GAME_CONFIG) {
    this.config = config;
  }

  /**
   * Update a single racer's physics state
   *
   * @param {Object} racer - The racer object to update
   * @param {Array} racingPath - Array of path points {x, y}
   * @param {number} frameCount - Current frame count for timing
   * @param {number} totalLaps - Total laps in the race
   */
  updateRacer(racer, racingPath, frameCount, totalLaps) {
    // Pre-race delay
    if (frameCount < this.config.startDelayFrames) {
      racer.currentSpeed = 0;
      return;
    }

    // Individual launch delay
    if (frameCount < this.config.startDelayFrames + racer.launchDelay) {
      return;
    }

    // Fuel and tire drain (only if not finished)
    if (!racer.finished) {
      const fDrain = this.config.fuelDrainBase +
                     this.config.fuelDrainEngineMultiplier * (racer.params.engineMap / 100);
      racer.fuel = Math.max(0, racer.fuel - racer.currentSpeed * fDrain);

      const tWear = this.config.tireDrainBase +
                    this.config.tireDrainTireMultiplier * (racer.params.tireAggression / 100);
      racer.tires = Math.max(0, racer.tires - racer.currentSpeed * tWear);
    }

    // Calculate speed multiplier
    let speedMult = this.calculateSpeedMultiplier(racer);

    // Get bike archetype multipliers
    const archetype = racer.getBikeArchetype();
    const topSpeedMult = archetype ? archetype.topSpeedMultiplier : 1.0;
    const accelMult = archetype ? archetype.accelerationMultiplier : 1.0;
    const cornerMult = archetype ? archetype.corneringMultiplier : 1.0;
    const steerMult = archetype ? archetype.maxSteerMultiplier : 1.0;

    // Calculate target speed with bike archetype bonus
    const maxSpeed = this.config.velocity * speedMult * topSpeedMult;

    // Acceleration/deceleration logic with archetype multiplier
    const launchAccel = racer.launchAccel * accelMult;
    const normalAccel = this.config.normalAcceleration * accelMult;

    if (racer.currentSpeed < maxSpeed) {
      if (racer.currentSpeed < 0.5 && !racer.finished) {
        racer.currentSpeed += launchAccel;
      } else {
        racer.currentSpeed += normalAccel;
      }
    } else {
      racer.currentSpeed -= this.config.deceleration;
      if (racer.currentSpeed < maxSpeed) {
        racer.currentSpeed = maxSpeed;
      }
    }

    // Path following and steering
    const path = racingPath;
    const lookAhead = this.config.lookAheadDistance;
    const targetIdx = (racer.pathIndex + lookAhead) % path.length;
    const centerPt = path[targetIdx];

    // Calculate tangent for perpendicular offset
    const nextPt = path[(targetIdx + 5) % path.length];
    const prevPt = path[(targetIdx - 5 + path.length) % path.length];
    let tx = nextPt.x - prevPt.x;
    let ty = nextPt.y - prevPt.y;
    const tLen = Math.hypot(tx, ty);
    if (tLen > 0) {
      tx /= tLen;
      ty /= tLen;
    }
    const px = -ty;
    const py = tx;

    // Apply lane offset with wobble
    const wobble = Math.sin(frameCount * this.config.wobbleFrequency + racer.wobblePhase) *
                   this.config.wobbleAmplitude;
    const off = racer.laneOffset + wobble;
    const txPos = centerPt.x + px * off;
    const tyPos = centerPt.y + py * off;

    // Calculate steering
    const dx = txPos - racer.x;
    const dy = tyPos - racer.y;
    const targetAngle = Math.atan2(dy, dx);

    let angDiff = targetAngle - racer.angle;
    while (angDiff <= -Math.PI) angDiff += Math.PI * 2;
    while (angDiff > Math.PI) angDiff -= Math.PI * 2;

    // Detect if we're in a corner (significant angle change needed)
    const isCorner = Math.abs(angDiff) > 0.15;

    // Apply cornering speed penalty/bonus based on archetype
    if (isCorner && !racer.finished) {
      const corneringSpeed = racer.currentSpeed * cornerMult;
      // Turners maintain speed, speeders slow down
      if (cornerMult < 1.0) {
        racer.currentSpeed = Math.max(corneringSpeed, racer.currentSpeed * 0.98);
      } else if (cornerMult > 1.0) {
        // Turners can accelerate slightly through corners
        racer.currentSpeed = Math.min(maxSpeed, racer.currentSpeed * 1.01);
      }
    }

    // Emergency turn prevention (if turning too sharply)
    if (Math.abs(angDiff) > this.config.emergencyTurnThreshold) {
      const safe = path[(targetIdx + 20) % path.length];
      const safeA = Math.atan2(safe.y - racer.y, safe.x - racer.x);
      angDiff = safeA - racer.angle;
      while (angDiff <= -Math.PI) angDiff += Math.PI * 2;
      while (angDiff > Math.PI) angDiff -= Math.PI * 2;
    }

    // Dampen sharp turns
    if (Math.abs(angDiff) > Math.PI / 2) {
      angDiff *= this.config.sharpTurnDamping;
    }

    // Apply archetype steering multiplier
    const maxSteer = this.config.maxSteerAngle * steerMult;
    const steer = Math.max(Math.min(angDiff, maxSteer), -maxSteer);

    // Apply steering with random noise
    racer.angle += steer + (Math.random() - 0.5) * this.config.steeringRandomNoise;

    // Update position
    racer.x += Math.cos(racer.angle) * racer.currentSpeed;
    racer.y += Math.sin(racer.angle) * racer.currentSpeed;

    // Update path index and lap counting
    const skip = this.config.pathCheckSkip;
    for (let i = 1; i <= skip; i++) {
      const cIdx = (racer.pathIndex + i) % path.length;
      const pt = path[cIdx];
      const dist = Math.hypot(pt.x - racer.x, pt.y - racer.y);

      if (dist < this.config.pathCheckDistance) {
        // Check for lap completion (crossing finish line)
        if (racer.pathIndex > path.length * this.config.lapWrapThreshold &&
            cIdx < path.length * (1 - this.config.lapWrapThreshold)) {
          if (dist > this.config.lapWrapMinDistance) continue;

          if (!racer.finished) {
            racer.lap++;
            if (racer.lap >= totalLaps) {
              racer.finished = true;
              racer.finishTime = performance.now();
              racer.progress = totalLaps + 1000;
            }
          }
        }
        racer.pathIndex = cIdx;
        break;
      }
    }

    // Update progress
    if (!racer.finished) {
      racer.progress = racer.lap + (racer.pathIndex / path.length);
    }
  }

  /**
   * Calculate speed multiplier based on racer state
   *
   * @param {Object} racer - The racer object
   * @returns {number} Speed multiplier (0-1+)
   */
  calculateSpeedMultiplier(racer) {
    let speedMult = 1.0;

    if (racer.finished) {
      speedMult = this.config.finishedSpeedMultiplier;
    } else {
      // Engine map effects
      if (racer.fuel > 0) {
        speedMult *= this.config.speedBaseMultiplier +
                     this.config.speedEngineBonus * (racer.params.engineMap / 100);
      } else {
        speedMult *= this.config.speedNoFuelPenalty;
      }

      // Tire degradation effects
      if (racer.tires < this.config.speedLowTireThreshold) {
        speedMult *= this.config.speedLowTireBase +
                     this.config.speedLowTireMultiplier *
                     (racer.tires / this.config.speedLowTireThreshold);
      }

      // Random variation
      speedMult *= (1 + (Math.random() * this.config.speedRandomVariation -
                         this.config.speedRandomVariation / 2));
    }

    return speedMult;
  }

  /**
   * Resolve collisions between all racers
   *
   * @param {Array} racers - Array of racer objects
   */
  resolveCollisions(racers) {
    for (let i = 0; i < racers.length; i++) {
      for (let j = i + 1; j < racers.length; j++) {
        const r1 = racers[i];
        const r2 = racers[j];

        const dx = r2.x - r1.x;
        const dy = r2.y - r1.y;
        const dist = Math.hypot(dx, dy);

        // Calculate buffer based on risk parameters
        const buffer = this.config.riskBufferScale *
                      (1 - (r1.params.risk + r2.params.risk) / 200);
        const minDist = (this.config.racerRadius * 2) + buffer;

        if (dist < minDist) {
          const safe = dist || 0.01; // Avoid division by zero
          const overlap = minDist - safe;
          const nx = dx / safe;
          const ny = dy / safe;
          const f = this.config.collisionForce;

          // Push racers apart
          r1.x -= nx * overlap * f;
          r1.y -= ny * overlap * f;
          r2.x += nx * overlap * f;
          r2.y += ny * overlap * f;
        }
      }
    }
  }
}
