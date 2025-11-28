/**
 * RaceCountdown - Animated countdown overlay for race start
 * Shows 3, 2, 1, GO! with animations
 */
export class RaceCountdown {
    constructor(containerElementId = 'gameContainer') {
        this.containerEl = document.getElementById(containerElementId);
        this.overlayEl = null;
        this.isRunning = false;
        this.timeoutIds = [];
    }

    /**
     * Injects required CSS styles for animations
     */
    injectStyles() {
        if (document.getElementById('countdown-styles')) {
            return;
        }

        const styleEl = document.createElement('style');
        styleEl.id = 'countdown-styles';
        styleEl.textContent = `
            @keyframes countdown-enter {
                0% {
                    transform: scale(3) rotate(-10deg);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.1) rotate(2deg);
                    opacity: 1;
                }
                100% {
                    transform: scale(1) rotate(0deg);
                    opacity: 1;
                }
            }

            @keyframes countdown-exit {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                100% {
                    transform: scale(0.5) translateY(-50px);
                    opacity: 0;
                }
            }

            @keyframes countdown-go {
                0% {
                    transform: scale(0) rotate(-180deg);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.3) rotate(10deg);
                    opacity: 1;
                }
                70% {
                    transform: scale(0.95) rotate(-5deg);
                }
                100% {
                    transform: scale(1) rotate(0deg);
                    opacity: 1;
                }
            }

            @keyframes countdown-go-exit {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                100% {
                    transform: scale(2) translateY(-100px);
                    opacity: 0;
                }
            }

            @keyframes countdown-pulse {
                0%, 100% {
                    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
                }
                50% {
                    box-shadow: 0 0 0 20px rgba(255, 255, 255, 0);
                }
            }

            @keyframes overlay-fade-out {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }

            .countdown-number {
                animation: countdown-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }

            .countdown-number-exit {
                animation: countdown-exit 0.3s ease-in forwards;
            }

            .countdown-go {
                animation: countdown-go 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }

            .countdown-go-exit {
                animation: countdown-go-exit 0.5s ease-in forwards;
            }

            .countdown-overlay-exit {
                animation: overlay-fade-out 0.3s ease-out forwards;
            }
        `;
        document.head.appendChild(styleEl);
    }

    /**
     * Creates the overlay element
     */
    createOverlay() {
        this.injectStyles();

        if (this.overlayEl) {
            this.overlayEl.remove();
        }

        this.overlayEl = document.createElement('div');
        this.overlayEl.id = 'countdown-overlay';
        this.overlayEl.className = 'absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
        this.overlayEl.innerHTML = `
            <div id="countdown-content" class="flex flex-col items-center">
                <div id="countdown-number" class="text-[150px] font-black text-white drop-shadow-2xl"></div>
                <div id="countdown-label" class="text-2xl font-bold text-white/80 uppercase tracking-widest mt-4"></div>
            </div>
        `;

        if (this.containerEl) {
            this.containerEl.appendChild(this.overlayEl);
        }
    }

    /**
     * Shows a countdown step
     * @param {string} value - The value to display
     * @param {string} color - Text color class
     * @param {string} label - Optional label text
     * @param {boolean} isGo - Whether this is the GO! step
     */
    showStep(value, color, label = '', isGo = false) {
        const numberEl = document.getElementById('countdown-number');
        const labelEl = document.getElementById('countdown-label');

        if (numberEl) {
            numberEl.textContent = value;
            numberEl.className = `text-[150px] font-black drop-shadow-2xl ${color} ${isGo ? 'countdown-go' : 'countdown-number'}`;
        }

        if (labelEl) {
            labelEl.textContent = label;
            labelEl.className = `text-2xl font-bold uppercase tracking-widest mt-4 ${label ? 'text-white/80' : 'text-transparent'}`;
        }
    }

    /**
     * Exits current step with animation
     * @param {boolean} isGo - Whether this is the GO! step
     */
    exitStep(isGo = false) {
        const numberEl = document.getElementById('countdown-number');
        if (numberEl) {
            numberEl.classList.remove('countdown-number', 'countdown-go');
            numberEl.classList.add(isGo ? 'countdown-go-exit' : 'countdown-number-exit');
        }
    }

    /**
     * Starts the countdown sequence
     * @param {Function} onComplete - Called when countdown finishes
     * @param {Function} onStep - Called for each step (step: 3, 2, 1, 'go')
     */
    start(onComplete, onStep) {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;

        // Clear any existing timeouts
        this.clearTimeouts();

        // Create overlay
        this.createOverlay();

        const steps = [
            { value: '3', color: 'text-red-500', label: 'Preparados...', delay: 0 },
            { value: '2', color: 'text-yellow-500', label: 'Listos...', delay: 1000 },
            { value: '1', color: 'text-green-400', label: '¡Casi!', delay: 2000 },
            { value: '¡GO!', color: 'text-green-400', label: '', delay: 3000, isGo: true }
        ];

        steps.forEach((step, index) => {
            // Show step
            const showTimeout = setTimeout(() => {
                this.showStep(step.value, step.color, step.label, step.isGo);
                if (onStep) {
                    onStep(step.isGo ? 'go' : parseInt(step.value));
                }
            }, step.delay);
            this.timeoutIds.push(showTimeout);

            // Exit animation (not for last step)
            if (index < steps.length - 1) {
                const exitTimeout = setTimeout(() => {
                    this.exitStep(false);
                }, step.delay + 700);
                this.timeoutIds.push(exitTimeout);
            }
        });

        // Finish sequence
        const finishTimeout = setTimeout(() => {
            this.exitStep(true);
        }, 3600);
        this.timeoutIds.push(finishTimeout);

        // Remove overlay
        const removeTimeout = setTimeout(() => {
            if (this.overlayEl) {
                this.overlayEl.classList.add('countdown-overlay-exit');
            }
        }, 4000);
        this.timeoutIds.push(removeTimeout);

        // Complete callback and cleanup
        const completeTimeout = setTimeout(() => {
            this.stop();
            if (onComplete) {
                onComplete();
            }
        }, 4300);
        this.timeoutIds.push(completeTimeout);
    }

    /**
     * Clears all pending timeouts
     */
    clearTimeouts() {
        this.timeoutIds.forEach(id => clearTimeout(id));
        this.timeoutIds = [];
    }

    /**
     * Stops the countdown and removes overlay
     */
    stop() {
        this.clearTimeouts();
        this.isRunning = false;

        if (this.overlayEl) {
            this.overlayEl.remove();
            this.overlayEl = null;
        }
    }

    /**
     * Destroys the countdown component
     */
    destroy() {
        this.stop();
    }
}
