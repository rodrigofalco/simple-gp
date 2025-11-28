/**
 * Camera class for smooth camera following of racers
 * Extracted from RaceSession.updateCamera() method
 */
export class Camera {
  constructor(viewportWidth = 700, viewportHeight = 400) {
    this.x = 0;
    this.y = 0;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.smoothing = 0.1;
  }

  /**
   * Smoothly follow a target racer
   * @param {Object} target - The racer to follow (must have x, y properties)
   */
  follow(target) {
    const tx = target.x - this.viewportWidth / 2;
    const ty = target.y - this.viewportHeight / 2;
    this.x += (tx - this.x) * this.smoothing;
    this.y += (ty - this.y) * this.smoothing;
  }

  /**
   * Reset camera position
   */
  reset() {
    this.x = 0;
    this.y = 0;
  }
}
