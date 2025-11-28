/**
 * Main Renderer class that coordinates all rendering operations
 * Extracted from RaceSession.draw() method
 */
import { TrackRenderer } from './TrackRenderer.js';
import { RacerRenderer } from './RacerRenderer.js';
import { Camera } from './Camera.js';

export class Renderer {
  constructor(canvas, canvasWidth = 700, canvasHeight = 400) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = new Camera(canvasWidth, canvasHeight);
    this.trackRenderer = new TrackRenderer(this.ctx);
    this.racerRenderer = new RacerRenderer(this.ctx);
  }

  /**
   * Main render method that draws the entire scene
   * @param {Object} session - The race session containing all rendering data
   * @param {boolean} debugMode - Whether to draw debug overlays
   * @param {number} selectedRacerId - ID of the currently selected racer
   */
  render(session, debugMode, selectedRacerId) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context state
    this.ctx.save();

    // Apply camera transform
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Draw visual track (static geometry)
    this.trackRenderer.drawTrack(session.visualPath);

    // 2. Draw finish line
    this.trackRenderer.drawFinishLine(session.visualPath);

    // 3. Draw debug overlays (racing line and bezier controls)
    if (debugMode) {
      this.trackRenderer.drawDebugSplines(session.racingPath, session.bezierNodes);
    }

    // 4. Draw all racers
    session.racers.forEach(racer => {
      this.racerRenderer.draw(racer, this.camera, selectedRacerId);
    });

    // Restore context state
    this.ctx.restore();
  }

  /**
   * Update camera to follow a target
   * @param {Object} target - The racer to follow
   */
  updateCamera(target) {
    this.camera.follow(target);
  }

  /**
   * Get the current camera instance
   * @returns {Camera} The camera instance
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Reset camera position
   */
  resetCamera() {
    this.camera.reset();
  }
}
