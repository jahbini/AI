// ===== Constants and Scaling =====

// The golden ratio.
const phi = (1 + Math.sqrt(5)) / 2;

// In our unscaled six‑basis system, a unit step (e.g. [1,0,0,0,0,0]) converts to a Cartesian length of:
const unscaledUnit = Math.sqrt(1 + phi * phi); // ≈ 1.902
// We choose our scaling so that any unit step becomes 0.4.
const s = 0.4 / unscaledUnit;  // scaling factor

// ===== Six‑Basis Conversion Functions =====

/**
 * Converts an integer six‑vector (in the six‑basis system) to scaled Cartesian coordinates.
 *
 * Basis vectors (unscaled):
 *   b1 = ( 0,  1,  φ)
 *   b2 = ( 0, -1,  φ)
 *   b3 = ( 1,  φ,  0)
 *   b4 = (-1,  φ,  0)
 *   b5 = ( φ,  0,  1)
 *   b6 = ( φ,  0, -1)
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
 * @returns {number[]} [c1, c2, c3, c4, c5, c6] (non-integer, to be rounded for lattice use)
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
 * Rounds a six‑vector to the nearest integers.
 *
 * @param {number[]} coords
 * @returns {number[]} Integer six‑vector.
 */
function roundSixVector(coords) {
  return coords.map(Math.round);
}

/**
 * Adds two six‑vectors.
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]} a + b.
 */
function addSixVectors(a, b) {
  return a.map((val, i) => val + b[i]);
}

/**
 * Subtracts two six‑vectors (b - a).
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]} Difference vector.
 */
function diffSix(a, b) {
  return b.map((val, i) => val - a[i]);
}

/**
 * Snaps a Cartesian point to the nearest six‑basis lattice point.
 *
 * @param {{x: number, y: number, z: number}} point
 * @returns {{six: number[], cartesian: {x:number, y:number, z:number}}}
 */
function snapToSixBasis(point) {
  let coords = cartesianToSixBasis(point);
  let intCoords = roundSixVector(coords);
  return { six: intCoords, cartesian: sixBasisToCartesian(intCoords) };
}

// ===== Allowed Edge Differences =====
// In our lattice the allowed edges are:
// • Short edge: a unit step (exactly one coordinate is ±1, all others 0).
// • Long edge: a “diagonal” step with exactly two nonzero entries (each ±1).
function isAllowedShort(diff) {
  let nonZero = diff.filter(x => x !== 0);
  return (nonZero.length === 1 && Math.abs(nonZero[0]) === 1);
}
function isAllowedLong(diff) {
  let nonZero = diff.filter(x => x !== 0);
  return (nonZero.length === 2 && nonZero.every(x => Math.abs(x) === 1));
}

/**
 * For two six‑vectors (representing vertices), compute the edge type ("S", "L", or "X")
 * and its Cartesian length.
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns {{etype: string, length: number}}
 */
function edgeTypeAndLength(a, b) {
  let d = diffSix(a, b);
  let cartD = sixBasisToCartesian(d);
  let len = Math.sqrt(cartD.x * cartD.x + cartD.y * cartD.y + cartD.z * cartD.z);
  if (isAllowedShort(d)) return { etype: "S", length: len };
  if (isAllowedLong(d)) return { etype: "L", length: len };
  return { etype: "X", length: len };
}

// ===== Geometry of the Tube =====

// Define the tube’s central axis from start to end.
const start = { x: 0, y: 0, z: 0 };
const end = { x: 5, y: 7, z: 8 };

/**
 * Linear interpolation along the line.
 *
 * @param {number} t - Parameter 0 ≤ t ≤ 1.
 * @returns {{x: number, y: number, z: number}}
 */
function interpolateLine(t) {
  return {
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y),
    z: start.z + t * (end.z - start.z)
  };
}

/**
 * Returns two perpendicular unit vectors in the plane perpendicular to the given direction.
 *
 * @param {{x: number, y: number, z: number}} dir
 * @returns {{v1: {x: number, y: number, z: number}, v2: {x: number, y: number, z: number}}}
 */
