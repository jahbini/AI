// ==============================
// Constants and Helper Functions
// ==============================

// Constant: the golden ratio
const phi = (1 + Math.sqrt(5)) / 2;

// Tolerance for floating point comparisons
const TOL = 1e-10;

/**
 * Returns true if value is effectively an integer.
 */
function isInteger(value, tolerance = TOL) {
  return Math.abs(value - Math.round(value)) < tolerance;
}

/**
 * Checks that a 6–vector has all integer components.
 */
function isValidSixVector(v) {
  if (v.length !== 6) return false;
  return v.every(comp => isInteger(comp));
}

/**
 * Euclidean distance between two 6–vectors.
 */
function sixVectorDistance(v1, v2) {
  if (v1.length !== 6 || v2.length !== 6) {
    throw new Error("Both vectors must be 6-dimensional.");
  }
  let sumSq = 0;
  for (let i = 0; i < 6; i++) {
    let d = v1[i] - v2[i];
    sumSq += d * d;
  }
  return Math.sqrt(sumSq);
}

// ==============================
// Basic 6–Space Arithmetic Routines
// (from our earlier module)
// ==============================

/**
 * Adds two 6–vectors.
 */
function addSixVectors(v1, v2) {
  if (v1.length !== 6 || v2.length !== 6) {
    throw new Error("Both vectors must be 6-dimensional.");
  }
  const result = [];
  for (let i = 0; i < 6; i++) {
    result.push(v1[i] + v2[i]);
  }
  if (!isValidSixVector(result)) {
    throw new Error("Addition resulted in non-integer components in the 6–vector.");
  }
  return result;
}

/**
 * Subtracts two 6–vectors.
 */
function subtractSixVectors(v1, v2) {
  if (v1.length !== 6 || v2.length !== 6) {
    throw new Error("Both vectors must be 6-dimensional.");
  }
  const result = [];
  for (let i = 0; i < 6; i++) {
    result.push(v1[i] - v2[i]);
  }
  if (!isValidSixVector(result)) {
    throw new Error("Subtraction resulted in non-integer components in the 6–vector.");
  }
  return result;
}

/**
 * Scales a 6–vector by an integer factor.
 */
function scaleSixVector(v, factor) {
  if (v.length !== 6) {
    throw new Error("Vector must be 6-dimensional.");
  }
  const result = v.map(comp => comp * factor);
  if (!isValidSixVector(result)) {
    throw new Error("Scaling resulted in non-integer components.");
  }
  return result.map(comp => Math.round(comp));
}

/**
 * Converts a 6–vector to Cartesian coordinates.
 *   x = c + d + φ·(e + f)
 *   y = a + b + φ·(c – d)
 *   z = φ·(a – b) + (e – f)
 */
function sixToCartesian(six) {
  if (six.length !== 6) {
    throw new Error("Input must be a 6–vector.");
  }
  const [a, b, c, d, e, f] = six;
  const x = c + d + phi * (e + f);
  const y = a + b + phi * (c - d);
  const z = phi * (a - b) + (e - f);
  return { x, y, z };
}

/**
 * Converts Cartesian coordinates (expressed exactly in the φ–lattice form)
 * back into a 6–vector.
 * Expects each coordinate as { int: ..., phi: ... } so that:
 *   x = X0 + φ·X1,  y = Y0 + φ·Y1,  z = Z0 + φ·Z1.
 *
 * Inversion formulas:
 *   a = (Y0 + Z1)/2,   b = (Y0 - Z1)/2,
 *   c = (X0 + Y1)/2,   d = (X0 - Y1)/2,
 *   e = (X1 + Z0)/2,   f = (X1 - Z0)/2.
 */
function cartesianToSix(cartesian) {
  const { x, y, z } = cartesian;
  const X0 = x.int, X1 = x.phi;
  const Y0 = y.int, Y1 = y.phi;
  const Z0 = z.int, Z1 = z.phi;
  
  const a = (Y0 + Z1) / 2;
  const b = (Y0 - Z1) / 2;
  const c = (X0 + Y1) / 2;
  const d = (X0 - Y1) / 2;
  const e = (X1 + Z0) / 2;
  const f = (X1 - Z0) / 2;
  
  const result = [a, b, c, d, e, f];
  if (!isValidSixVector(result)) {
    throw new Error("Conversion from Cartesian produced non-integer six–vector components.");
  }
  return result;
}

// ==============================
// New: Routines for "Snapping" to Legal Points
// ==============================

/**
 * Given a candidate 6–vector (which may have fractional entries),
 * searches the nearby lattice (within maxStep in each coordinate from
 * the nearest-integer rounding) and returns all legal 6–vectors that
 * minimize the Euclidean distance (in 6–space) to the candidate.
 *
 * @param {number[]} candidate - Array of 6 numbers.
 * @param {number} maxStep - Maximum integer offset from the rounded candidate.
 *                           (Typical values: 1 or 2)
 * @returns {number[][]} Array of legal 6–vectors (each is an array of 6 integers).
 */
