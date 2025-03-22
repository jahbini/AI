// ==================================================
// Constants and Helper Functions
// ==================================================

// Golden ratio (φ)
const phi = (1 + Math.sqrt(5)) / 2;
const TOL = 1e-10;  // tolerance for floating point comparisons

/**
 * Returns true if a value is effectively an integer.
 */
function isInteger(value, tolerance = TOL) {
  return Math.abs(value - Math.round(value)) < tolerance;
}

/**
 * Checks that a 6–vector has all integer components.
 */
function isValidSixVector(v) {
  return (v.length === 6) && v.every(comp => isInteger(comp));
}

/**
 * Euclidean distance between two 6–vectors.
 */
function sixVectorDistance(v1, v2) {
  let sumSq = 0;
  for (let i = 0; i < 6; i++) {
    const d = v1[i] - v2[i];
    sumSq += d * d;
  }
  return Math.sqrt(sumSq);
}

// ==================================================
// Conversion between 6–Space and Cartesian Space
// ==================================================

/**
 * Converts a legal 6–vector to Cartesian coordinates.
 * Defined as:
 *    x = c + d + φ·(e + f)
 *    y = a + b + φ·(c – d)
 *    z = φ·(a – b) + (e – f)
 *
 * @param {number[]} six - Array [a, b, c, d, e, f] (each an integer).
 * @returns {Object} An object with properties x, y, z.
 */
function sixToCartesian(six) {
  const [a, b, c, d, e, f] = six;
  return {
    x: c + d + phi * (e + f),
    y: a + b + phi * (c - d),
    z: phi * (a - b) + (e - f)
  };
}

/**
 * Rounds a real number to its closest representation in ℤ[φ].
 * That is, finds integers I and J so that value ≈ I + φ·J.
 *
 * @param {number} value - The real number to approximate.
 * @param {number} range - Search range for I and J (default 3).
 * @returns {{int: number, phi: number}} The best (I, J) pair.
 */
function roundToPhiDecomposition(value, range = 3) {
  let best = { int: 0, phi: 0, diff: Infinity };
  const baseI = Math.floor(value);
  for (let I = baseI - range; I <= baseI + range; I++) {
    for (let J = -range; J <= range; J++) {
      const approx = I + phi * J;
      const diff = Math.abs(value - approx);
      if (diff < best.diff) {
        best = { int: I, phi: J, diff };
      }
    }
  }
  return { int: best.int, phi: best.phi };
}

/**
 * Given a Cartesian point expressed as {x, y, z}, uses φ–decomposition
 * to compute an approximate candidate legal 6–vector.
 * (The candidate is then used as a starting point for a neighborhood search.)
 *
 * @param {{x: number, y: number, z: number}} p - The Cartesian point.
 * @returns {number[]} A legal 6–vector (array of 6 integers).
 */
function approximateCandidateSixVector(p) {
  const decompX = roundToPhiDecomposition(p.x);
  const decompY = roundToPhiDecomposition(p.y);
  const decompZ = roundToPhiDecomposition(p.z);
  
  const X0 = decompX.int, X1 = decompX.phi;
  const Y0 = decompY.int, Y1 = decompY.phi;
  const Z0 = decompZ.int, Z1 = decompZ.phi;
  
  // Inversion formulas:
  const candidate = [
    (Y0 + Z1) / 2,
    (Y0 - Z1) / 2,
    (X0 + Y1) / 2,
    (X0 - Y1) / 2,
    (X1 + Z0) / 2,
    (X1 - Z0) / 2
  ];
  // Since our lattice is perfect, round to obtain a legal 6–vector.
  return candidate.map(c => Math.round(c));
}

// ==================================================
// Neighborhood Functions (No Snapping in 6–Space)
// ==================================================

/**
 * Given a legal 6–vector (an array of 6 integers), returns all neighboring
 * lattice points whose offsets (in each coordinate) are within ±maxStep.
 *
 * @param {number[]} legalSixVector - A legal 6–vector.
 * @param {number} maxStep - Maximum offset in each coordinate (typically 1 or 2).
 * @returns {Object[]} Array of objects, each with:
 *          { six: [number, ...], sixDistance: number }
 *         where sixDistance is the Euclidean distance in 6–space between the neighbor and the original.
 */