function getPerpendicularVectors(dir) {
  let mag = Math.sqrt(dir.x ** 2 + dir.y ** 2 + dir.z ** 2);
  let d = { x: dir.x / mag, y: dir.y / mag, z: dir.z / mag };
  let arbitrary = (Math.abs(d.x) < 0.9) ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  let v1 = {
    x: d.y * arbitrary.z - d.z * arbitrary.y,
    y: d.z * arbitrary.x - d.x * arbitrary.z,
    z: d.x * arbitrary.y - d.y * arbitrary.x
  };
  let magV1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
  v1 = { x: v1.x / magV1, y: v1.y / magV1, z: v1.z / magV1 };
  let v2 = {
    x: d.y * v1.z - d.z * v1.y,
    y: d.z * v1.x - d.x * v1.z,
    z: d.x * v1.y - d.y * v1.x
  };
  return { v1, v2 };
}

// Precompute a fixed pair of perpendicular unit vectors from the tube’s axis.
const lineDir = { x: end.x - start.x, y: end.y - start.y, z: end.z - start.z };
const { v1, v2 } = getPerpendicularVectors(lineDir);

// Parameters for sampling along the line.
const numSections = 11;         // Number of sample points along the tube’s axis.
const tubeRadius = 1.0;         // Envelope radius (Cartesian units).

// Define the 12 immediate neighbor directions in the six‑basis lattice.
const neighborDirs = [
  [ 1, 0, 0, 0, 0, 0],
  [-1, 0, 0, 0, 0, 0],
  [0,  1, 0, 0, 0, 0],
  [0, -1, 0, 0, 0, 0],
  [0, 0,  1, 0, 0, 0],
  [0, 0, -1, 0, 0, 0],
  [0, 0, 0,  1, 0, 0],
  [0, 0, 0, -1, 0, 0],
  [0, 0, 0, 0,  1, 0],
  [0, 0, 0, 0, -1, 0],
  [0, 0, 0, 0, 0,  1],
  [0, 0, 0, 0, 0, -1]
];

/**
 * For a given center (unsnapped) on the line, compute the envelope of nearby lattice points.
 * We start with the snapped center and add each neighbor direction.
 * Then we filter out candidates whose Cartesian distance from the unsnapped center is > tubeRadius.
 * Also, we compute an angular coordinate (using fixed perpendicular vectors) for sorting.
 *
 * @param {{x: number, y: number, z: number}} center - Unsnapped center.
 * @returns {Array} Array of candidate envelope points: {six: number[], cartesian:{x,y,z}, angle: number}.
 */
function getEnvelopeCandidates(center) {
  let snapped = snapToSixBasis(center);
  let centerCart = center; // unsnapped center
  let candidates = [];
  for (let dir of neighborDirs) {
    let candidateSix = addSixVectors(snapped.six, dir);
    let candidateCart = sixBasisToCartesian(candidateSix);
    let dx = candidateCart.x - centerCart.x;
    let dy = candidateCart.y - centerCart.y;
    let dz = candidateCart.z - centerCart.z;
    let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist <= tubeRadius) {
      // Compute angle for sorting.
      let dot1 = (candidateCart.x - centerCart.x) * v1.x + (candidateCart.y - centerCart.y) * v1.y + (candidateCart.z - centerCart.z) * v1.z;
      let dot2 = (candidateCart.x - centerCart.x) * v2.x + (candidateCart.y - centerCart.y) * v2.y + (candidateCart.z - centerCart.z) * v2.z;
      let angle = Math.atan2(dot2, dot1);
      candidates.push({ six: candidateSix, cartesian: candidateCart, angle });
    }
  }
  candidates.sort((a, b) => a.angle - b.angle);
  return candidates;
}

// ===== Build Envelope Rings Along the Tube =====

let envelopeRings = []; // one ring per section along the line.
for (let i = 0; i < numSections; i++) {
  let t = i / (numSections - 1);
  let center = interpolateLine(t);
  let candidates = getEnvelopeCandidates(center);
  if (candidates.length === 0) {
    candidates.push(snapToSixBasis(center));
  }
  envelopeRings.push(candidates);
}

// ===== Triangulation Between Envelope Rings =====

