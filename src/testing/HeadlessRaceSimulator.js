/**
 * HeadlessRaceSimulator - Fast race simulation without rendering
 * Used for balance testing to run many races quickly
 *
 * @module testing/HeadlessRaceSimulator
 */

import { PhysicsEngine } from '../engine/physics.js';
import { Racer } from '../core/Racer.js';
import { getBezierNodes, getStartLine, AVAILABLE_TRACKS } from '../config/tracks.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { BIKE_ARCHETYPE_KEYS, RACER_NAMES_SOURCE, RACER_COLORS_SOURCE, RACER_NUMBERS_SOURCE } from '../config/constants.js';
import { shuffleArray } from '../utils/shuffle.js';
import { generateRacingLineFromNodes } from '../math/bezier.js';

/**
 * Headless race simulator for balance testing
 */
export class HeadlessRaceSimulator {
  /**
   * Create a new headless race simulator
   * @param {Object} options - Simulation options
   * @param {string} options.trackType - Track to simulate on
   * @param {number} options.totalLaps - Number of laps (default: 3)
   * @param {Object} options.archetypeOverrides - Override archetype multipliers for testing
   */
  constructor(options = {}) {
    this.trackType = options.trackType || 'track1';
    this.totalLaps = options.totalLaps || 3;
    this.archetypeOverrides = options.archetypeOverrides || null;

    // Initialize physics engine
    this.physics = new PhysicsEngine(GAME_CONFIG);

    // Generate racing path from track bezier nodes
    this.bezierNodes = getBezierNodes(this.trackType);
    this.racingPath = generateRacingLineFromNodes(this.bezierNodes);
    this.startLine = getStartLine(this.trackType);

    // Race state
    this.racers = [];
    this.frameCount = 0;
    this.raceFinished = false;
    this.finishOrder = [];
  }

  /**
   * Initialize racers for a new race
   * @param {Object} options - Racer configuration
   * @param {string} options.distribution - How to assign archetypes: 'random', 'equal', 'fixed'
   * @param {Object} options.fixedArchetypes - For 'fixed' distribution, map racer index to archetype
   */
  initRacers(options = {}) {
    const distribution = options.distribution || 'random';
    const fixedArchetypes = options.fixedArchetypes || {};

    this.racers = [];
    this.frameCount = 0;
    this.raceFinished = false;
    this.finishOrder = [];

    // Calculate starting grid
    const startPoint = this.startLine ? this.startLine.center : this.racingPath[0];
    const dirX = this.startLine ? this.startLine.forwardVector.x : 1;
    const dirY = this.startLine ? this.startLine.forwardVector.y : 0;
    const angle = Math.atan2(dirY, dirX);
    const perpX = -dirY;
    const perpY = dirX;

    // Shuffle racer attributes
    const names = shuffleArray([...RACER_NAMES_SOURCE]);
    const colors = shuffleArray([...RACER_COLORS_SOURCE]);
    const numbers = shuffleArray([...RACER_NUMBERS_SOURCE]);

    // Determine archetype assignments
    let archetypeAssignments = [];
    if (distribution === 'equal') {
      // Distribute archetypes as evenly as possible
      const numRacers = names.length;
      for (let i = 0; i < numRacers; i++) {
        archetypeAssignments.push(BIKE_ARCHETYPE_KEYS[i % BIKE_ARCHETYPE_KEYS.length]);
      }
      archetypeAssignments = shuffleArray(archetypeAssignments);
    }

    // Create racers
    for (let i = 0; i < names.length; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      let colOffset = col - 1;
      if (row === 3) colOffset = col - 0.5;

      const distBack = 60 + (row * 35);
      const distSide = colOffset * 25;

      const posX = startPoint.x - (dirX * distBack) + (perpX * distSide);
      const posY = startPoint.y - (dirY * distBack) + (perpY * distSide);

      // Determine bike type
      let bikeType;
      if (distribution === 'fixed' && fixedArchetypes[i] !== undefined) {
        bikeType = fixedArchetypes[i];
      } else if (distribution === 'equal') {
        bikeType = archetypeAssignments[i];
      } else {
        // Random assignment
        bikeType = undefined; // Racer class will handle random assignment
      }

      const racer = new Racer({
        id: i,
        name: names[i],
        color: colors[i],
        racingNumber: numbers[i],
        position: { x: posX, y: posY },
        angle: angle,
        isPlayer: false,
        bikeType: bikeType
      });

      // Apply archetype overrides if provided (for testing balance changes)
      if (this.archetypeOverrides && this.archetypeOverrides[racer.bikeType]) {
        const overrides = this.archetypeOverrides[racer.bikeType];
        racer.bikeArchetype = { ...racer.bikeArchetype, ...overrides };
      }

      this.racers.push(racer);
    }

    return this.racers;
  }