function getNearbySixSpacePoints(legalSixVector, maxStep = 1) {
  if (!isValidSixVector(legalSixVector)) {
    throw new Error("Input must be a legal 6–vector (6 integers).");
  }
  const neighbors = [];
  
  // Recursively build all offset combinations.
  function search(dim, currentOffset) {
    if (dim === 6) {
      // Exclude the zero offset (which is the original point).
      if (currentOffset.some(x => x !== 0)) {
        const neighbor = legalSixVector.map((val, i) => val + currentOffset[i]);
        const dist = Math.sqrt(currentOffset.reduce((sum, x) => sum + x * x, 0));
        neighbors.push({ six: neighbor, sixDistance: dist });
      }
      return;
    }
    for (let offset = -maxStep; offset <= maxStep; offset++) {
      currentOffset.push(offset);
      search(dim + 1, currentOffset);
      currentOffset.pop();
    }
  }
  search(0, []);
  
  // Sort by the 6–space Euclidean distance.
  neighbors.sort((a, b) => a.sixDistance - b.sixDistance);
  return neighbors;
}

/**
 * Given a Cartesian point p = { x, y, z } (which may be off–lattice),
 * returns a selection of nearby legal lattice points (from 6–space)
 * and their Cartesian images.
 *
 * The function:
 *   1. Approximates a candidate legal 6–vector for p.
 *   2. Gathers neighbors of that candidate (using a max offset in 6–space).
 *   3. Converts each neighbor to Cartesian coordinates and computes the Euclidean distance to p.
 *
 * @param {{x: number, y: number, z: number}} p - The dirty Cartesian point.
 * @param {number} maxStep - Maximum offset in 6–space to consider (typically 1 or 2).
 * @returns {Object[]} Array of objects, each containing:
 *          { six: [number, ...],
 *            cartesian: { x, y, z },
 *            sixDistance: number,      // 6–space distance from candidate
 *            cartesianDistance: number } // Euclidean distance in Cartesian space from p
 */
function getNearbyCartesianLatticePoints(p, maxStep = 1) {
  // Compute the candidate legal 6–vector from p.
  const candidateSix = approximateCandidateSixVector(p);
  // Get nearby 6–vectors in the lattice.
  const sixNeighbors = getNearbySixSpacePoints(candidateSix, maxStep);
  
  // Convert each legal neighbor to Cartesian coordinates and compute distance to p.
  const results = sixNeighbors.map(item => {
    const cart = sixToCartesian(item.six);
    const dx = cart.x - p.x;
    const dy = cart.y - p.y;
    const dz = cart.z - p.z;
    const cartDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return { 
      six: item.six, 
      sixDistance: item.sixDistance,
      cartesian: cart,
      cartesianDistance: cartDist 
    };
  });
  
  // Sort by Cartesian distance.
  results.sort((a, b) => a.cartesianDistance - b.cartesianDistance);
  return results;
}

// ==================================================
// Example Usage
// ==================================================

// Example: Starting from a known legal 6–vector.
const legalSixPoint = [2, -3, 1, 0, 4, -1];  // Always legal (all integers).
console.log("Legal 6–vector:", legalSixPoint);
const neighbors6 = getNearbySixSpacePoints(legalSixPoint, 1);
console.log("Nearby 6–space neighbors (max offset = 1):", neighbors6.slice(0, 10)); // show first 10 for brevity

// Example: For a given Cartesian point (which might be 'dirty'),
// find the nearby legal lattice points.
const dirtyCartesian = { x: 5.73, y: -2.81, z: 3.14 };
const nearbyCartesian = getNearbyCartesianLatticePoints(dirtyCartesian, 1);
console.log("Nearby legal Cartesian lattice points:", nearbyCartesian.slice(0, 5)); // show first 5 for brevity