// Instead of a simple “zip,” we form quadrilaterals between adjacent rings (using the minimum count)
// and then split each quadrilateral into two candidate triangles.
let candidateTriangles = [];
for (let i = 0; i < envelopeRings.length - 1; i++) {
  let ringA = envelopeRings[i];
  let ringB = envelopeRings[i + 1];
  let n = Math.min(ringA.length, ringB.length);
  for (let j = 0; j < n; j++) {
    let jNext = (j + 1) % n;
    candidateTriangles.push({
      vertices: [
        ringA[j].six,
        ringB[j].six,
        ringB[jNext].six
      ]
    });
    candidateTriangles.push({
      vertices: [
        ringA[j].six,
        ringB[jNext].six,
        ringA[jNext].six
      ]
    });
  }
}

// ===== Validation: Keep Only Golden Triangles/Gnomons =====

// Tolerances for length equality and ratio (allow ~6% error).
const tolEqual = 0.06;
const tolRatio = 0.06;
// Ideal lengths (from our construction):
const idealShort = 0.4;            // by design
const idealLong = idealShort * phi;  // ~0.6472

/**
 * Given three six‑vector vertices, determine if the triangle’s edges
 * come from allowed differences and if they have the correct golden proportions.
 * Returns { type: "T" or "G" or "?" , lengths: [L1, L2, L3], edgetypes: [ "S" or "L" ] }.
 */
function validateGoldenTriangle(sixVertices) {
  // Compute edges (order: AB, BC, CA)
  let e1 = edgeTypeAndLength(sixVertices[0], sixVertices[1]);
  let e2 = edgeTypeAndLength(sixVertices[1], sixVertices[2]);
  let e3 = edgeTypeAndLength(sixVertices[2], sixVertices[0]);
  let types = [e1.etype, e2.etype, e3.etype];
  let lengths = [e1.length, e2.length, e3.length];
  
  // If any edge is not allowed, mark as invalid.
  if (types.includes("X")) return { type: "?", lengths, edgetypes: types };
  
  // Count short and long edges.
  let countS = types.filter(t => t === "S").length;
  let countL = types.filter(t => t === "L").length;
  
  // For consistency, sort edges by length.
  let sorted = lengths.slice().sort((a, b) => a - b);
  // Check ratio = long/short.
  let ratio = sorted[2] / sorted[0];
  
  // Check which pattern we have.
  // Golden Triangle (T): one short edge, two long edges.
  if (countS === 1 && countL === 2) {
    // The two long edges should be nearly equal.
    // And ratio should be near φ.
    let longEdges = lengths.filter((l, i) => types[i] === "L");
    let shortEdge = lengths[types.indexOf("S")];
    if (Math.abs(longEdges[0] - longEdges[1]) / ((longEdges[0] + longEdges[1]) / 2) < tolEqual &&
        Math.abs(longEdges[0] / shortEdge - phi) / phi < tolRatio) {
      return { type: "T", lengths, edgetypes: types };
    }
  }
  // Golden Gnomon (G): two short edges, one long edge.
  if (countS === 2 && countL === 1) {
    let shortEdges = lengths.filter((l, i) => types[i] === "S");
    let longEdge = lengths[types.indexOf("L")];
    if (Math.abs(shortEdges[0] - shortEdges[1]) / ((shortEdges[0] + shortEdges[1]) / 2) < tolEqual &&
        Math.abs(longEdge / shortEdges[0] - phi) / phi < tolRatio) {
      return { type: "G", lengths, edgetypes: types };
    }
  }
  return { type: "?", lengths, edgetypes: types };
}

// Filter the candidate triangles.
let goldenTriangles = [];
candidateTriangles.forEach(tri => {
  let validation = validateGoldenTriangle(tri.vertices);
  if (validation.type === "T" || validation.type === "G") {
    goldenTriangles.push({ vertices: tri.vertices, validation });
  }
});

// ===== Output the Valid Golden Triangles =====

console.log("Valid Golden Tiling (each triangle with type, edge lengths, edge types, and integer 6‑vector vertices):");
goldenTriangles.forEach((tri, idx) => {
  let v = tri.vertices;
  let val = tri.validation;
  console.log(`Triangle ${idx + 1} [Type: ${val.type}]`);
  console.log(`  Edge lengths (unsorted): ${val.lengths.map(l => l.toFixed(4)).join(", ")}`);
  console.log(`  Edge types: ${val.edgetypes.join(", ")}`);
  v.forEach((vertex, vi) => {
    console.log(`  Vertex ${vi + 1}: [${vertex.join(", ")}]`);
  });
});
