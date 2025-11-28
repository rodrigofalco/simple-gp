/**
 * RaceHUD - Heads-Up Display for the followed racer
 * Shows speed, position, lap progress, and resource status
 */
export class RaceHUD {
    constructor(containerElementId = 'gameContainer') {
        this.containerEl = document.getElementById(containerElementId);
        this.hudEl = null;
        this.lastSpeed = 0;
        this.speedSmoothing = 0.15;
    }

    /**
     * Creates and renders the HUD element
     */
    render() {
        // Remove existing HUD if any
        if (this.hudEl) {
            this.hudEl.remove();
        }

        this.hudEl = document.createElement('div');
        this.hudEl.id = 'raceHUD';
        this.hudEl.className = 'absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20';
        this.hudEl.innerHTML = `
            <div class="flex items-center gap-3 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-2xl">
                <!-- Position Badge -->
                <div class="flex flex-col items-center min-w-[50px]">
                    <span class="text-[10px] text-gray-400 uppercase tracking-wider">Pos</span>
                    <span id="hud-position" class="text-2xl font-black text-white">P1</span>
                </div>

                <div class="w-px h-10 bg-white/20"></div>

                <!-- Speed Gauge -->
                <div class="flex flex-col items-center min-w-[70px]">
                    <span class="text-[10px] text-gray-400 uppercase tracking-wider">Velocidad</span>
                    <div class="flex items-baseline gap-1">
                        <span id="hud-speed" class="text-2xl font-black text-white tabular-nums">0</span>
                        <span class="text-xs text-gray-400">km/h</span>
                    </div>
                </div>

                <div class="w-px h-10 bg-white/20"></div>

                <!-- Lap Progress -->
                <div class="flex flex-col items-center min-w-[60px]">
                    <span class="text-[10px] text-gray-400 uppercase tracking-wider">Vuelta</span>
                    <div class="flex items-baseline gap-0.5">
                        <span id="hud-lap" class="text-2xl font-black text-white">1</span>
                        <span class="text-sm text-gray-400">/</span>
                        <span id="hud-total-laps" class="text-lg text-gray-300">3</span>
                    </div>
                </div>

                <div class="w-px h-10 bg-white/20"></div>

                <!-- Bike Type & Resources -->
                <div class="flex flex-col items-center gap-1 min-w-[80px]">
                    <div class="flex items-center gap-2">
                        <span id="hud-bike-icon" class="text-xl" title="Tipo de moto">🏍️</span>
                        <span id="hud-racer-name" class="text-sm font-bold text-white truncate max-w-[60px]">---</span>
                    </div>
                    <div class="flex gap-2 w-full">
                        <!-- Tire indicator -->
                        <div class="flex-1 flex items-center gap-1" title="Neumáticos">
                            <span class="text-[10px]">🛞</span>
                            <div class="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div id="hud-tires" class="h-full bg-green-500 transition-all duration-300" style="width: 100%"></div>
                            </div>
                        </div>
                        <!-- Fuel indicator -->
                        <div class="flex-1 flex items-center gap-1" title="Combustible">
                            <span class="text-[10px]">⛽</span>
                            <div class="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div id="hud-fuel" class="h-full bg-yellow-500 transition-all duration-300" style="width: 100%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (this.containerEl) {
            this.containerEl.appendChild(this.hudEl);
        }
    }

    /**
     * Updates the HUD with current racer data
     * @param {Object} racer - The followed racer object
     * @param {number} position - Current race position (1-based)
     * @param {number} totalRacers - Total number of racers
     * @param {number} totalLaps - Total laps in the race
     */
    update(racer, position, totalRacers, totalLaps) {
        if (!racer || !this.hudEl) {
            return;
        }

        // Smooth speed display (convert internal speed to km/h scale)
        const displaySpeed = Math.round(racer.currentSpeed * 50);
        this.lastSpeed += (displaySpeed - this.lastSpeed) * this.speedSmoothing;

        // Update position
        const posEl = document.getElementById('hud-position');
        if (posEl) {
            posEl.textContent = `P${position}`;
            // Color code position
            if (position === 1) {
                posEl.className = 'text-2xl font-black text-yellow-400';
            } else if (position <= 3) {
                posEl.className = 'text-2xl font-black text-green-400';
            } else {
                posEl.className = 'text-2xl font-black text-white';
            }
        }

        // Update speed
        const speedEl = document.getElementById('hud-speed');
        if (speedEl) {
            speedEl.textContent = Math.round(this.lastSpeed);
        }

        // Update lap
        const lapEl = document.getElementById('hud-lap');
        const totalLapsEl = document.getElementById('hud-total-laps');
        if (lapEl) {
            lapEl.textContent = Math.max(1, racer.lap);
        }
        if (totalLapsEl) {
            totalLapsEl.textContent = totalLaps;
        }

        // Update racer info
        const nameEl = document.getElementById('hud-racer-name');
        const bikeIconEl = document.getElementById('hud-bike-icon');
        if (nameEl) {
            nameEl.textContent = racer.name;
        }
        if (bikeIconEl && racer.getBikeArchetype) {
            const archetype = racer.getBikeArchetype();
            bikeIconEl.textContent = archetype ? archetype.icon : '🏍️';
            bikeIconEl.title = archetype ? `${archetype.name}: ${archetype.description}` : 'Moto';
        }

        // Update resource bars
        const tiresEl = document.getElementById('hud-tires');
        const fuelEl = document.getElementById('hud-fuel');

        if (tiresEl) {
            tiresEl.style.width = `${racer.tires}%`;
            // Color based on level
            if (racer.tires < 20) {
                tiresEl.className = 'h-full bg-red-500 transition-all duration-300 animate-pulse';
            } else if (racer.tires < 50) {
                tiresEl.className = 'h-full bg-yellow-500 transition-all duration-300';
            } else {
                tiresEl.className = 'h-full bg-green-500 transition-all duration-300';
            }
        }

        if (fuelEl) {
            fuelEl.style.width = `${racer.fuel}%`;
            if (racer.fuel < 20) {
                fuelEl.className = 'h-full bg-red-500 transition-all duration-300 animate-pulse';
            } else if (racer.fuel < 50) {
                fuelEl.className = 'h-full bg-orange-500 transition-all duration-300';
            } else {
                fuelEl.className = 'h-full bg-yellow-500 transition-all duration-300';
            }
        }
    }

    /**
     * Shows or hides the HUD
     * @param {boolean} visible - Whether to show the HUD
     */
    setVisible(visible) {
        if (this.hudEl) {
            this.hudEl.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * Removes the HUD from DOM
     */
    destroy() {
        if (this.hudEl) {
            this.hudEl.remove();
            this.hudEl = null;
        }
    }
}
