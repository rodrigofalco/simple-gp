#!/usr/bin/env node
/**
 * Balance Test CLI Runner
 * Run from project root: node src/testing/runBalanceTest.js
 *
 * Usage:
 *   node src/testing/runBalanceTest.js                    # Default: 100 races per track
 *   node src/testing/runBalanceTest.js --races 50         # 50 races per track
 *   node src/testing/runBalanceTest.js --track track1     # Single track only
 *   node src/testing/runBalanceTest.js --laps 5           # 5 laps per race
 */

import {
  runBalanceTest,
  runFullBalanceTest,
  formatBalanceReport,
  AVAILABLE_TRACKS
} from './HeadlessRaceSimulator.js';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    races: 100,
    track: null,
    laps: 3,
    distribution: 'equal',
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--races':
      case '-r':
        options.races = parseInt(args[++i], 10);
        break;
      case '--track':
      case '-t':
        options.track = args[++i];
        break;
      case '--laps':
      case '-l':
        options.laps = parseInt(args[++i], 10);
        break;
      case '--distribution':
      case '-d':
        options.distribution = args[++i];
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           GP VECTOR MANAGER - BALANCE TEST CLI                ║
╚═══════════════════════════════════════════════════════════════╝

USAGE:
  node src/testing/runBalanceTest.js [options]

OPTIONS:
  -r, --races <num>       Number of races per track (default: 100)
  -t, --track <id>        Test single track only (track1, general-roca)
  -l, --laps <num>        Laps per race (default: 3)
  -d, --distribution      Archetype distribution: random, equal (default: equal)
  -v, --verbose           Show progress for each race
  -h, --help              Show this help message

AVAILABLE TRACKS:
${AVAILABLE_TRACKS.map(t => `  ${t.icon} ${t.id.padEnd(15)} ${t.name}`).join('\n')}

EXAMPLES:
  # Run default test (100 races per track, 3 laps each)
  node src/testing/runBalanceTest.js

  # Quick test with 20 races
  node src/testing/runBalanceTest.js --races 20

  # Test only Track 1 with 5-lap races
  node src/testing/runBalanceTest.js --track track1 --laps 5 --races 50

  # Verbose mode to see each race result
  node src/testing/runBalanceTest.js --verbose --races 10
`);
}

async function main() {
  const options = parseArgs();

  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           GP VECTOR MANAGER - BALANCE TEST                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Configuration:`);
  console.log(`  • Races per track: ${options.races}`);
  console.log(`  • Laps per race: ${options.laps}`);
  console.log(`  • Distribution: ${options.distribution}`);
  console.log(`  • Track: ${options.track || 'All tracks'}`);
  console.log('');
  console.log('Starting balance test...');
  console.log('');

  const startTime = Date.now();

  const progressCallback = options.verbose ? (progress) => {
    const trackInfo = progress.track ? ` [${progress.track}]` : '';
    const winner = progress.lastWinner ? ` - Winner: ${progress.lastWinner.archetypeName} (${progress.lastWinner.name})` : '';
    console.log(`  Race ${progress.completed}/${progress.total}${trackInfo}${winner}`);
  } : (progress) => {
    // Simple progress bar for non-verbose mode
    const pct = Math.floor(progress.percentage);
    const trackInfo = progress.track ? ` ${progress.track}` : '';
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    process.stdout.write(`\r  Progress:${trackInfo} [${bar}] ${pct}%`);
  };

  let results;

  if (options.track) {
    // Single track test
    console.log(`Testing ${options.track}...`);
    results = await runBalanceTest({
      trackType: options.track,
      numRaces: options.races,
      distribution: options.distribution,
      totalLaps: options.laps,
      onProgress: progressCallback
    });
  } else {
    // Full test on all tracks
    results = await runFullBalanceTest({
      numRaces: options.races,
      distribution: options.distribution,
      totalLaps: options.laps,
      onProgress: progressCallback
    });
  }

  console.log('\n');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Test completed in ${elapsed} seconds`);
  console.log('');

  // Print report
  console.log(formatBalanceReport(results));
  console.log('');
}

main().catch(console.error);
