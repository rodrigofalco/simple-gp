/**
 * TrackRenderer class for drawing track visuals
 * Extracted from RaceSession.draw() method (track drawing logic)
 */
export class TrackRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  /**
   * Draw the visual track path with borders
   * @param {Array} visualPath - Array of {x, y} points defining the track
   * @param {boolean} hasBackground - Whether the session has a background image
   */
  drawTrack(visualPath, hasBackground = false) {
    // If visual path is empty, don't draw anything (relying on background image)
    if (visualPath.length === 0) {
      return;
    }

    const trackWidth = 140;
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';

    // Draw track surface
    this.ctx.beginPath();
    if (visualPath.length > 0) {
      this.ctx.moveTo(visualPath[0].x, visualPath[0].y);
    }
    for (let i = 1; i < visualPath.length; i += 4) {
      this.ctx.lineTo(visualPath[i].x, visualPath[i].y);
    }
    this.ctx.closePath();
    this.ctx.lineWidth = trackWidth;

    // Adjust opacity based on whether there's a background image
    // If background exists, use semi-transparent track to show image
    if (hasBackground) {
      this.ctx.globalAlpha = 0.65;
      this.ctx.strokeStyle = '#374151';
    } else {
      this.ctx.strokeStyle = '#374151';
    }
    this.ctx.stroke();

    // Reset alpha
    this.ctx.globalAlpha = 1.0;

    // Draw track borders (white lines)
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#f8fafc';
    for (let i = 0; i < visualPath.length; i += 10) {
      const p1 = visualPath[i];
      const p2 = visualPath[(i + 5) % visualPath.length];
      const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const perp = ang + Math.PI / 2;
      const dx = (trackWidth / 2) * Math.cos(perp);
      const dy = (trackWidth / 2) * Math.sin(perp);

      this.ctx.beginPath();
      this.ctx.moveTo(p1.x + dx, p1.y + dy);
      this.ctx.lineTo(p2.x + dx, p2.y + dy);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(p1.x - dx, p1.y - dy);
      this.ctx.lineTo(p2.x - dx, p2.y - dy);
      this.ctx.stroke();
    }
  }

  /**
   * Draw the finish line (checkered pattern)
   * @param {Array} visualPath - Array of {x, y} points defining the track
   */
  drawFinishLine(visualPath) {
    if (visualPath.length <= 20) return;

    const trackWidth = 140;
    const p1 = visualPath[0];
    const p2 = visualPath[10];
    const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    this.ctx.save();
    this.ctx.translate(p1.x, p1.y);
    this.ctx.rotate(ang + Math.PI / 2);

    const w = trackWidth;
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(-w / 2, -4, w, 8);

    this.ctx.fillStyle = '#000';
    for (let k = 0; k < 10; k++) {
      if (k % 2 === 0) {
        this.ctx.fillRect(-w / 2 + (k * (w / 10)), -4, w / 10, 4);
      } else {
        this.ctx.fillRect(-w / 2 + (k * (w / 10)), 0, w / 10, 4);
      }
    }

    this.ctx.restore();
  }

  /**
   * Draw debug splines and control points for track editing
   * @param {Array} racingPath - Array of {x, y} points on the racing line
   * @param {Array} bezierNodes - Array of bezier control nodes
   */
  drawDebugSplines(racingPath, bezierNodes) {
    // Draw racing line
    this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    if (racingPath.length > 0) {
      this.ctx.moveTo(racingPath[0].x, racingPath[0].y);
    }
    for (let pt of racingPath) {
      this.ctx.lineTo(pt.x, pt.y);
    }
    this.ctx.stroke();

    // Draw bezier control points and handles
    bezierNodes.forEach((n, i) => {
      // Draw handle lines
      this.ctx.beginPath();
      this.ctx.moveTo(n.x + n.handleIn.x, n.y + n.handleIn.y);
      this.ctx.lineTo(n.x, n.y);
      this.ctx.lineTo(n.x + n.handleOut.x, n.y + n.handleOut.y);
      this.ctx.strokeStyle = '#999';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Draw handle points
      this.ctx.fillStyle = '#ef4444';
      this.ctx.beginPath();
      this.ctx.arc(n.x + n.handleIn.x, n.y + n.handleIn.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(n.x + n.handleOut.x, n.y + n.handleOut.y, 4, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw anchor point
      this.ctx.fillStyle = '#3b82f6';
      this.ctx.fillRect(n.x - 5, n.y - 5, 10, 10);
    });
  }
}
