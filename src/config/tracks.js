// --- Track Definitions ---
// Extracted from index.html lines 127-265

import { STEP_SIZE } from './gameConfig.js';

// --- START LINE CONFIGURATION ---
export function getStartLine(type) {
    if (type === 'general-roca') {
        // Start line from assets/tracks/GeneralRoca_path1.json
        return {
            p1: { x: 1988, y: 427 },
            p2: { x: 1948, y: 344 },
            center: { x: 1968, y: 385.5 },
            forwardVector: { x: 0.9008444880292465, y: -0.43414192194180556 }
        };
    } else {
        // Fallback - calculate from first path point
        return null;
    }
}

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
        // Data from assets/tracks/GeneralRoca_path1.json (Patagonian Track Editor)
        return [
            {x: 2279, y: 315, handleIn: {x: -60, y: 24}, handleOut: {x: 60, y: -24}},
            {x: 2480, y: 421, handleIn: {x: -41, y: -97}, handleOut: {x: 41, y: 97}},
            {x: 2415, y: 640, handleIn: {x: 82, y: -66}, handleOut: {x: -82, y: 66}},
            {x: 1934, y: 721, handleIn: {x: 144, y: -24}, handleOut: {x: -144, y: 24}},
            {x: 1352, y: 746, handleIn: {x: 103, y: -24}, handleOut: {x: -103, y: 24}},
            {x: 1244, y: 827, handleIn: {x: 29, y: -61}, handleOut: {x: -29, y: 61}},
            {x: 1256, y: 949, handleIn: {x: -64, y: -66}, handleOut: {x: 64, y: 66}},
            {x: 1458, y: 1046, handleIn: {x: -160, y: -10}, handleOut: {x: 160, y: 10}},
            {x: 2327, y: 1080, handleIn: {x: -140, y: -35}, handleOut: {x: 140, y: 35}},
            {x: 2393, y: 1163, handleIn: {x: 14, y: -60}, handleOut: {x: -14, y: 60}},
            {x: 2281, y: 1280, handleIn: {x: 111, y: -35}, handleOut: {x: -111, y: 35}},
            {x: 1653, y: 1306, handleIn: {x: 188, y: -7}, handleOut: {x: -188, y: 7}},
            {x: 956, y: 1325, handleIn: {x: 209, y: 6}, handleOut: {x: -209, y: -6}},
            {x: 336, y: 1285, handleIn: {x: 186, y: 32}, handleOut: {x: -186, y: -32}},
            {x: 259, y: 1115, handleIn: {x: -43, y: 100}, handleOut: {x: 43, y: -100}},
            {x: 402, y: 953, handleIn: {x: -60, y: 49}, handleOut: {x: 60, y: -49}},
            {x: 461, y: 824, handleIn: {x: -18, y: 111}, handleOut: {x: 18, y: -111}},
            {x: 435, y: 453, handleIn: {x: -38, y: 161}, handleOut: {x: 38, y: -161}},
            {x: 309, y: 288, handleIn: {x: 1, y: 80}, handleOut: {x: -1, y: -80}},
            {x: 420, y: 187, handleIn: {x: -94, y: 0}, handleOut: {x: 94, y: 0}},
            {x: 623, y: 290, handleIn: {x: -48, y: -79}, handleOut: {x: 48, y: 79}},
            {x: 686, y: 513, handleIn: {x: 15, y: -98}, handleOut: {x: -15, y: 98}},
            {x: 572, y: 883, handleIn: {x: -6, y: -178}, handleOut: {x: 6, y: 178}},
            {x: 565, y: 1052, handleIn: {x: -40, y: -65}, handleOut: {x: 40, y: 65}},
            {x: 705, y: 1101, handleIn: {x: -77, y: 59}, handleOut: {x: 77, y: -59}},
            {x: 962, y: 856, handleIn: {x: -55, y: 73}, handleOut: {x: 55, y: -73}},
            {x: 1147, y: 690, handleIn: {x: -93, y: 50}, handleOut: {x: 93, y: -50}},
            {x: 1456, y: 550, handleIn: {x: -152, y: 42}, handleOut: {x: 152, y: -42}},
            {x: 1961, y: 387, handleIn: {x: -95, y: -21}, handleOut: {x: 95, y: 21}}
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
