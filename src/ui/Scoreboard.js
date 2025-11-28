/**
 * Scoreboard UI Component
 * Renders the race position list with racer status
 */
export class Scoreboard {
    constructor(scoreboardElementId = 'scoreboard', lapCountElementId = 'lapCount', totalLapsElementId = 'totalLapsDisplay') {
        this.scoreboardEl = document.getElementById(scoreboardElementId);
        this.lapCountEl = document.getElementById(lapCountElementId);
        this.totalLapsEl = document.getElementById(totalLapsElementId);
    }

    /**
     * Updates the scoreboard display
     * @param {Array} racers - Array of racer objects
     * @param {number} totalLaps - Total laps in the race
     * @param {number} selectedRacerId - Currently selected racer ID
     * @param {Function} onSelectPilot - Callback when a pilot is selected
     */
    update(racers, totalLaps, selectedRacerId, onSelectPilot) {
        if (!this.scoreboardEl || racers.length === 0) return;

        // Sort racers by position
        const sorted = [...racers].sort((a, b) => {
            if (a.finished && b.finished) return a.finishTime - b.finishTime;
            if (a.finished !== b.finished) return a.finished ? -1 : 1;
            return b.progress - a.progress;
        });

        // Build HTML for scoreboard
        let html = '';
        sorted.forEach((r, idx) => {
            const highlight = r.id === selectedRacerId ? 'bg-blue-50 border-blue-200' : 'border-gray-100';
            const playerIndicator = r.isPlayer ? `<span class="border-l-4" style="border-color:${r.color}"></span>` : '';

            // Get bike archetype info
            const archetype = r.getBikeArchetype ? r.getBikeArchetype() : null;
            const bikeIcon = archetype ? archetype.icon : '';

            let status = `${r.lap}/${totalLaps}`;
            if (r.finished) status = `<span class="text-green-600 font-bold">FIN</span>`;

            html += `
            <li class="flex justify-between items-center p-1.5 rounded bg-white border mb-1 text-xs gap-2 ${highlight}" data-racer-id="${r.id}" style="cursor:pointer">
                <div class="flex items-center min-w-0 flex-grow gap-2">
                    ${playerIndicator}
                    <span class="w-4 font-bold text-gray-400 text-center">${idx + 1}</span>
                    <div class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: ${r.color}"></div>
                    <span class="text-sm" title="${archetype ? archetype.name : ''}">${bikeIcon}</span>
                    <span class="w-6 font-mono text-gray-500 font-bold text-right text-[10px] bg-gray-50 px-1 rounded border border-gray-200">#${r.racingNumber}</span>
                    <span class="font-medium truncate text-gray-800 ${r.id === selectedRacerId ? 'text-blue-600' : ''}">${r.name}</span>
                    ${r.isPlayer ? '<span class="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-bold">TU</span>' : ''}
                </div>
                <span class="font-mono text-gray-500">${status}</span>
            </li>`;
        });
        this.scoreboardEl.innerHTML = html;

        // Attach click handlers
        if (onSelectPilot) {
            this.scoreboardEl.querySelectorAll('li[data-racer-id]').forEach(li => {
                const racerId = parseInt(li.getAttribute('data-racer-id'));
                li.addEventListener('click', () => onSelectPilot(racerId));
            });
        }

        // Update lap counter
        if (this.lapCountEl && sorted.length > 0) {
            this.lapCountEl.textContent = sorted[0].lap;
        }
        if (this.totalLapsEl) {
            this.totalLapsEl.textContent = totalLaps;
        }
    }
}
