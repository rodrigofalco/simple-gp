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
    this.zoom = 1.0;
    this.minZoom = 0.1;
    this.maxZoom = 3.0;
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

  /**
   * Set zoom level
   * @param {number} zoomLevel - Zoom level (1.0 = normal, 0.5 = zoomed out, 2.0 = zoomed in)
   */
  setZoom(zoomLevel) {
    this.zoom = Math.max(this.minZoom, Math.min(zoomLevel, this.maxZoom));
  }

  /**
   * Adjust zoom by a delta amount
   * @param {number} delta - Amount to change zoom by (e.g., 0.1 or -0.1)
   */
  adjustZoom(delta) {
    this.setZoom(this.zoom + delta);
  }

  /**
   * Zoom to fit entire track
   * @param {number} trackWidth - Width of the track
   * @param {number} trackHeight - Height of the track
   */
  fitToTrack(trackWidth, trackHeight) {
    const zoomX = this.viewportWidth / trackWidth;
    const zoomY = this.viewportHeight / trackHeight;
    this.zoom = Math.min(zoomX, zoomY) * 0.95; // 0.95 for some padding
  }
}
