/**
 * Minimap - Shows track overview with racer positions
 * Allows clicking to jump camera to specific locations
 */
export class Minimap {
    constructor(containerElementId = 'gameContainer') {
        this.containerEl = document.getElementById(containerElementId);
        this.minimapEl = null;
        this.canvas = null;
        this.ctx = null;
        this.trackBounds = null;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.width = 160;
        this.height = 100;
        this.onClickCallback = null;
    }

    /**
     * Creates and renders the minimap element
     */
    render() {
        if (this.minimapEl) {
            this.minimapEl.remove();
        }

        this.minimapEl = document.createElement('div');
        this.minimapEl.id = 'minimap';
        this.minimapEl.className = 'absolute top-4 left-4 z-20';
        this.minimapEl.innerHTML = `
            <div class="bg-black/60 backdrop-blur-md rounded-lg border border-white/20 shadow-xl overflow-hidden">
                <div class="px-2 py-1 border-b border-white/10 flex items-center justify-between">
                    <span class="text-[10px] text-gray-300 uppercase tracking-wider font-semibold">Mapa</span>
                    <span class="text-[9px] text-gray-500">Click para mover</span>
                </div>
                <canvas id="minimap-canvas" width="${this.width}" height="${this.height}" class="cursor-crosshair"></canvas>
            </div>
        `;

        if (this.containerEl) {
            this.containerEl.appendChild(this.minimapEl);
        }

        this.canvas = document.getElementById('minimap-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.setupClickHandler();
        }
    }

    /**
     * Calculates track bounds and scale for rendering
     * @param {Array} visualPath - Array of {x, y} points
     */
    calculateBounds(visualPath) {
        if (!visualPath || visualPath.length === 0) {
            return;
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        visualPath.forEach(p => {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        });

        const padding = 20;
        this.trackBounds = {
            minX: minX - padding,
            maxX: maxX + padding,
            minY: minY - padding,
            maxY: maxY + padding,
            width: maxX - minX + padding * 2,
            height: maxY - minY + padding * 2
        };

        // Calculate scale to fit track in minimap
        const scaleX = (this.width - 10) / this.trackBounds.width;
        const scaleY = (this.height - 10) / this.trackBounds.height;
        this.scale = Math.min(scaleX, scaleY);

        // Calculate centering offset
        this.offsetX = (this.width - this.trackBounds.width * this.scale) / 2;
        this.offsetY = (this.height - this.trackBounds.height * this.scale) / 2;
    }

    /**
     * Converts world coordinates to minimap coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object} Minimap {x, y} coordinates
     */
    worldToMinimap(worldX, worldY) {
        if (!this.trackBounds) {
            return { x: 0, y: 0 };
        }
        return {
            x: (worldX - this.trackBounds.minX) * this.scale + this.offsetX,
            y: (worldY - this.trackBounds.minY) * this.scale + this.offsetY
        };
    }

    /**
     * Converts minimap coordinates to world coordinates
     * @param {number} minimapX - Minimap X coordinate
     * @param {number} minimapY - Minimap Y coordinate
     * @returns {Object} World {x, y} coordinates
     */
    minimapToWorld(minimapX, minimapY) {
        if (!this.trackBounds) {
            return { x: 0, y: 0 };
        }
        return {
            x: (minimapX - this.offsetX) / this.scale + this.trackBounds.minX,
            y: (minimapY - this.offsetY) / this.scale + this.trackBounds.minY
        };
    }

    /**
     * Sets up click handler for camera jumping
     */
    setupClickHandler() {
        if (!this.canvas) {
            return;
        }

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const minimapX = e.clientX - rect.left;
            const minimapY = e.clientY - rect.top;
            const worldPos = this.minimapToWorld(minimapX, minimapY);

            if (this.onClickCallback) {
                this.onClickCallback(worldPos.x, worldPos.y);
            }
        });
    }

    /**
     * Registers callback for click events
     * @param {Function} callback - Function(worldX, worldY) to call on click
     */
    onClick(callback) {
        this.onClickCallback = callback;
    }

    /**
     * Draws the track outline on the minimap
     * @param {Array} visualPath - Array of {x, y} points
     */
    drawTrack(visualPath) {
        if (!this.ctx || !visualPath || visualPath.length === 0) {
            return;
        }

        this.calculateBounds(visualPath);

        // Draw track outline
        this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        const start = this.worldToMinimap(visualPath[0].x, visualPath[0].y);
        this.ctx.moveTo(start.x, start.y);

        for (let i = 1; i < visualPath.length; i += 4) {
            const p = this.worldToMinimap(visualPath[i].x, visualPath[i].y);
            this.ctx.lineTo(p.x, p.y);
        }
        this.ctx.closePath();
        this.ctx.stroke();

        // Store track path for redrawing
        this.cachedTrackPath = visualPath;
    }

    /**
     * Updates the minimap with current race state
     * @param {Array} racers - Array of racer objects
     * @param {number} selectedRacerId - Currently selected racer ID
     * @param {Object} camera - Camera object with x, y, zoom, viewportWidth, viewportHeight
     */
    update(racers, selectedRacerId, camera) {
        if (!this.ctx || !this.trackBounds) {
            return;
        }

        // Clear canvas
        this.ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Redraw track
        if (this.cachedTrackPath) {
            this.ctx.strokeStyle = 'rgba(80, 80, 90, 0.9)';
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            this.ctx.beginPath();
            const start = this.worldToMinimap(this.cachedTrackPath[0].x, this.cachedTrackPath[0].y);
            this.ctx.moveTo(start.x, start.y);

            for (let i = 1; i < this.cachedTrackPath.length; i += 4) {
                const p = this.worldToMinimap(this.cachedTrackPath[i].x, this.cachedTrackPath[i].y);
                this.ctx.lineTo(p.x, p.y);
            }
            this.ctx.closePath();
            this.ctx.stroke();
        }

        // Draw camera viewport rectangle
        if (camera) {
            const viewportWidth = (camera.viewportWidth || 1400) / (camera.zoom || 1);
            const viewportHeight = (camera.viewportHeight || 800) / (camera.zoom || 1);

            const topLeft = this.worldToMinimap(camera.x, camera.y);
            const size = {
                w: viewportWidth * this.scale,
                h: viewportHeight * this.scale
            };

            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(topLeft.x, topLeft.y, size.w, size.h);

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            this.ctx.fillRect(topLeft.x, topLeft.y, size.w, size.h);
        }

        // Draw racers
        racers.forEach(racer => {
            const pos = this.worldToMinimap(racer.x, racer.y);

            if (racer.id === selectedRacerId) {
                // Selected racer - larger with glow
                this.ctx.shadowColor = racer.color;
                this.ctx.shadowBlur = 6;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;

                // Pulsing ring
                const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + pulse * 0.4})`;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 6 + pulse * 2, 0, Math.PI * 2);
                this.ctx.stroke();
            } else if (racer.isPlayer) {
                // Player racer
                this.ctx.fillStyle = racer.color;
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
                this.ctx.fill();

                // Small highlight
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            } else {
                // Other racers
                this.ctx.fillStyle = racer.color;
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    /**
     * Shows or hides the minimap
     * @param {boolean} visible - Whether to show the minimap
     */
    setVisible(visible) {
        if (this.minimapEl) {
            this.minimapEl.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * Removes the minimap from DOM
     */
    destroy() {
        if (this.minimapEl) {
            this.minimapEl.remove();
            this.minimapEl = null;
        }
    }
}
