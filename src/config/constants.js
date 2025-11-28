// --- Racing Constants ---
// Extracted from index.html lines 97-100

export const RACER_NAMES_SOURCE = ["Joan", "Juan", "Brayan", "Fico", "Juani", "Edu", "Mechi", "Coco", "Gonza", "Dani", "Martin"];
export const RACER_COLORS_SOURCE = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#64748b', '#14b8a6'];
export const RACER_NUMBERS_SOURCE = [1, 5, 7, 14, 18, 21, 25, 27, 31, 33, 37];
export const PLAYER_INDICES = [0, 1];

// --- Bike Archetypes ---
// Each archetype has different strengths - balanced for competitive racing
export const BIKE_ARCHETYPES = {
  speeder: {
    name: 'Speeder',
    icon: '🚀',
    description: 'High top speed, slower acceleration',
    topSpeedMultiplier: 1.08,      // 8% faster top speed (reduced from 25%)
    accelerationMultiplier: 0.8,   // 20% slower acceleration
    corneringMultiplier: 0.88,     // 12% slower in corners
    maxSteerMultiplier: 0.92       // Worse turning
  },
  accelerator: {
    name: 'Accelerator',
    icon: '⚡',
    description: 'Fast acceleration, medium top speed',
    topSpeedMultiplier: 0.98,      // 2% slower top speed
    accelerationMultiplier: 1.35,  // 35% faster acceleration
    corneringMultiplier: 0.95,     // 5% slower in corners
    maxSteerMultiplier: 1.0        // Normal turning
  },
  turner: {
    name: 'Turner',
    icon: '🔄',
    description: 'Best cornering, lower top speed',
    topSpeedMultiplier: 0.94,      // 6% slower top speed
    accelerationMultiplier: 1.0,   // Normal acceleration
    corneringMultiplier: 1.12,     // 12% faster in corners
    maxSteerMultiplier: 1.2        // Better turning
  }
};

// Archetype keys for random assignment
export const BIKE_ARCHETYPE_KEYS = ['speeder', 'accelerator', 'turner'];
