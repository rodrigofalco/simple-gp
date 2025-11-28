/**
 * Scoreboard UI Component
 * Renders the race position list with racer status and position change animations
 */
export class Scoreboard {
    constructor(scoreboardElementId = 'scoreboard', lapCountElementId = 'lapCount', totalLapsElementId = 'totalLapsDisplay') {
        this.scoreboardEl = document.getElementById(scoreboardElementId);
        this.lapCountEl = document.getElementById(lapCountElementId);
        this.totalLapsEl = document.getElementById(totalLapsElementId);
        this.previousPositions = new Map(); // Track position changes
        this.injectStyles();
    }

    /**
     * Injects CSS for position change animations
     */
    injectStyles() {
        if (document.getElementById('scoreboard-styles')) {
            return;
        }

        const styleEl = document.createElement('style');
        styleEl.id = 'scoreboard-styles';
        styleEl.textContent = `
            @keyframes position-up {
                0% { background-color: rgba(34, 197, 94, 0.3); transform: translateX(-3px); }
                100% { background-color: transparent; transform: translateX(0); }
            }
            @keyframes position-down {
                0% { background-color: rgba(239, 68, 68, 0.3); transform: translateX(3px); }
                100% { background-color: transparent; transform: translateX(0); }
            }
            @keyframes finish-pulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                50% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
            }
            .scoreboard-item {
                transition: all 0.2s ease-out;
            }
            .scoreboard-item:hover {
                transform: translateX(2px);
                background-color: rgba(59, 130, 246, 0.05);
            }
            .position-gained {
                animation: position-up 0.5s ease-out;
            }
            .position-lost {
                animation: position-down 0.5s ease-out;
            }
            .racer-finished {
                animation: finish-pulse 1s ease-in-out 3;
            }
            .position-badge {
                transition: all 0.2s ease;
            }
            .position-1 { color: #eab308; font-weight: 800; }
            .position-2 { color: #9ca3af; font-weight: 700; }
            .position-3 { color: #cd7f32; font-weight: 700; }
        `;
        document.head.appendChild(styleEl);
    }

    /**
     * Gets position badge styling based on position
     * @param {number} position - Race position (1-based)
     * @returns {string} CSS classes for position badge
     */
    getPositionStyle(position) {
        if (position === 1) {
            return 'position-1';
        }
        if (position === 2) {
            return 'position-2';
        }
        if (position === 3) {
            return 'position-3';
        }
        return 'text-gray-400';
    }

    /**
     * Updates the scoreboard display
     * @param {Array} racers - Array of racer objects
     * @param {number} totalLaps - Total laps in the race
     * @param {number} selectedRacerId - Currently selected racer ID
     * @param {Function} onSelectPilot - Callback when a pilot is selected
     */
    update(racers, totalLaps, selectedRacerId, onSelectPilot) {
        if (!this.scoreboardEl || racers.length === 0) {
            return;
        }

        // Sort racers by position
        const sorted = [...racers].sort((a, b) => {
            if (a.finished && b.finished) {
                return a.finishTime - b.finishTime;
            }
            if (a.finished !== b.finished) {
                return a.finished ? -1 : 1;
            }
            return b.progress - a.progress;
        });

        // Build HTML for scoreboard
        let html = '';
        sorted.forEach((r, idx) => {
            const position = idx + 1;
            const previousPosition = this.previousPositions.get(r.id);

            // Determine position change animation
            let positionChangeClass = '';
            if (previousPosition !== undefined) {
                if (position < previousPosition) {
                    positionChangeClass = 'position-gained';
                } else if (position > previousPosition) {
                    positionChangeClass = 'position-lost';
                }
            }

            // Update stored position
            this.previousPositions.set(r.id, position);

            const highlight = r.id === selectedRacerId ? 'bg-blue-50 border-blue-300 shadow-sm' : 'border-gray-100 hover:border-gray-200';
            const playerIndicator = r.isPlayer ? `<span class="border-l-4 rounded-l" style="border-color:${r.color}"></span>` : '';

            // Get bike archetype info
            const archetype = r.getBikeArchetype ? r.getBikeArchetype() : null;
            const bikeIcon = archetype ? archetype.icon : '';

            // Status with visual enhancements
            let status = `<span class="tabular-nums">${Math.max(1, r.lap)}/${totalLaps}</span>`;
            let finishedClass = '';
            if (r.finished) {
                status = `<span class="text-green-600 font-bold flex items-center gap-1">🏁 FIN</span>`;
                finishedClass = 'racer-finished';
            }

            // Position badge with medal icons for top 3
            let positionBadge = `<span class="w-5 font-bold text-center position-badge ${this.getPositionStyle(position)}">${position}</span>`;
            if (position === 1) {
                positionBadge = `<span class="w-5 text-center" title="1º Lugar">🥇</span>`;
            } else if (position === 2) {
                positionBadge = `<span class="w-5 text-center" title="2º Lugar">🥈</span>`;
            } else if (position === 3) {
                positionBadge = `<span class="w-5 text-center" title="3º Lugar">🥉</span>`;
            }

            html += `
            <li class="scoreboard-item flex justify-between items-center p-1.5 rounded bg-white border mb-1 text-xs gap-2 ${highlight} ${positionChangeClass} ${finishedClass}" data-racer-id="${r.id}" style="cursor:pointer">
                <div class="flex items-center min-w-0 flex-grow gap-2">
                    ${playerIndicator}
                    ${positionBadge}
                    <div class="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10" style="background-color: ${r.color}"></div>
                    <span class="text-sm" title="${archetype ? archetype.name + ': ' + archetype.description : ''}">${bikeIcon}</span>
                    <span class="w-6 font-mono text-gray-500 font-bold text-right text-[10px] bg-gray-50 px-1 rounded border border-gray-200">#${r.racingNumber}</span>
                    <span class="font-medium truncate text-gray-800 ${r.id === selectedRacerId ? 'text-blue-600 font-semibold' : ''}">${r.name}</span>
                    ${r.isPlayer ? '<span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold shadow-sm">TÚ</span>' : ''}
                </div>
                ${status}
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

        // Update lap counter with leader's lap
        if (this.lapCountEl && sorted.length > 0) {
            this.lapCountEl.textContent = Math.max(1, sorted[0].lap);
        }
        if (this.totalLapsEl) {
            this.totalLapsEl.textContent = totalLaps;
        }
    }

    /**
     * Resets position tracking (call on race restart)
     */
    resetPositions() {
        this.previousPositions.clear();
    }
}
