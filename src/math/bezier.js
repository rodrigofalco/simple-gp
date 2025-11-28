/**
 * Bezier curve utilities for generating smooth racing lines.
 * Uses cubic Bezier splines to create racing paths from control nodes.
 * @module math/bezier
 */

/**
 * Calculates a point on a cubic Bezier curve at parameter t.
 * Uses the cubic Bezier formula:
 * B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
 *
 * @param {{x: number, y: number}} p0 - Start anchor point
 * @param {{x: number, y: number}} cp1 - First control point
 * @param {{x: number, y: number}} cp2 - Second control point
 * @param {{x: number, y: number}} p3 - End anchor point
 * @param {number} t - Parameter from 0 to 1 (0 = start, 1 = end)
 * @returns {{x: number, y: number}} Point on the Bezier curve
 *
 * @example
 * const start = { x: 0, y: 0 };
 * const cp1 = { x: 10, y: 20 };
 * const cp2 = { x: 30, y: 20 };
 * const end = { x: 40, y: 0 };
 * const midpoint = getBezierPoint(start, cp1, cp2, end, 0.5);
 * // midpoint is approximately { x: 20, y: 15 }
 */
export function getBezierPoint(p0, cp1, cp2, p3, t) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
    const x = mt3 * p0.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * p3.x;
    const y = mt3 * p0.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * p3.y;
    return { x, y };
}

/**
 * Generates a smooth racing line from an array of Bezier curve nodes.
 * Each node contains an anchor point and two handle points (handleIn, handleOut).
 * The function connects nodes in sequence, forming a closed loop.
 *
 * Node structure:
 * {
 *   x: number,        // Anchor point x
 *   y: number,        // Anchor point y
 *   handleIn: { x: number, y: number },   // Incoming control point offset
 *   handleOut: { x: number, y: number }   // Outgoing control point offset
 * }
 *
 * @param {Array<{x: number, y: number, handleIn: {x: number, y: number}, handleOut: {x: number, y: number}}>} nodes
 *   Array of Bezier nodes defining the racing line
 * @returns {Array<{x: number, y: number}>} Array of points forming the racing line path
 *
 * @example
 * const nodes = [
 *   { x: 100, y: 100, handleIn: { x: -20, y: 0 }, handleOut: { x: 20, y: 0 } },
 *   { x: 200, y: 150, handleIn: { x: -20, y: 0 }, handleOut: { x: 20, y: 0 } },
 *   { x: 150, y: 200, handleIn: { x: 0, y: -20 }, handleOut: { x: 0, y: 20 } }
 * ];
 * const racingLine = generateRacingLineFromNodes(nodes);
 * // Returns ~180 points (3 nodes × 60 points per segment)
 */
export function generateRacingLineFromNodes(nodes) {
    let path = [];
    const pointsPerSegment = 60;

    for (let i = 0; i < nodes.length; i++) {
        const curr = nodes[i];
        const next = nodes[(i + 1) % nodes.length];

        // Anchor points
        const p0 = { x: curr.x, y: curr.y };
        const p3 = { x: next.x, y: next.y };

        // Control points (handle offsets are relative to anchor)
        const cp1 = { x: curr.x + curr.handleOut.x, y: curr.y + curr.handleOut.y };
        const cp2 = { x: next.x + next.handleIn.x, y: next.y + next.handleIn.y };

        // Sample the Bezier curve
        for (let j = 0; j < pointsPerSegment; j++) {
            const t = j / pointsPerSegment;
            path.push(getBezierPoint(p0, cp1, cp2, p3, t));
        }
    }

    return path;
}
