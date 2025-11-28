/**
 * Player Controls UI Component
 * Renders the strategy panel for player-controlled racers
 */
export class PlayerControls {
    constructor(containerElementId = 'playerControls') {
        this.containerEl = document.getElementById(containerElementId);
    }

    /**
     * Updates the player controls display
     * @param {Array} racers - Array of all racers
     * @param {Array} playerIndices - Array of indices for player-controlled racers
     * @param {Object} globalParams - Global parameters object keyed by racer ID
     * @param {number} selectedRacerId - Currently selected racer ID
     * @param {Object} callbacks - Object containing callback functions
     * @param {Function} callbacks.onSelectPilot - Called when a pilot is selected
     * @param {Function} callbacks.onUpdateParam - Called when a parameter is updated
     */
    update(racers, playerIndices, globalParams, selectedRacerId, callbacks) {
        if (!this.containerEl || racers.length === 0) return;

        this.containerEl.innerHTML = '';

        playerIndices.forEach(index => {
            const racer = racers[index];
            if (!racer) return;

            const params = globalParams[racer.id];
            const isSelected = (racer.id === selectedRacerId);

            const panel = document.createElement('div');
            panel.className = `border-l-4 p-3 bg-gray-50 rounded-r shadow-sm transition-all ${isSelected ? 'ring-2 ring-blue-400 bg-blue-50' : 'hover:bg-gray-100'}`;
            panel.style.borderColor = racer.color;

            const optionValues = [20, 40, 60, 80, 100];

            const createButtonRow = (label, paramKey, currentVal) => {
                let btnsHtml = `<div class="flex gap-1">`;
                optionValues.forEach((val, i) => {
                    const isActive = val === currentVal;
                    let colorClass = isActive
                        ? (i >= 3 ? "bg-red-500 text-white" : (i === 2 ? "bg-blue-600 text-white" : "bg-green-600 text-white"))
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300";
                    btnsHtml += `<button data-racer-id="${racer.id}" data-param="${paramKey}" data-value="${val}" class="flex-1 py-1 text-[10px] font-bold rounded ${colorClass}">${i + 1}</button>`;
                });
                return `<div><div class="flex justify-between text-[10px] text-gray-500 mb-0.5"><span class="uppercase font-semibold tracking-wide">${label}</span></div>${btnsHtml}</div></div>`;
            };

            // Get bike archetype info
            const archetype = racer.getBikeArchetype ? racer.getBikeArchetype() : null;
            const bikeIcon = archetype ? archetype.icon : '';
            const bikeName = archetype ? archetype.name : '';

            panel.innerHTML = `
                <div class="flex justify-between items-center mb-2 cursor-pointer select-none pilot-header" data-racer-id="${racer.id}">
                    <div class="font-bold text-gray-800 flex items-center text-sm">
                        <span class="w-2.5 h-2.5 rounded-full mr-2" style="background-color: ${racer.color}"></span>
                        ${racer.name} ${isSelected ? '👁️' : ''}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-lg" title="${bikeName}: ${archetype ? archetype.description : ''}">${bikeIcon}</span>
                        <span class="text-[10px] text-gray-400 font-mono">#${racer.racingNumber}</span>
                    </div>
                </div>
                <div class="space-y-2">
                    ${createButtonRow("Neumáticos", "tireAggression", params.tireAggression)}
                    ${createButtonRow("Motor", "engineMap", params.engineMap)}
                    ${createButtonRow("Riesgo", "risk", params.risk)}
                </div>
                <div class="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                    <div class="bg-white p-1.5 rounded border">
                        <div class="text-gray-400">Neumáticos</div><div class="h-1 w-full bg-gray-100 mt-0.5 rounded"><div class="h-full bg-green-500 transition-all duration-500" style="width: ${racer.tires}%"></div></div>
                    </div>
                    <div class="bg-white p-1.5 rounded border">
                        <div class="text-gray-400">Combustible</div><div class="h-1 w-full bg-gray-100 mt-0.5 rounded"><div class="h-full bg-yellow-500 transition-all duration-500" style="width: ${racer.fuel}%"></div></div>
                    </div>
                </div>
            `;

            this.containerEl.appendChild(panel);
        });

        // Attach event handlers
        this.attachEventHandlers(callbacks);
    }

    /**
     * Attaches event handlers to the controls
     * @param {Object} callbacks - Object containing callback functions
     */
    attachEventHandlers(callbacks) {
        if (!this.containerEl) return;

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
