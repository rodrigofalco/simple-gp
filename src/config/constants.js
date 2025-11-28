// --- Racing Constants ---
// Extracted from index.html lines 97-100

export const RACER_NAMES_SOURCE = ["Joan", "Juan", "Brayan", "Fico", "Juani", "Edu", "Mechi", "Coco", "Gonza", "Dani", "Martin"];
export const RACER_COLORS_SOURCE = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#64748b', '#14b8a6'];
export const RACER_NUMBERS_SOURCE = [1, 5, 7, 14, 18, 21, 25, 27, 31, 33, 37];
export const PLAYER_INDICES = [0, 1];

// --- Bike Archetypes ---
// Each archetype has different strengths - balanced for competitive racing
// Trade-offs: Speeders are fast on straights but MUST brake hard for corners
export const BIKE_ARCHETYPES = {
  speeder: {
    name: 'Speeder',
    icon: '🚀',
    description: 'Alta velocidad, debe frenar en curvas',
    topSpeedMultiplier: 1.06,      // 6% faster top speed on straights (reduced from 12%)
    accelerationMultiplier: 0.85,  // 15% slower acceleration
    corneringMultiplier: 0.70,     // 30% slower in corners - MUST brake!
    maxSteerMultiplier: 0.85       // Worse turning radius
  },
  accelerator: {
    name: 'Accelerator',
    icon: '⚡',
    description: 'Aceleración rápida, velocidad media',
    topSpeedMultiplier: 0.98,      // 2% slower top speed
    accelerationMultiplier: 1.40,  // 40% faster acceleration
    corneringMultiplier: 0.90,     // 10% slower in corners
    maxSteerMultiplier: 1.0        // Normal turning
  },
  turner: {
    name: 'Turner',
    icon: '🔄',
    description: 'Mejor en curvas, menor velocidad',
    topSpeedMultiplier: 0.92,      // 8% slower top speed
    accelerationMultiplier: 1.0,   // Normal acceleration
    corneringMultiplier: 1.15,     // 15% faster in corners
    maxSteerMultiplier: 1.25       // Much better turning
  }
};

// Archetype keys for random assignment
export const BIKE_ARCHETYPE_KEYS = ['speeder', 'accelerator', 'turner'];
