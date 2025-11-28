/**
 * RaceSession - Simplified orchestrator class for GP Vector Manager racing game
 *
 * This is the main orchestrator that coordinates all game subsystems for a single race session.
 * It delegates responsibilities to specialized modules (Physics, Renderer, TrackEditor, etc.)
 * instead of handling everything itself.
 *
 * Extracted from the monolithic index.html RaceSession class (lines 267-671).
 *
 * @module core/RaceSession
 */

import { PhysicsEngine } from '../engine/physics.js';
import { Renderer } from '../rendering/Renderer.js';
import { TrackEditor } from '../input/TrackEditor.js';
import { Racer } from './Racer.js';
import { getVisualTrackPoints, getBezierNodes, getStartLine } from '../config/tracks.js';
import {
    RACER_NAMES_SOURCE,
    RACER_COLORS_SOURCE,
    RACER_NUMBERS_SOURCE,
    PLAYER_INDICES
} from '../config/constants.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { shuffleArray } from '../utils/shuffle.js';
import { generateRacingLineFromNodes } from '../math/bezier.js';
import { imageLoader } from '../assets/imageLoader.js';

/**
 * RaceSession class - orchestrates a single race session
 */
export class RaceSession {
    /**
     * Creates a new RaceSession instance
     *
     * @param {string} containerId - DOM element ID to append the canvas to
     * @param {string} trackType - Track type identifier ('s-curve', 'stadium', 'l-shape')
     * @param {string} title - Display title for this session
     */
    constructor(containerId, trackType, title) {
        this.trackType = trackType;
        this.title = title;

        // Track data
        this.visualPath = getVisualTrackPoints(trackType);
        this.bezierNodes = getBezierNodes(trackType);
        this.racingPath = [];

        // Game state
        this.racers = [];
        this.totalLaps = 5;
        this.raceFrameCount = 0;
        this.raceFinished = false;

        // Create canvas container
        this.container = document.createElement('div');
        this.container.className = "flex flex-col gap-2 w-full";

        // Add header if not main race
        if (title !== 'Main Race') {
            const header = document.createElement('div');
            header.className = "font-bold text-gray-600 text-xs uppercase flex justify-between";
            header.innerHTML = `<span>${title}</span> <span id="status-${title}" class="bg-gray-200 px-2 rounded">...</span>`;
            this.container.appendChild(header);
        }

        // Create canvas wrapper - fills the container but maintains aspect ratio
        const canvasWrap = document.createElement('div');
        canvasWrap.className = "relative w-full h-full flex items-center justify-center bg-gray-900 overflow-hidden";

        // Create canvas element with FIXED internal resolution
        // CSS will scale the display, but rendering stays crisp at this resolution
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1400;  // Fixed internal width (2x original for retina)
        this.canvas.height = 800;  // Fixed internal height (2x original for retina)
        this.canvas.className = "block bg-gray-900 max-w-full max-h-full";
        this.canvas.style.objectFit = 'contain';  // Maintain aspect ratio when CSS scales

        canvasWrap.appendChild(this.canvas);
        this.container.appendChild(canvasWrap);

        // Append to container
        const parentContainer = document.getElementById(containerId);
        parentContainer.appendChild(this.container);

        // Initialize subsystems with fixed canvas dimensions
        this.physics = new PhysicsEngine(GAME_CONFIG);
        this.renderer = new Renderer(this.canvas, this.canvas.width, this.canvas.height);
        this.camera = this.renderer.getCamera();
        this.trackEditor = new TrackEditor(this);

        // Store reference to generateRacingLineFromNodes for TrackEditor
        this.generateRacingLineFromNodes = generateRacingLineFromNodes;
    }

