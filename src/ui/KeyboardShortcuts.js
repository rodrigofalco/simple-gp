/**
 * KeyboardShortcuts - Toggleable panel showing available keyboard controls
 */
export class KeyboardShortcuts {
    constructor(containerElementId = 'gameContainer') {
        this.containerEl = document.getElementById(containerElementId);
        this.panelEl = null;
        this.isVisible = false;
    }

    /**
     * Creates and renders the shortcuts panel
     */
    render() {
        if (this.panelEl) {
            this.panelEl.remove();
        }

        this.panelEl = document.createElement('div');
        this.panelEl.id = 'keyboard-shortcuts';
        this.panelEl.className = 'absolute bottom-4 right-4 z-20 transition-all duration-300';
        this.panelEl.innerHTML = `
            <!-- Toggle Button -->
            <button id="shortcuts-toggle" class="absolute bottom-0 right-0 w-10 h-10 bg-black/60 backdrop-blur-md rounded-lg border border-white/20 text-white hover:bg-black/80 transition-colors flex items-center justify-center" title="Atajos de teclado (?)">
                <span class="text-lg">⌨️</span>
            </button>

            <!-- Shortcuts Panel -->
            <div id="shortcuts-panel" class="hidden absolute bottom-12 right-0 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 shadow-xl p-4 min-w-[220px]">
                <div class="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                    <h3 class="text-sm font-bold text-white">Atajos de Teclado</h3>
                    <button id="shortcuts-close" class="text-gray-400 hover:text-white text-lg leading-none">&times;</button>
                </div>

                <div class="space-y-2 text-sm">
                    <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">Cámara</div>

                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">Alejar</span>
                        <kbd class="px-2 py-0.5 bg-gray-700 rounded text-xs font-mono text-white">Z</kbd>
                    </div>

                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">Acercar</span>
                        <kbd class="px-2 py-0.5 bg-gray-700 rounded text-xs font-mono text-white">X</kbd>
                    </div>

                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">Centrar pista</span>
                        <kbd class="px-2 py-0.5 bg-gray-700 rounded text-xs font-mono text-white">F</kbd>
                    </div>

                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">Zoom normal</span>
                        <kbd class="px-2 py-0.5 bg-gray-700 rounded text-xs font-mono text-white">1</kbd>
                    </div>

                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">Zoom con rueda</span>
                        <kbd class="px-2 py-0.5 bg-gray-700 rounded text-xs font-mono text-white">🖱️</kbd>
                    </div>

                    <div class="border-t border-white/10 my-3"></div>
                    <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">Juego</div>

                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">Pausa</span>
                        <kbd class="px-2 py-0.5 bg-gray-700 rounded text-xs font-mono text-white">Espacio</kbd>
                    </div>

                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">Ayuda</span>
                        <kbd class="px-2 py-0.5 bg-gray-700 rounded text-xs font-mono text-white">?</kbd>
                    </div>
                </div>

                <div class="mt-4 pt-3 border-t border-white/10">
                    <p class="text-[10px] text-gray-500 text-center">
                        Clic en piloto para seguir cámara
                    </p>
                </div>
            </div>
        `;

        if (this.containerEl) {
            this.containerEl.appendChild(this.panelEl);
        }

        this.setupEventListeners();
    }

    /**
     * Sets up click handlers for toggle and close buttons
     */
    setupEventListeners() {
        const toggleBtn = document.getElementById('shortcuts-toggle');
        const closeBtn = document.getElementById('shortcuts-close');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (this.isVisible && this.panelEl && !this.panelEl.contains(e.target)) {
                this.hide();
            }
        });

        // Toggle with ? key
        document.addEventListener('keydown', (e) => {
            if (e.key === '?' || (e.shiftKey && e.key === '/')) {
                e.preventDefault();
                this.toggle();
            }
            // Close with Escape
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Shows the shortcuts panel
     */
    show() {
        const panel = document.getElementById('shortcuts-panel');
        if (panel) {
            panel.classList.remove('hidden');
            this.isVisible = true;
        }
    }

    /**
     * Hides the shortcuts panel
     */
    hide() {
        const panel = document.getElementById('shortcuts-panel');
        if (panel) {
            panel.classList.add('hidden');
            this.isVisible = false;
        }
    }

    /**
     * Toggles the shortcuts panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Removes the panel from DOM
     */
    destroy() {
        if (this.panelEl) {
            this.panelEl.remove();
            this.panelEl = null;
        }
    }
}
