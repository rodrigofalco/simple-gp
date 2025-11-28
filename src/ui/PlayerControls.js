/**
 * Player Controls UI Component - Ultra Compact Version
 * Renders minimalist strategy controls for player racers
 *
 * Control Effects:
 * - Tire (T): Higher = more grip but faster wear
 * - Engine (E): Higher = more power but more fuel use
 * - Risk (R): Higher = closer passes but more collisions
 */
export class PlayerControls {
    constructor(containerElementId = 'playerControls') {
        this.containerEl = document.getElementById(containerElementId);
        this.injectStyles();
    }

    /**
     * Injects CSS for compact control styling
     */
    injectStyles() {
        if (document.getElementById('player-controls-styles')) {
            return;
        }

        const styleEl = document.createElement('style');
        styleEl.id = 'player-controls-styles';
        styleEl.textContent = `
            .ctrl-btn {
                transition: all 0.1s ease;
                cursor: pointer;
            }
            .ctrl-btn:hover {
                transform: scale(1.1);
            }
            .ctrl-btn:active {
                transform: scale(0.95);
            }
            .ctrl-btn.active {
                box-shadow: 0 0 8px currentColor;
            }
            .resource-bar {
                transition: width 0.3s ease;
            }
            .pilot-card {
                transition: all 0.2s ease;
            }
            .pilot-card:hover {
                transform: translateY(-2px);
            }
            .pilot-card.selected {
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.8);
            }
        `;
        document.head.appendChild(styleEl);
    }

    /**
     * Updates the player controls display - Ultra compact version
     */
    update(racers, playerIndices, globalParams, selectedRacerId, callbacks) {
        if (!this.containerEl || racers.length === 0) {
            return;
        }

        this.containerEl.innerHTML = '';

        playerIndices.forEach(index => {
            const racer = racers[index];
            if (!racer) {
                return;
            }

            const params = globalParams[racer.id];
            const isSelected = (racer.id === selectedRacerId);

            const card = document.createElement('div');
            card.className = `pilot-card flex flex-col gap-2 p-2 rounded-lg bg-white/10 ${isSelected ? 'selected' : ''}`;
            card.style.minWidth = '140px';

            // Get bike archetype
            const archetype = racer.getBikeArchetype ? racer.getBikeArchetype() : null;
            const bikeIcon = archetype ? archetype.icon : '🏍️';

            // Resource percentages
            const tirePercent = Math.round(racer.tires);
            const fuelPercent = Math.round(racer.fuel);

            // Create control row helper
            const createControlRow = (label, paramKey, currentVal) => {
                const levels = [20, 40, 60, 80, 100];
                const colors = ['#22c55e', '#84cc16', '#3b82f6', '#f97316', '#ef4444'];
                let html = `<div class="flex items-center gap-1">
                    <span class="text-[9px] text-white/60 w-3 font-bold">${label}</span>`;
                levels.forEach((val, i) => {
                    const isActive = val === currentVal;
                    const color = colors[i];
                    html += `<button
                        data-racer-id="${racer.id}"
                        data-param="${paramKey}"
                        data-value="${val}"
                        class="ctrl-btn w-4 h-4 rounded-sm text-[8px] font-bold ${isActive ? 'active' : 'opacity-40'}"
                        style="background-color: ${isActive ? color : 'rgba(255,255,255,0.2)'}; color: ${isActive ? 'white' : 'rgba(255,255,255,0.5)'}"
                        title="${paramKey} ${i + 1}">${i + 1}</button>`;
                });
                html += '</div>';
                return html;
            };

            card.innerHTML = `
                <!-- Header: Name + Bike -->
                <div class="flex items-center justify-between cursor-pointer pilot-header" data-racer-id="${racer.id}">
                    <div class="flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full" style="background-color: ${racer.color}"></span>
                        <span class="text-[10px] font-bold text-white truncate max-w-[60px]">${racer.name}</span>
                        ${isSelected ? '<span class="text-[8px]">👁️</span>' : ''}
                    </div>
                    <span class="text-sm" title="${archetype ? archetype.name : ''}">${bikeIcon}</span>
                </div>

                <!-- Resource Bars -->
                <div class="flex gap-1">
                    <div class="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden" title="Tires ${tirePercent}%">
                        <div class="resource-bar h-full rounded-full ${tirePercent > 50 ? 'bg-green-500' : tirePercent > 20 ? 'bg-yellow-500' : 'bg-red-500'}" style="width: ${tirePercent}%"></div>
                    </div>
                    <div class="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden" title="Fuel ${fuelPercent}%">
                        <div class="resource-bar h-full rounded-full ${fuelPercent > 50 ? 'bg-yellow-500' : fuelPercent > 20 ? 'bg-orange-500' : 'bg-red-500'}" style="width: ${fuelPercent}%"></div>
                    </div>
                </div>

                <!-- Controls: T, E, R -->
                <div class="flex flex-col gap-0.5">
                    ${createControlRow('T', 'tireAggression', params.tireAggression)}
                    ${createControlRow('E', 'engineMap', params.engineMap)}
                    ${createControlRow('R', 'risk', params.risk)}
                </div>
            `;

            this.containerEl.appendChild(card);
        });

        // Attach event handlers
        this.attachEventHandlers(callbacks);
    }

    /**
     * Attaches event handlers to the controls
     */
    attachEventHandlers(callbacks) {
        if (!this.containerEl) {
            return;
        }

        // Pilot selection handlers
        if (callbacks.onSelectPilot) {
            this.containerEl.querySelectorAll('.pilot-header[data-racer-id]').forEach(header => {
                const racerId = parseInt(header.getAttribute('data-racer-id'));
                header.addEventListener('click', () => callbacks.onSelectPilot(racerId));
            });
        }

        // Parameter update handlers
        if (callbacks.onUpdateParam) {
            this.containerEl.querySelectorAll('button[data-racer-id][data-param][data-value]').forEach(button => {
                const racerId = parseInt(button.getAttribute('data-racer-id'));
                const param = button.getAttribute('data-param');
                const value = parseInt(button.getAttribute('data-value'));
                button.addEventListener('click', () => callbacks.onUpdateParam(racerId, param, value));
            });
        }
    }
}