  /**
   * Run the race simulation to completion
   * @param {number} maxFrames - Maximum frames before timeout (default: 60000 = ~16 minutes at 60fps)
   * @returns {Object} Race results
   */
  runRace(maxFrames = 60000) {
    while (!this.raceFinished && this.frameCount < maxFrames) {
      this.simulateFrame();
    }

    return this.getResults();
  }

  /**
   * Simulate a single frame of the race
   */
  simulateFrame() {
    this.frameCount++;

    // Update each racer
    for (const racer of this.racers) {
      this.physics.updateRacer(racer, this.racingPath, this.frameCount, this.totalLaps);

      // Track finish order
      if (racer.finished && !this.finishOrder.includes(racer.id)) {
        this.finishOrder.push(racer.id);
      }
    }

    // Resolve collisions
    this.physics.resolveCollisions(this.racers);

    // Check if race is finished
    const finishedCount = this.racers.filter(r => r.finished).length;
    if (finishedCount === this.racers.length) {
      this.raceFinished = true;
    }
  }

  /**
   * Get race results
   * @returns {Object} Race results with standings and statistics
   */
  getResults() {
    // Sort racers by progress (finish order)
    const standings = [...this.racers].sort((a, b) => b.progress - a.progress);

    // Build results object
    const results = {
      track: this.trackType,
      totalLaps: this.totalLaps,
      totalFrames: this.frameCount,
      raceTimeSeconds: this.frameCount / 60,
      finished: this.raceFinished,
      standings: standings.map((racer, position) => ({
        position: position + 1,
        id: racer.id,
        name: racer.name,
        archetype: racer.bikeType,
        archetypeName: racer.bikeArchetype.name,
        lap: racer.lap,
        progress: racer.progress,
        finished: racer.finished,
        finishTime: racer.finishTime,
        finalFuel: racer.fuel,
        finalTires: racer.tires
      })),
      winner: null,
      archetypeResults: {}
    };

    // Set winner
    if (standings.length > 0) {
      const winner = standings[0];
      results.winner = {
        name: winner.name,
        archetype: winner.bikeType,
        archetypeName: winner.bikeArchetype.name
      };
    }

    // Aggregate results by archetype
    for (const archetype of BIKE_ARCHETYPE_KEYS) {
      const archetypeRacers = results.standings.filter(r => r.archetype === archetype);
      const positions = archetypeRacers.map(r => r.position);

      results.archetypeResults[archetype] = {
        count: archetypeRacers.length,
        positions: positions,
        avgPosition: positions.length > 0 ? positions.reduce((a, b) => a + b, 0) / positions.length : null,
        bestPosition: positions.length > 0 ? Math.min(...positions) : null,
        worstPosition: positions.length > 0 ? Math.max(...positions) : null,
        wins: positions.filter(p => p === 1).length
      };
    }

    return results;
  }
}

/**
 * Run multiple races for balance testing
 * @param {Object} options - Test options
 * @param {string} options.trackType - Track to test on
 * @param {number} options.numRaces - Number of races to run
 * @param {string} options.distribution - Archetype distribution strategy
 * @param {Object} options.archetypeOverrides - Override archetype parameters
 * @param {Function} options.onProgress - Progress callback
 * @returns {Object} Aggregated statistics
 */