    /**
     * Initialize the race session - sets up track and creates racers
     */
    async init() {
        // Load background image for this track
        this.backgroundImage = await imageLoader.loadImage(this.trackType);

        // Generate racing line from bezier nodes
        this.racingPath = generateRacingLineFromNodes(this.bezierNodes);

        // Fixed lap count for balanced races
        this.totalLaps = 3;

        // Update UI with total laps
        if (this.title === 'Main Race' || this.title === 'Stadium') {
            const el = document.getElementById('totalLapsDisplay');
            if (el) el.textContent = this.totalLaps;
        }

        // Reset state
        this.racers = [];
        this.raceFrameCount = 0;
        this.raceFinished = false;
        this.camera.reset();

        // Calculate starting grid - use start line data if available
        const startLine = getStartLine(this.trackType);
        let startPoint, angle, dirX, dirY, perpX, perpY;

        if (startLine) {
            // Use precise start line from track data
            startPoint = startLine.center;
            dirX = startLine.forwardVector.x;
            dirY = startLine.forwardVector.y;
            angle = Math.atan2(dirY, dirX);
            perpX = -dirY;
            perpY = dirX;
        } else {
            // Fallback: calculate from racing path
            startPoint = this.racingPath[0];
            const lookaheadPoint = this.racingPath[Math.min(30, this.racingPath.length - 1)];
            const dx = lookaheadPoint.x - startPoint.x;
            const dy = lookaheadPoint.y - startPoint.y;
            angle = Math.atan2(dy, dx);
            const len = Math.hypot(dx, dy);
            dirX = dx / len;
            dirY = dy / len;
            perpX = -dirY;
            perpY = dirX;
        }

        // Shuffle racer attributes
        const names = shuffleArray([...RACER_NAMES_SOURCE]);
        const colors = shuffleArray([...RACER_COLORS_SOURCE]);
        const numbers = shuffleArray([...RACER_NUMBERS_SOURCE]);

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
            const isPlayer = PLAYER_INDICES.includes(i);

            // Create racer using Racer class
            const racer = new Racer({
                id: i,
                name: names[i],
                color: colors[i],
                racingNumber: numbers[i],
                position: { x: posX, y: posY },
                angle: angle,
                isPlayer: isPlayer,
                params: isPlayer ? { tireAggression: 60, engineMap: 60, risk: 60 } : undefined
            });

            this.racers.push(racer);
        }

        // Update camera and draw initial frame
        this.updateCamera();
        this.draw();
    }

    /**
     * Update the race session - called every frame
     * Handles physics updates, collision resolution, and camera updates
     */
    update() {
        // Update frame counter
        this.raceFrameCount++;

        // Update each racer using physics engine
        this.racers.forEach(racer => {
            this.physics.updateRacer(racer, this.racingPath, this.raceFrameCount, this.totalLaps);
        });

        // Resolve collisions between racers
        this.physics.resolveCollisions(this.racers);

        // Update camera to follow selected racer
        this.updateCamera();

        // Check if race is finished
        this.checkFinishState();
    }

    /**
     * Draw the race session - renders track, racers, and debug overlays
     */
    draw() {
        // Get debug mode state from global checkbox
        const debugMode = document.getElementById('debugMode')?.checked || false;

        // Get selected racer ID from global state (this is a temporary solution)
        // In a proper architecture, this would be passed in or managed differently
        const selectedRacerId = window.globalSelectedRacerId || 0;

        // Delegate rendering to Renderer
        this.renderer.render(this, debugMode, selectedRacerId);
    }

    /**
     * Update camera to follow the selected racer
     */
    updateCamera() {
        // Get selected racer ID from global state
        const selectedRacerId = window.globalSelectedRacerId || 0;

        // Find the selected racer
        const target = this.racers.find(r => r.id === selectedRacerId) || this.racers[0];

        // Update camera to follow target
        this.renderer.updateCamera(target);
    }

    /**
     * Check and update race finish state
     */
    checkFinishState() {
        const finishedCount = this.racers.filter(r => r.finished).length;
        let statusText = "Carrera en Curso";
        let statusClass = "mt-4 p-2 bg-gray-100 rounded text-center text-sm font-bold text-gray-600";

        if (!this.raceFinished && finishedCount === this.racers.length) {
            this.raceFinished = true;
            statusText = "🏁 FINALIZADO";
            statusClass = "mt-4 p-2 bg-green-200 text-green-800 border border-green-300 rounded text-center text-sm font-bold";
        } else if (this.raceFrameCount < GAME_CONFIG.startDelayFrames) {
            statusText = "🔴 PREPARADOS...";
            statusClass = "mt-4 p-2 bg-red-100 text-red-800 border border-red-200 rounded text-center text-sm font-bold";
        } else if (this.raceFrameCount < GAME_CONFIG.startDelayFrames + 30) {
            statusText = "🟢 ¡LARGARON!";
            statusClass = "mt-4 p-2 bg-green-500 text-white border border-green-600 rounded text-center text-sm font-bold shadow-lg transform scale-105";
        }

        const el = document.getElementById('raceStatus');
        if (el && el.textContent !== statusText) {
            el.textContent = statusText;
            el.className = statusClass;
        }
    }

    /**
     * Get the array of racers
     * @returns {Array<Racer>} Array of racer objects
     */
    getRacers() {
        return this.racers;
    }

    /**
     * Enable track editor (debug mode)
     */
    enableTrackEditor() {
        this.trackEditor.enable();
    }

    /**
     * Disable track editor
     */
    disableTrackEditor() {
        this.trackEditor.disable();
    }

    /**
     * Clean up resources when session is destroyed
     */
    destroy() {
        this.trackEditor.disable();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
