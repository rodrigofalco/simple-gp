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
    if (type === 'l-shape') {
        const R = 60, ox = 200, oy = 100;
        const startX = 400; const topY = 50 + oy; const rightX = 650; const midY = 200 + oy; const midX = 250 + ox; const botY = 350 + oy; const leftX = 50 + ox;
        addLine(p, startX, topY, rightX - R, topY);
        addArc(p, rightX - R, topY + R, R, -Math.PI/2, 0);
        addLine(p, rightX, topY + R, rightX, midY - R);
        addArc(p, rightX - R, midY - R, R, 0, Math.PI/2);
        addLine(p, rightX - R, midY, midX + R, midY);
        addArc(p, midX + R, midY + R, R, -Math.PI/2, -Math.PI);
        addLine(p, midX, midY + R, midX, botY - R);
        addArc(p, midX - R, botY - R, R, 0, Math.PI/2);
        addLine(p, midX - R, botY, leftX + R, botY);
        addArc(p, leftX + R, botY - R, R, Math.PI/2, Math.PI);
        addLine(p, leftX, botY - R, leftX, topY + R);
        addArc(p, leftX + R, topY + R, R, Math.PI, 3*Math.PI/2);
        addLine(p, leftX + R, topY, startX, topY);
    } else if (type === 's-curve') {
        const R = 80, ox = 200, oy = 200, startOffset = 200;
        addLine(p, ox+300 + startOffset, oy, ox+750, oy);
        addArc(p, ox+750, oy+R, R, -Math.PI/2, Math.PI/2);
        addLine(p, ox+750, oy+2*R, ox+500, oy+2*R);
        addArc(p, ox+500, oy+3*R, R, -Math.PI/2, -Math.PI);
        addLine(p, ox+500-R, oy+3*R, ox+500-R, oy+3.5*R);
        addArc(p, ox+500-2*R, oy+3.5*R, R, 0, Math.PI/2);
        addLine(p, ox+500-2*R, oy+4.5*R, ox+R, oy+4.5*R);
        addArc(p, ox+R, oy+3.5*R, R, Math.PI/2, -Math.PI/2);
        addLine(p, ox, oy+3.5*R, ox, oy+R);
        addArc(p, ox+R, oy+R, R, Math.PI, 3*Math.PI/2);
        addLine(p, ox+R, oy, ox+300 + startOffset, oy);
    } else {
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
    if (type === 'l-shape') {
        return [
            {x: 400, y: 150, handleIn: {x:-50, y:0}, handleOut: {x:50, y:0}},
            {x: 600, y: 150, handleIn: {x:-50, y:0}, handleOut: {x:30, y:0}},
            {x: 650, y: 200, handleIn: {x:0, y:-30}, handleOut: {x:0, y:30}},
            {x: 650, y: 250, handleIn: {x:0, y:-30}, handleOut: {x:0, y:30}},
            {x: 600, y: 300, handleIn: {x:30, y:0}, handleOut: {x:-30, y:0}},
            {x: 500, y: 300, handleIn: {x:30, y:0}, handleOut: {x:-30, y:0}},
            {x: 450, y: 350, handleIn: {x:0, y:-30}, handleOut: {x:0, y:30}},
            {x: 450, y: 400, handleIn: {x:0, y:-30}, handleOut: {x:0, y:30}},
            {x: 400, y: 450, handleIn: {x:30, y:0}, handleOut: {x:-30, y:0}},
            {x: 300, y: 450, handleIn: {x:30, y:0}, handleOut: {x:-30, y:0}},
            {x: 250, y: 400, handleIn: {x:0, y:30}, handleOut: {x:0, y:-30}},
            {x: 250, y: 200, handleIn: {x:0, y:30}, handleOut: {x:0, y:-30}},
            {x: 300, y: 150, handleIn: {x:-30, y:0}, handleOut: {x:30, y:0}}
        ];
    } else if (type === 's-curve') {
        return [
            {x: 600, y: 200, handleIn: {x:-50, y:0}, handleOut: {x:50, y:0}}, // Top Straight Mid
            {x: 900, y: 200, handleIn: {x:-50, y:0}, handleOut: {x:30, y:0}}, // Approach T1
            {x: 1030, y: 280, handleIn: {x:0, y:-40}, handleOut: {x:0, y:40}}, // T1 Apex
            {x: 950, y: 360, handleIn: {x:30, y:0}, handleOut: {x:-50, y:0}}, // T1 Exit
            {x: 700, y: 360, handleIn: {x:50, y:0}, handleOut: {x:-30, y:0}}, // Back Straight
            {x: 620, y: 440, handleIn: {x:0, y:-40}, handleOut: {x:0, y:40}}, // S-Entry Apex
            {x: 580, y: 500, handleIn: {x:20, y:-20}, handleOut: {x:-20, y:20}}, // S-Link
            {x: 500, y: 560, handleIn: {x:30, y:0}, handleOut: {x:-30, y:0}}, // S-Exit
            {x: 360, y: 480, handleIn: {x:0, y:40}, handleOut: {x:0, y:-40}}, // Hairpin Apex
            {x: 360, y: 360, handleIn: {x:0, y:40}, handleOut: {x:0, y:-40}}, // Up Straight
            {x: 380, y: 280, handleIn: {x:-20, y:20}, handleOut: {x:20, y:-20}}, // Final Corner Entry
            {x: 440, y: 200, handleIn: {x:-20, y:10}, handleOut: {x:30, y:0}}  // Join Top
        ];
    } else {
        // Stadium
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