export async function runBalanceTest(options = {}) {
  const {
    trackType = 'track1',
    numRaces = 100,
    distribution = 'equal',
    archetypeOverrides = null,
    onProgress = null,
    totalLaps = 3
  } = options;

  const stats = {
    track: trackType,
    numRaces: numRaces,
    distribution: distribution,
    totalLaps: totalLaps,
    archetypes: {},
    races: []
  };

  // Initialize archetype statistics
  for (const archetype of BIKE_ARCHETYPE_KEYS) {
    stats.archetypes[archetype] = {
      wins: 0,
      podiums: 0, // Top 3
      totalPosition: 0,
      positionCounts: {},
      appearances: 0
    };
  }

  // Run races
  for (let i = 0; i < numRaces; i++) {
    const simulator = new HeadlessRaceSimulator({
      trackType,
      totalLaps,
      archetypeOverrides
    });

    simulator.initRacers({ distribution });
    const results = simulator.runRace();

    // Aggregate statistics
    for (const standing of results.standings) {
      const archetypeStats = stats.archetypes[standing.archetype];
      archetypeStats.appearances++;
      archetypeStats.totalPosition += standing.position;

      if (standing.position === 1) archetypeStats.wins++;
      if (standing.position <= 3) archetypeStats.podiums++;

      // Track position distribution
      const posKey = standing.position.toString();
      archetypeStats.positionCounts[posKey] = (archetypeStats.positionCounts[posKey] || 0) + 1;
    }

    // Store race summary
    stats.races.push({
      raceNumber: i + 1,
      winner: results.winner,
      raceTimeSeconds: results.raceTimeSeconds
    });

    // Progress callback
    if (onProgress) {
      onProgress({
        completed: i + 1,
        total: numRaces,
        percentage: ((i + 1) / numRaces * 100).toFixed(1),
        lastWinner: results.winner
      });
    }
  }

  // Calculate final statistics
  for (const archetype of BIKE_ARCHETYPE_KEYS) {
    const archetypeStats = stats.archetypes[archetype];
    archetypeStats.winRate = (archetypeStats.wins / numRaces * 100).toFixed(2) + '%';
    archetypeStats.podiumRate = (archetypeStats.podiums / (numRaces * 3) * 100).toFixed(2) + '%';
    archetypeStats.avgPosition = archetypeStats.appearances > 0
      ? (archetypeStats.totalPosition / archetypeStats.appearances).toFixed(2)
      : 'N/A';
  }

  return stats;
}

/**
 * Run balance test on all available tracks
 * @param {Object} options - Test options
 * @returns {Object} Results for all tracks
 */
export async function runFullBalanceTest(options = {}) {
  const { numRaces = 100, distribution = 'equal', archetypeOverrides = null, onProgress = null, totalLaps = 3 } = options;

  const allResults = {
    timestamp: new Date().toISOString(),
    numRacesPerTrack: numRaces,
    distribution: distribution,
    totalLaps: totalLaps,
    tracks: {}
  };

  for (const track of AVAILABLE_TRACKS) {
    console.log(`\nTesting ${track.name} (${track.id})...`);

    const trackResults = await runBalanceTest({
      trackType: track.id,
      numRaces,
      distribution,
      archetypeOverrides,
      totalLaps,
      onProgress: onProgress ? (progress) => {
        onProgress({ ...progress, track: track.name });
      } : null
    });

    allResults.tracks[track.id] = trackResults;
  }

  // Calculate overall statistics across all tracks
  allResults.overall = calculateOverallStats(allResults.tracks);

  return allResults;
}

/**
 * Calculate overall statistics from track results
 */
