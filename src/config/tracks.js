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
        // Bezier nodes for General Roca circuit based on the actual track layout
        // The circuit is viewed from above, coordinates map to the image
        // Start at the finish line (top right area) and follow the circuit counter-clockwise
        return [
            // Start/Finish Area (top right)
            {x: 590, y: 120, handleIn: {x: -50, y: 0}, handleOut: {x: 50, y: 0}},

            // Top Left Turn
            {x: 450, y: 120, handleIn: {x: -50, y: 0}, handleOut: {x: 30, y: 0}},
            {x: 350, y: 180, handleIn: {x: 0, y: -40}, handleOut: {x: 0, y: 40}},

            // Left Side High Turns
            {x: 280, y: 220, handleIn: {x: 30, y: 0}, handleOut: {x: -50, y: 0}},
            {x: 180, y: 200, handleIn: {x: 50, y: 0}, handleOut: {x: -30, y: 0}},
            {x: 150, y: 260, handleIn: {x: 0, y: -40}, handleOut: {x: 0, y: 40}},

            // Left Side Lower Turns
            {x: 180, y: 340, handleIn: {x: 30, y: 0}, handleOut: {x: -50, y: 0}},
            {x: 280, y: 380, handleIn: {x: 50, y: 0}, handleOut: {x: -30, y: 0}},

            // Bottom Left Straight
            {x: 320, y: 380, handleIn: {x: 0, y: 0}, handleOut: {x: 0, y: 0}},

            // Bottom Section
            {x: 450, y: 380, handleIn: {x: -30, y: 0}, handleOut: {x: 30, y: 0}},
            {x: 590, y: 340, handleIn: {x: 0, y: 40}, handleOut: {x: 0, y: -40}},

            // Right Side
            {x: 620, y: 280, handleIn: {x: 30, y: 0}, handleOut: {x: -30, y: 0}},
            {x: 600, y: 200, handleIn: {x: 0, y: 40}, handleOut: {x: 0, y: -40}}
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