function snapToLegalSixPoints(candidate, maxStep = 1) {
  if (candidate.length !== 6) {
    throw new Error("Candidate must be 6-dimensional.");
  }
  
  // Compute the "rounded" candidate.
  const base = candidate.map(c => Math.round(c));
  
  // Search in a hypercube: each coordinate in [base[i]-maxStep, base[i]+maxStep]
  const results = [];
  let minDist = Infinity;
  
  // Helper recursive function to build candidate vectors.
  function search(dim, current) {
    if (dim === 6) {
      // current is a candidate legal 6-vector.
      // Compute the Euclidean distance in 6-space.
      const d = sixVectorDistance(candidate, current);
      if (d < minDist - TOL) {
        minDist = d;
        results.length = 0; // clear results
        results.push(current.slice());
      } else if (Math.abs(d - minDist) < TOL) {
        results.push(current.slice());
      }
      return;
    }
    for (let offset = -maxStep; offset <= maxStep; offset++) {
      current.push(base[dim] + offset);
      search(dim + 1, current);
      current.pop();
    }
  }
  search(0, []);
  
  return results;
}

/**
 * Helper: Rounds a real number to its closest representation in ℤ[φ].
 * That is, given value, find integers I and J so that value ≈ I + φ·J.
 * Searches in a small window around Math.floor(value).
 *
 * @param {number} value - The real number to approximate.
 * @param {number} range - Range for search (default 3).
 * @returns {{int: number, phi: number}} The pair (I, J) that minimizes |value - (I + φ·J)|.
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
 * Given a Cartesian point (p = {x, y, z}) that may not lie exactly on
 * the φ–lattice, this function returns the legal Cartesian point(s)
 * (i.e. ones obtained from legal 6–vectors) that are closest to p.
 *
 * It does so by:
 *   1. Approximating a φ–decomposition for each coordinate.
 *   2. Using the inversion formulas to get an approximate candidate 6–vector.
 *   3. Brute–forcing in a small neighborhood (of radius maxStep in 6–space)
 *      around the rounded candidate to find legal 6–vectors whose Cartesian
 *      images are closest to p.
 *
 * @param {{x: number, y: number, z: number}} p - The Cartesian point.
 * @param {number} maxStep - Maximum step size in 6–space (typical: 1 or 2).
 * @returns {{six: number[], cartesian: {x: number, y: number, z: number}}[]} 
 *          An array of objects containing the legal 6–vector and its Cartesian coordinate.
 */
function snapToLegalCartesian(p, maxStep = 1) {
  // For each Cartesian coordinate, find the best phi–decomposition.
  const decompX = roundToPhiDecomposition(p.x);
  const decompY = roundToPhiDecomposition(p.y);
  const decompZ = roundToPhiDecomposition(p.z);
  
  // Let:
  //   x = X0 + φ·X1,   y = Y0 + φ·Y1,   z = Z0 + φ·Z1.
  const X0 = decompX.int, X1 = decompX.phi;
  const Y0 = decompY.int, Y1 = decompY.phi;
  const Z0 = decompZ.int, Z1 = decompZ.phi;
  
  // Inversion formulas (ideal legal case):
  //   a = (Y0 + Z1) / 2,   b = (Y0 - Z1) / 2,
  //   c = (X0 + Y1) / 2,   d = (X0 - Y1) / 2,
  //   e = (X1 + Z0) / 2,   f = (X1 - Z0) / 2.
  // In a nearly legal case, these may not be integers, so we get an approximate candidate.
  const candidateApprox = [
    (Y0 + Z1) / 2,
    (Y0 - Z1) / 2,
    (X0 + Y1) / 2,
    (X0 - Y1) / 2,
    (X1 + Z0) / 2,
    (X1 - Z0) / 2
  ];
  
  // Round candidateApprox to nearest integers to get a base candidate.
  const candidateRounded = candidateApprox.map(c => Math.round(c));
  
  // Now, search in the neighborhood of candidateRounded in 6–space.
  const legalSixCandidates = snapToLegalSixPoints(candidateRounded, maxStep);
  
  // Convert each legal 6–vector candidate to Cartesian.
  const results = legalSixCandidates.map(v => ({
    six: v,
    cartesian: sixToCartesian(v)
  }));
  
  // Now, choose those whose Cartesian images are closest to p.
  let minDist = Infinity;
  results.forEach(item => {
    const dx = item.cartesian.x - p.x;
    const dy = item.cartesian.y - p.y;
    const dz = item.cartesian.z - p.z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d < minDist) {
      minDist = d;
    }
    item.distance = d;
  });
  
  // Return those with distance nearly equal to minDist.
  return results.filter(item => Math.abs(item.distance - minDist) < TOL);
}

// ==============================
// Example Usage for Snapping Routines
// ==============================

// --- For a 6–vector candidate (in 6–space)
const candidateSix = [1.3, -0.7, 0.2, -0.1, 0.9, 0.05];
console.log("Candidate 6–vector (input):", candidateSix);
const snappedSix = snapToLegalSixPoints(candidateSix, 1);
console.log("Closest legal 6–vectors:", snappedSix);

// --- For a Cartesian candidate
const candidateCartesian = { x: 3.1415, y: 2.718, z: 1.414 };
console.log("Candidate Cartesian point:", candidateCartesian);
const snappedCartesian = snapToLegalCartesian(candidateCartesian, 1);
console.log("Closest legal Cartesian points (and their 6–vector):", snappedCartesian);