function calculateOverallStats(trackResults) {
  const overall = {
    archetypes: {}
  };

  for (const archetype of BIKE_ARCHETYPE_KEYS) {
    overall.archetypes[archetype] = {
      totalWins: 0,
      totalPodiums: 0,
      totalAppearances: 0,
      totalPosition: 0
    };
  }

  // Aggregate from all tracks
  for (const trackId in trackResults) {
    const track = trackResults[trackId];
    for (const archetype of BIKE_ARCHETYPE_KEYS) {
      const stats = track.archetypes[archetype];
      overall.archetypes[archetype].totalWins += stats.wins;
      overall.archetypes[archetype].totalPodiums += stats.podiums;
      overall.archetypes[archetype].totalAppearances += stats.appearances;
      overall.archetypes[archetype].totalPosition += stats.totalPosition;
    }
  }

  // Calculate overall rates
  const numTracks = Object.keys(trackResults).length;
  const totalRaces = Object.values(trackResults).reduce((sum, t) => sum + t.numRaces, 0);

  for (const archetype of BIKE_ARCHETYPE_KEYS) {
    const stats = overall.archetypes[archetype];
    stats.overallWinRate = (stats.totalWins / totalRaces * 100).toFixed(2) + '%';
    stats.overallPodiumRate = (stats.totalPodiums / (totalRaces * 3) * 100).toFixed(2) + '%';
    stats.overallAvgPosition = stats.totalAppearances > 0
      ? (stats.totalPosition / stats.totalAppearances).toFixed(2)
      : 'N/A';
  }

  return overall;
}

/**
 * Format balance test results as a readable report
 * @param {Object} results - Results from runFullBalanceTest or runBalanceTest
 * @returns {string} Formatted report
 */
export function formatBalanceReport(results) {
  const lines = [];

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                    GAME BALANCE TEST REPORT                    ');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push(`Timestamp: ${results.timestamp || new Date().toISOString()}`);
  lines.push(`Races per track: ${results.numRacesPerTrack || results.numRaces}`);
  lines.push(`Distribution: ${results.distribution}`);
  lines.push(`Laps per race: ${results.totalLaps}`);
  lines.push('');

  // If we have multiple tracks
  if (results.tracks) {
    for (const trackId in results.tracks) {
      const track = results.tracks[trackId];
      lines.push(`\n┌─────────────────────────────────────────────────────────────┐`);
      lines.push(`│  Track: ${trackId.padEnd(51)}│`);
      lines.push(`└─────────────────────────────────────────────────────────────┘`);
      lines.push(formatTrackResults(track));
    }

    // Overall summary
    if (results.overall) {
      lines.push(`\n┌─────────────────────────────────────────────────────────────┐`);
      lines.push(`│                    OVERALL SUMMARY                          │`);
      lines.push(`└─────────────────────────────────────────────────────────────┘`);
      lines.push(formatOverallResults(results.overall));
    }
  } else {
    // Single track results
    lines.push(formatTrackResults(results));
  }

  // Balance assessment
  lines.push('\n═══════════════════════════════════════════════════════════════');
  lines.push('                      BALANCE ASSESSMENT                        ');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push(assessBalance(results));

  return lines.join('\n');
}

function formatTrackResults(track) {
  const lines = [];

  lines.push('');
  lines.push('  Archetype      │ Wins  │ Win Rate │ Podiums │ Avg Pos');
  lines.push('  ───────────────┼───────┼──────────┼─────────┼─────────');

  for (const archetype of BIKE_ARCHETYPE_KEYS) {
    const stats = track.archetypes[archetype];
    const icon = archetype === 'speeder' ? '🚀' : archetype === 'accelerator' ? '⚡' : '🔄';
    lines.push(
      `  ${icon} ${archetype.padEnd(11)} │ ${String(stats.wins).padStart(5)} │ ${stats.winRate.padStart(8)} │ ${String(stats.podiums).padStart(7)} │ ${stats.avgPosition.padStart(7)}`
    );
  }

  return lines.join('\n');
}

