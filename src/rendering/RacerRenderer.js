/**
 * RacerRenderer class for drawing racer sprites
 * Extracted from RaceSession.drawRacer() method
 */
export class RacerRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  /**
   * Draw a single racer sprite with selection indicator
   * @param {Object} racer - The racer object to draw
   * @param {Object} camera - Camera object with x, y position
   * @param {number} selectedRacerId - ID of the currently selected racer
   */
  draw(racer, camera, selectedRacerId) {
    // Frustum culling - don't draw if off screen
    if (racer.x < camera.x - 50 || racer.x > camera.x + 750 ||
        racer.y < camera.y - 50 || racer.y > camera.y + 450) {
      return;
    }

    this.ctx.save();
    this.ctx.translate(racer.x, racer.y);

    // Draw selection indicator
    if (racer.id === selectedRacerId) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    } else if (racer.isPlayer) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 16, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Rotate racer sprite
    this.ctx.rotate(racer.angle);

    // Draw motorcycle sprite
    const scale = 0.7;
    this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;

    // Front wheel
    this.ctx.fillStyle = '#1f2937';
    this.ctx.beginPath();
    this.ctx.roundRect(-16 * scale, -5 * scale, 8 * scale, 10 * scale, 2 * scale);
    this.ctx.fill();

    // Rear wheel
    this.ctx.beginPath();
    this.ctx.roundRect(12 * scale, -4 * scale, 6 * scale, 8 * scale, 2 * scale);
    this.ctx.fill();

    // Frame
    this.ctx.fillStyle = '#9ca3af';
    this.ctx.fillRect(-8 * scale, -2 * scale, 20 * scale, 4 * scale);

    // Bike body (colored)
    this.ctx.fillStyle = racer.color;
    this.ctx.beginPath();
    this.ctx.moveTo(-8 * scale, -6 * scale);
    this.ctx.lineTo(6 * scale, -5 * scale);
    this.ctx.lineTo(10 * scale, -2 * scale);
    this.ctx.lineTo(10 * scale, 2 * scale);
    this.ctx.lineTo(6 * scale, 5 * scale);
    this.ctx.lineTo(-8 * scale, 6 * scale);
    this.ctx.closePath();
    this.ctx.fill();

    // Rider
    this.ctx.fillStyle = racer.color;
    this.ctx.beginPath();
    this.ctx.ellipse(-2 * scale, 0, 5 * scale, 7 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Helmet
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 3.5 * scale, 0, Math.PI * 2);
    this.ctx.fill();

    // Visor
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 3.5 * scale, -Math.PI / 5, Math.PI / 5);
    this.ctx.lineTo(2 * scale, 0);
    this.ctx.fill();

    this.ctx.restore();

    // Draw racing number and status
    this.ctx.save();
    this.ctx.translate(racer.x, racer.y);
    this.ctx.fillStyle = '#000';
    this.ctx.font = 'bold 10px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText(`#${racer.racingNumber}`, 0, -12);

    // Warning icon if out of fuel
    if (racer.fuel <= 0) {
      this.ctx.fillText("⚠️", 0, -25);
    }

    this.ctx.restore();
  }
}
