/**
 * Geometry utility functions for generating track paths.
 * These functions create smooth lines and arcs for visual track rendering.
 * @module math/geometry
 */

const STEP_SIZE = 2;

/**
 * Adds a straight line segment to a path by interpolating between two points.
 * Points are added at regular intervals defined by STEP_SIZE.
 *
 * @param {Array<{x: number, y: number}>} path - The path array to append points to
 * @param {number} x1 - Starting x coordinate
 * @param {number} y1 - Starting y coordinate
 * @param {number} x2 - Ending x coordinate
 * @param {number} y2 - Ending y coordinate
 * @returns {void}
 *
 * @example
 * const path = [];
 * addLine(path, 0, 0, 100, 100);
 * // path now contains ~71 points forming a diagonal line
 */
export function addLine(path, x1, y1, x2, y2) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(dist / STEP_SIZE);
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        path.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
    }
}

/**
 * Adds an arc segment to a path by sampling points along a circular arc.
 * Points are spaced approximately STEP_SIZE apart along the arc.
 *
 * @param {Array<{x: number, y: number}>} path - The path array to append points to
 * @param {number} cx - Center x coordinate of the arc
 * @param {number} cy - Center y coordinate of the arc
 * @param {number} r - Radius of the arc
 * @param {number} startAngle - Starting angle in radians
 * @param {number} endAngle - Ending angle in radians
 * @returns {void}
 *
 * @example
 * const path = [];
 * // Create a quarter circle from 0 to π/2
 * addArc(path, 100, 100, 50, 0, Math.PI / 2);
 * // path now contains points forming a 90-degree arc
 */
export function addArc(path, cx, cy, r, startAngle, endAngle) {
    let sweep = endAngle - startAngle;
    const len = Math.abs(sweep) * r;
    const steps = Math.ceil(len / STEP_SIZE);
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = startAngle + sweep * t;
        path.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
}