function formatOverallResults(overall) {
  const lines = [];

  lines.push('');
  lines.push('  Archetype      │ Total Wins │ Win Rate │ Avg Pos');
  lines.push('  ───────────────┼────────────┼──────────┼─────────');

  for (const archetype of BIKE_ARCHETYPE_KEYS) {
    const stats = overall.archetypes[archetype];
    const icon = archetype === 'speeder' ? '🚀' : archetype === 'accelerator' ? '⚡' : '🔄';
    lines.push(
      `  ${icon} ${archetype.padEnd(11)} │ ${String(stats.totalWins).padStart(10)} │ ${stats.overallWinRate.padStart(8)} │ ${stats.overallAvgPosition.padStart(7)}`
    );
  }

  return lines.join('\n');
}

function assessBalance(results) {
  const lines = [];

  let archetypeStats;
  if (results.overall) {
    archetypeStats = results.overall.archetypes;
  } else {
    archetypeStats = results.archetypes;
  }

  // Extract win rates as numbers
  const winRates = {};
  for (const archetype of BIKE_ARCHETYPE_KEYS) {
    const stats = archetypeStats[archetype];
    const rateStr = stats.overallWinRate || stats.winRate;
    winRates[archetype] = parseFloat(rateStr.replace('%', ''));
  }

  const avgWinRate = Object.values(winRates).reduce((a, b) => a + b, 0) / BIKE_ARCHETYPE_KEYS.length;
  const maxDiff = Math.max(...Object.values(winRates)) - Math.min(...Object.values(winRates));

  // Determine dominant and weak archetypes
  const sorted = Object.entries(winRates).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0];
  const weakest = sorted[sorted.length - 1];

  lines.push('');

  if (maxDiff < 5) {
    lines.push('  ✅ EXCELLENT BALANCE');
    lines.push(`     Win rates are within ${maxDiff.toFixed(1)}% of each other.`);
    lines.push('     All archetypes have competitive chances of winning.');
  } else if (maxDiff < 15) {
    lines.push('  ⚠️  ACCEPTABLE BALANCE');
    lines.push(`     Win rate difference: ${maxDiff.toFixed(1)}%`);
    lines.push(`     Strongest: ${dominant[0]} (${dominant[1].toFixed(1)}%)`);
    lines.push(`     Weakest: ${weakest[0]} (${weakest[1].toFixed(1)}%)`);
    lines.push('     Consider minor adjustments for better balance.');
  } else {
    lines.push('  ❌ POOR BALANCE - NEEDS ADJUSTMENT');
    lines.push(`     Win rate difference: ${maxDiff.toFixed(1)}%`);
    lines.push(`     Dominant: ${dominant[0]} (${dominant[1].toFixed(1)}%) - NEEDS NERF`);
    lines.push(`     Weakest: ${weakest[0]} (${weakest[1].toFixed(1)}%) - NEEDS BUFF`);
  }

  // Specific recommendations
  lines.push('');
  lines.push('  RECOMMENDATIONS:');

  if (winRates.speeder > avgWinRate + 5) {
    lines.push('  • Speeder is too strong. Reduce topSpeedMultiplier or increase corneringMultiplier penalty.');
  } else if (winRates.speeder < avgWinRate - 5) {
    lines.push('  • Speeder is too weak. Increase topSpeedMultiplier or reduce cornering penalty.');
  }

  if (winRates.accelerator > avgWinRate + 5) {
    lines.push('  • Accelerator is too strong. Reduce accelerationMultiplier.');
  } else if (winRates.accelerator < avgWinRate - 5) {
    lines.push('  • Accelerator is too weak. Increase accelerationMultiplier or topSpeedMultiplier.');
  }

  if (winRates.turner > avgWinRate + 5) {
    lines.push('  • Turner is too strong. Reduce corneringMultiplier bonus.');
  } else if (winRates.turner < avgWinRate - 5) {
    lines.push('  • Turner is too weak. Increase corneringMultiplier or maxSteerMultiplier.');
  }

  if (maxDiff < 5) {
    lines.push('  • No major changes needed. Fine-tune based on player feedback.');
  }

  return lines.join('\n');
}

export { BIKE_ARCHETYPE_KEYS, AVAILABLE_TRACKS };
