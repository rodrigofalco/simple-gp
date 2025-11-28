/**
 * TrackEditor - Handles debug mode bezier curve editing for racing game tracks
 *
 * This module manages interactive editing of bezier curve control points and handles.
 * It allows dragging anchor points and control handles to modify the racing line in real-time.
 *
 * @module TrackEditor
 */

/**
 * TrackEditor class for interactive bezier curve editing
 */
export class TrackEditor {
    /**
     * Creates a TrackEditor instance
     * @param {Object} session - Reference to the RaceSession containing track data
     */
    constructor(session) {
        this.session = session;
        this.dragTarget = null;
        this.enabled = false;

        // Bind event handlers to preserve 'this' context
        this._handleMouseDown = this.onMouseDown.bind(this);
        this._handleMouseMove = this.onMouseMove.bind(this);
        this._handleMouseUp = this.onMouseUp.bind(this);
    }

    /**
     * Enable the track editor by attaching event listeners
     */
    enable() {
        if (this.enabled) return;

        const canvas = this.session.canvas;
        if (!canvas) {
            console.warn('TrackEditor: Cannot enable - session has no canvas');
            return;
        }

        console.log('TrackEditor: Enabling editor', {
            canvas: !!canvas,
            camera: !!this.session.camera,
            bezierNodes: this.session.bezierNodes?.length
        });

        canvas.addEventListener('mousedown', this._handleMouseDown);
        canvas.addEventListener('mousemove', this._handleMouseMove);
        canvas.addEventListener('mouseup', this._handleMouseUp);

        this.enabled = true;
    }

    /**
     * Disable the track editor by removing event listeners
     */
    disable() {
        if (!this.enabled) return;

        const canvas = this.session.canvas;
        if (!canvas) return;

        canvas.removeEventListener('mousedown', this._handleMouseDown);
        canvas.removeEventListener('mousemove', this._handleMouseMove);
        canvas.removeEventListener('mouseup', this._handleMouseUp);

        this.enabled = false;
        this.dragTarget = null;

        // Reset cursor
        if (canvas) {
            canvas.style.cursor = 'default';
        }
    }

    /**
     * Get mouse position in world coordinates (accounting for canvas scaling and camera offset)
     * @param {MouseEvent} e - The mouse event
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @param {Object} camera - Camera object with x, y properties
     * @returns {Object} Mouse position with x, y properties in world coordinates
     */
    getMousePos(e, canvas, camera) {
        const rect = canvas.getBoundingClientRect();
        const sx = canvas.width / rect.width;
        const sy = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * sx + camera.x,
            y: (e.clientY - rect.top) * sy + camera.y
        };
    }

    /**
     * Handle mouse down event - detect and start dragging bezier nodes or handles
     * @param {MouseEvent} e - The mouse event
     */
    onMouseDown(e) {
        console.log('TrackEditor: mousedown', {
            camera: this.session.camera,
            cameraX: this.session.camera?.x,
            cameraY: this.session.camera?.y
        });
        const m = this.getMousePos(e, this.session.canvas, this.session.camera);
        console.log('TrackEditor: mouse position', m);
        const nodes = this.session.bezierNodes;

        // Check each node for proximity to mouse click
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];

            // Check handleIn (input control handle)
            const handleInX = n.x + n.handleIn.x;
            const handleInY = n.y + n.handleIn.y;
            if (Math.hypot(handleInX - m.x, handleInY - m.y) < 15) {
                this.dragTarget = { type: 'in', index: i };
                return;
            }

            // Check handleOut (output control handle)
            const handleOutX = n.x + n.handleOut.x;
            const handleOutY = n.y + n.handleOut.y;
            if (Math.hypot(handleOutX - m.x, handleOutY - m.y) < 15) {
                this.dragTarget = { type: 'out', index: i };
                return;
            }

            // Check anchor point (node position)
            const distToAnchor = Math.hypot(n.x - m.x, n.y - m.y);
            console.log(`Node ${i}: anchor at (${n.x}, ${n.y}), dist: ${distToAnchor.toFixed(1)}`);
            if (distToAnchor < 15) {
                this.dragTarget = { type: 'anchor', index: i };
                console.log('TrackEditor: Started dragging anchor', i);
                return;
            }
        }
        console.log('TrackEditor: No node found near click');
    }

    /**
     * Handle mouse move event - update cursor and drag nodes/handles
     * @param {MouseEvent} e - The mouse event
     */
    onMouseMove(e) {
        const canvas = this.session.canvas;

        // Update cursor based on drag state
        if (this.dragTarget) {
            canvas.style.cursor = 'grabbing';

            const m = this.getMousePos(e, canvas, this.session.camera);
            const node = this.session.bezierNodes[this.dragTarget.index];

            // Update position based on what's being dragged
            if (this.dragTarget.type === 'anchor') {
                // Move the entire anchor point
                node.x = m.x;
                node.y = m.y;
            } else if (this.dragTarget.type === 'in') {
                // Move the input control handle (relative to anchor)
                node.handleIn.x = m.x - node.x;
                node.handleIn.y = m.y - node.y;
            } else if (this.dragTarget.type === 'out') {
                // Move the output control handle (relative to anchor)
                node.handleOut.x = m.x - node.x;
                node.handleOut.y = m.y - node.y;
            }

            // Regenerate racing path from modified bezier nodes
            if (this.session.generateRacingLineFromNodes) {
                this.session.racingPath = this.session.generateRacingLineFromNodes(this.session.bezierNodes);
            }
        } else {
            // Show pointer cursor when hovering over editable elements
            canvas.style.cursor = 'pointer';
        }
    }

    /**
     * Handle mouse up event - stop dragging
     */
    onMouseUp() {
        this.dragTarget = null;

        if (this.session.canvas) {
            this.session.canvas.style.cursor = 'pointer';
        }
    }
}

export default TrackEditor;
