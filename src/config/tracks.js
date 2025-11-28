// --- Track Definitions ---
// Extracted from index.html lines 127-265

import { STEP_SIZE } from './gameConfig.js';

// --- GEOMETRY (Visual Track) ---
function addLine(path, x1, y1, x2, y2) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(dist / STEP_SIZE);
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        path.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
    }
}

function addArc(path, cx, cy, r, startAngle, endAngle) {
    let sweep = endAngle - startAngle;
    const len = Math.abs(sweep) * r;
    const steps = Math.ceil(len / STEP_SIZE);
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = startAngle + sweep * t;
        path.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
}

// --- 1. STATIC VISUAL TRACK DEFINITIONS ---
export function getVisualTrackPoints(type) {
    let p = [];
    if (type === 'general-roca') {
        // General Roca circuit - follows the racing line from bezier nodes
        // This visual path is now minimal since we rely on the background image
        // We return an empty path since we only want to see the background image
        return [];
    } else {
        // Fallback for any other track type
        const cx = 500, cy = 400, w = 600, h = 300, r = h/2;
        const lx = cx - w/4, rx = cx + w/4, ty = cy - r, by = cy + r, startOffset = 150;
        addLine(p, lx + startOffset, ty, rx, ty);
        addArc(p, rx, cy, r, -Math.PI/2, Math.PI/2);
        addLine(p, rx, by, lx, by);
        addArc(p, lx, cy, r, Math.PI/2, 3*Math.PI/2);
        addLine(p, lx, ty, lx + startOffset, ty);
    }
    return p;
}

// --- 2. DYNAMIC RACING LINE NODES (Editable) ---
export function getBezierNodes(type) {
    if (type === 'general-roca') {
        // Bezier nodes for General Roca circuit
        // Based on actual racing line from track image (yellow centerline)
        // Image resolution: 2752x1536
        // All nodes positioned within gray track surface boundaries
        // Convert normalized coordinates (0-100) to image coordinates (2752x1536)
        // Formula: imageX = (normalized / 100) * 2752, imageY = (normalized / 100) * 1536
        return [
            {x: 1595.76, y: 614.4, handleIn: {x: -100, y: -50}, handleOut: {x: 100, y: 50}},
            {x: 2201.6, y: 537.6, handleIn: {x: 50, y: 80}, handleOut: {x: -50, y: -80}},
            {x: 2559.36, y: 768, handleIn: {x: 70, y: 60}, handleOut: {x: -70, y: -60}},
            {x: 2064, y: 998.4, handleIn: {x: 80, y: -80}, handleOut: {x: -80, y: 80}},
            {x: 1376, y: 1075.2, handleIn: {x: -60, y: 40}, handleOut: {x: 60, y: -40}},
            {x: 2420.16, y: 1305.6, handleIn: {x: 50, y: 100}, handleOut: {x: -50, y: -100}},
            {x: 1376, y: 1411.2, handleIn: {x: -80, y: 60}, handleOut: {x: 80, y: -60}},
            {x: 275.2, y: 1228.8, handleIn: {x: -80, y: -100}, handleOut: {x: 80, y: 100}},
            {x: 496.32, y: 844.8, handleIn: {x: -60, y: -80}, handleOut: {x: 60, y: 80}},
            {x: 412.8, y: 384, handleIn: {x: -80, y: 50}, handleOut: {x: 80, y: -50}},
            {x: 1100.8, y: 691.2, handleIn: {x: 50, y: -80}, handleOut: {x: -50, y: 80}}
        ];
    } else {
        // Fallback stadium
        return [
            {x: 500, y: 250, handleIn: {x:-50, y:0}, handleOut: {x:50, y:0}},
            {x: 650, y: 250, handleIn: {x:-50, y:0}, handleOut: {x:50, y:0}},
            {x: 800, y: 400, handleIn: {x:0, y:-50}, handleOut: {x:0, y:50}},
            {x: 650, y: 550, handleIn: {x:50, y:0}, handleOut: {x:-50, y:0}},
            {x: 350, y: 550, handleIn: {x:50, y:0}, handleOut: {x:-50, y:0}},
            {x: 200, y: 400, handleIn: {x:0, y:50}, handleOut: {x:0, y:-50}},
            {x: 350, y: 250, handleIn: {x:-50, y:0}, handleOut: {x:50, y:0}}
        ];
    }
}
