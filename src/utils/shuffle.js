/**
 * Array utility functions.
 * @module utils/shuffle
 */

/**
 * Shuffles an array in-place using the Fisher-Yates algorithm.
 * This algorithm ensures a uniform random distribution of all permutations.
 *
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 *
 * @param {Array} array - The array to shuffle (modified in-place)
 * @returns {Array} The same array reference, now shuffled
 *
 * @example
 * const racerNames = ["Joan", "Juan", "Brayan"];
 * shuffleArray(racerNames);
 * // racerNames is now in random order, e.g., ["Brayan", "Joan", "Juan"]
 *
 * @example
 * // Create a shuffled copy without modifying original
 * const original = [1, 2, 3, 4, 5];
 * const shuffled = shuffleArray([...original]);
 */
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
