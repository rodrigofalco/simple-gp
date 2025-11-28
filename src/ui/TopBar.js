/**
 * Top Bar UI Component
 * Renders and manages the top navigation bar with track selection and controls
 */
import { AVAILABLE_TRACKS, DEFAULT_TRACK } from '../config/tracks.js';

export class TopBar {
    constructor(containerElementId = 'topBarContainer') {
        this.containerEl = document.getElementById(containerElementId);
        this.currentTrack = DEFAULT_TRACK;
    }

    /**
     * Renders the top bar HTML
     * @param {Object} config - Configuration object
     * @param {string} config.title - Title to display
     * @param {string} config.defaultTrack - Default track ID
     */
    render(config = {}) {
        const title = config.title || 'GP Vector Manager';
        this.currentTrack = config.defaultTrack || DEFAULT_TRACK;

        // Build track options
        const trackOptions = AVAILABLE_TRACKS.map(track =>
            `<option value="${track.id}" ${track.id === this.currentTrack ? 'selected' : ''}>${track.icon} ${track.name}</option>`
        ).join('');

        const html = `
            <div class="flex-shrink-0 flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <h1 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                    🏍️ <span>${title}</span>
                </h1>
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2">
                        <label for="trackSelect" class="text-sm text-gray-600 font-medium">Pista:</label>
                        <select id="trackSelect" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 py-1.5 px-3 cursor-pointer">
                            ${trackOptions}
                        </select>
                    </div>

                    <div class="w-px h-6 bg-gray-300"></div>

                    <button id="pauseBtn" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1.5 px-4 rounded shadow-sm text-sm w-24 text-center">
                        ⏸️ Pausa
                    </button>

                    <div class="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors">
                        <input type="checkbox" id="debugMode" class="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer">
                        <label for="debugMode" class="text-sm text-red-700 font-bold cursor-pointer select-none">Editar Trazada</label>
                    </div>

                    <button id="restartBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded shadow-sm text-sm transition-transform active:scale-95 flex items-center gap-2">
                        <span>🔄</span> Reiniciar
                    </button>
                </div>
            </div>
        `;

        if (this.containerEl) {
            this.containerEl.innerHTML = html;
        }

        return html;
    }

    /**
     * Binds event handlers to the top bar controls
     * @param {Object} handlers - Object containing event handler functions
     * @param {Function} handlers.onPauseToggle - Called when pause is toggled
     * @param {Function} handlers.onRestart - Called when restart is clicked
     * @param {Function} handlers.onDebugToggle - Called when debug mode is toggled
     * @param {Function} handlers.onTrackChange - Called when track is changed
     */
    bindEventHandlers(handlers = {}) {
        const pauseBtn = document.getElementById('pauseBtn');
        const restartBtn = document.getElementById('restartBtn');
        const debugMode = document.getElementById('debugMode');
        const trackSelect = document.getElementById('trackSelect');

        if (pauseBtn && handlers.onPauseToggle) {
            pauseBtn.addEventListener('click', () => handlers.onPauseToggle());
        }

        if (restartBtn && handlers.onRestart) {
            restartBtn.addEventListener('click', () => handlers.onRestart());
        }

        if (debugMode && handlers.onDebugToggle) {
            debugMode.addEventListener('change', (e) => handlers.onDebugToggle(e.target.checked));
        }

        if (trackSelect && handlers.onTrackChange) {
            trackSelect.addEventListener('change', (e) => {
                this.currentTrack = e.target.value;
                handlers.onTrackChange(e.target.value);
            });
        }
    }

    /**
     * Updates the pause button state
     * @param {boolean} isPaused - Whether the game is paused
     */
    updatePauseButton(isPaused) {
        const pauseBtn = document.getElementById('pauseBtn');
        if (!pauseBtn) return;

        if (isPaused) {
            pauseBtn.textContent = "▶️ Seguir";
            pauseBtn.className = "bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-4 rounded shadow-sm text-sm w-24 text-center";
        } else {
            pauseBtn.textContent = "⏸️ Pausa";
            pauseBtn.className = "bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1.5 px-4 rounded shadow-sm text-sm w-24 text-center";
        }
    }

    /**
     * Resets the pause button to default state
     */
    resetPauseButton() {
        this.updatePauseButton(false);
    }

}
