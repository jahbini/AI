// ===== Constants and Scaling =====

// The golden ratio.
const phi = (1 + Math.sqrt(5)) / 2;

// In our unscaled six‑basis system, a unit step such as [1,0,0,0,0,0]
// converts to a Cartesian vector of length √(1 + φ²) ≈ 1.902.
// We choose our scaling so that this "short" edge becomes 0.4.
const unscaledUnit = Math.sqrt(1 + phi * phi);  // ≈ 1.902
const s = 0.4 / unscaledUnit;  // scaling factor

// ===== Six‑Basis Conversion Functions =====

/**
 * Converts an integer six‑vector (an array of 6 numbers) to scaled Cartesian coordinates.
 *
 * Basis vectors (unscaled):
 *   b₁ = ( 0,  1,  φ)
 *   b₂ = ( 0, -1,  φ)
 *   b₃ = ( 1,  φ,  0)
 *   b₄ = (-1,  φ,  0)
 *   b₅ = ( φ,  0,  1)
 *   b₆ = ( φ,  0, -1)
 *
 * @param {number[]} coords - [c1, c2, c3, c4, c5, c6]
 * @returns {{x: number, y: number, z: number}} Scaled Cartesian coordinates.
 */
function sixBasisToCartesian(coords) {
  const [c1, c2, c3, c4, c5, c6] = coords;
  let x = c3 - c4 + phi * (c5 + c6);
  let y = c1 - c2 + phi * (c3 + c4);
  let z = phi * (c1 + c2) + c5 - c6;
  return { x: s * x, y: s * y, z: s * z };
}

/**
 * Converts scaled Cartesian coordinates to a six‑basis coordinate (using the pseudoinverse).
 *
 * @param {{x: number, y: number, z: number}} point - Scaled Cartesian point.
 * @returns {number[]} [c1, c2, c3, c4, c5, c6] (may be non‑integer).
 */
function cartesianToSixBasis(point) {
  const { x, y, z } = point;
  let X = x / s, Y = y / s, Z = z / s;
  const D = 4 + 2 * phi;
  let c1 = (Y + phi * Z) / D;
  let c2 = (-Y + phi * Z) / D;
  let c3 = (X + phi * Y) / D;
  let c4 = (-X + phi * Y) / D;
  let c5 = (phi * X + Z) / D;
  let c6 = (phi * X - Z) / D;
  return [c1, c2, c3, c4, c5, c6];
}

/**
 * Rounds each coordinate in a six‑vector to the nearest integer.
 *
 * @param {number[]} coords
 * @returns {number[]} Rounded six‑vector.
 */
function roundSixVector(coords) {
  return coords.map(Math.round);
}

/**
 * Adds two six‑vectors.
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]} a + b (componentwise).
 */
function addSixVectors(a, b) {
  return a.map((val, i) => val + b[i]);
}

/**
 * Subtracts vector a from b (b - a) componentwise.
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]} Difference vector.
 */
function diffSix(a, b) {
  return b.map((val, i) => val - a[i]);
}

// ===== 6D Bresenham / DDA for the Central Lattice Path =====

/**
 * Returns a list of integer six‑vectors approximating a straight line from start to end.
 * This simple DDA divides the maximum coordinate difference into uniform steps.
 *
 * @param {number[]} start - Starting six‑vector.
 * @param {number[]} end - Ending six‑vector.
 * @returns {number[][]} Array of six‑vectors along the line.
 */
function lineSixPoints(start, end) {
  const diff = end.map((val, i) => val - start[i]);
  const steps = Math.max(...diff.map(x => Math.abs(x)));
  let points = [];
  for (let step = 0; step <= steps; step++) {
    let t = step / steps;
    let pt = start.map((val, i) => Math.round(val + diff[i] * t));
    // Avoid duplicates.
    if (points.length === 0 || pt.some((v, i) => v !== points[points.length - 1][i]))
      points.push(pt);
  }
  return points;
}

// ===== Define the Tube’s Central Axis =====

// Given Cartesian start and end.
const cartStart = { x: 0, y: 0, z: 0 };
const cartEnd   = { x: 5, y: 7, z: 8 };

// Convert to six‑basis.
const startSix = roundSixVector(cartesianToSixBasis(cartStart)); // should be [0,0,0,0,0,0]
const endSix   = roundSixVector(cartesianToSixBasis(cartEnd));

// Generate the central lattice path.
const centerPath = lineSixPoints(startSix, endSix);

// ===== Define a Fixed Ring of Offsets (Lego–Bricks) =====
// We choose a ring of 6 offsets that are simple allowed differences.
const ringOffsets = [
  [ 1,  0,  0,  0,  0,  0],
  [ 1, -1,  0,  0,  0,  0],
  [ 0, -1,  0,  0,  0,  0],
  [-1,  0,  0,  0,  0,  0],
  [-1,  1,  0,  0,  0,  0],
  [ 0,  1,  0,  0,  0,  0]
];

/**
 * For a given center (an integer six‑vector), returns the ring of vertices by adding each offset.
 *
 * @param {number[]} center
 * @returns {number[][]} Array of six‑vector vertices in the ring.
 */
function buildRing(center) {
  return ringOffsets.map(offset => addSixVectors(center, offset));
}

// ===== Build the Tube by Extruding Rings Along the Central Path =====

let tubeRings = centerPath.map(center => buildRing(center));

// Triangulate between adjacent rings.
// We “zip” the rings together (assuming each ring has the same number of vertices).
let triangles = [];
const nRing = ringOffsets.length;
for (let i = 0; i < tubeRings.length - 1; i++) {
  const ringA = tubeRings[i];
  const ringB = tubeRings[i + 1];
  for (let j = 0; j < nRing; j++) {
    const jNext = (j + 1) % nRing;
    // Form quadrilateral with vertices: A[j], B[j], B[jNext], A[jNext]
    // Split into two triangles:
    triangles.push({
      vertices: [ringA[j], ringB[j], ringB[jNext]]
    });
    triangles.push({
      vertices: [ringA[j], ringB[jNext], ringA[jNext]]
    });
  }
}

// ===== Output the Tube Triangulation =====

console.log("Tube Triangulation (each triangle built from integer six‑vectors):");
triangles.forEach((tri, idx) => {
  console.log(`Triangle ${idx + 1}:`);
  tri.vertices.forEach((vertex, vi) => {
    console.log(`  Vertex ${vi + 1}: [${vertex.join(", ")}]`);
  });
});

// Optional: Also output the central path and one ring (in Cartesian) for visualization.
console.log("\nCentral Path (six‑vector coordinates):");
centerPath.forEach((pt, idx) => {
  console.log(`  Point ${idx + 1}: [${pt.join(", ")}]`);
});
