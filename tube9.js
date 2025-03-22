// ===== Constants and Scaling =====

// The golden ratio.
const phi = (1 + Math.sqrt(5)) / 2;

// In our unscaled six‑basis system a unit step (e.g. [1,0,0,0,0,0]) converts to a Cartesian length:
const unscaledUnit = Math.sqrt(1 + phi * phi); // ~1.902
// We choose scaling so that any unit step becomes 0.4 in Cartesian space.
const s = 0.4 / unscaledUnit;  // scaling factor

// ===== Six‑Basis Conversion and Utility Functions =====

/**
 * Converts an integer six‑vector (in the six‑basis system) to scaled Cartesian coordinates.
 * Basis vectors (unscaled):
 *   b1 = ( 0,  1,  φ)
 *   b2 = ( 0, -1,  φ)
 *   b3 = ( 1,  φ,  0)
 *   b4 = (-1,  φ,  0)
 *   b5 = ( φ,  0,  1)
 *   b6 = ( φ,  0, -1)
 *
 * @param {number[]} coords - [c1, c2, c3, c4, c5, c6]
 * @returns {{x:number, y:number, z:number}}
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
 * @param {{x:number, y:number, z:number}} point
 * @returns {number[]} [c1, c2, c3, c4, c5, c6] (non-integer; to be rounded for lattice points)
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
 * Rounds each component of a six‑vector.
 * @param {number[]} coords
 * @returns {number[]} Rounded integer six‑vector.
 */
function roundSixVector(coords) {
  return coords.map(Math.round);
}

/**
 * Adds two six‑vectors componentwise.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]} a + b.
 */
function addSixVectors(a, b) {
  return a.map((val, i) => val + b[i]);
}

/**
 * Subtracts vector a from vector b (b - a).
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]} Difference vector.
 */
function diffSix(a, b) {
  return b.map((val, i) => val - a[i]);
}

// ===== Allowed Edge Checks =====
// Allowed moves for triangle edges (in six‑basis):
// • Short edge: exactly one nonzero entry (±1).
// • Long edge: exactly two nonzero entries (each ±1).
function isAllowedShort(diff) {
  let nonZero = diff.filter(x => x !== 0);
  return (nonZero.length === 1 && Math.abs(nonZero[0]) === 1);
}
function isAllowedLong(diff) {
  let nonZero = diff.filter(x => x !== 0);
  return (nonZero.length === 2 && nonZero.every(x => Math.abs(x) === 1));
}

/**
 * For two six‑vectors a and b, compute the edge type ("S" or "L") and its Cartesian length.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {{etype:string, length:number}}
 */
function edgeTypeAndLength(a, b) {
  let d = diffSix(a, b);
  let cartD = sixBasisToCartesian(d);
  let len = Math.sqrt(cartD.x**2 + cartD.y**2 + cartD.z**2);
  if (isAllowedShort(d)) return { etype: "S", length: len };
  if (isAllowedLong(d)) return { etype: "L", length: len };
  return { etype: "?", length: len };
}

/**
 * Determines the triangle type based on its three edges.
 * If edges follow pattern [S, L, L] (in any order) we label it as a golden triangle ("T"),
 * and if [S, S, L] then as a golden gnomon ("G"). Otherwise "?".
 * @param {number[][]} vertices - Three six‑vector vertices.
 * @returns {string} "T", "G", or "?"
 */
function labelTriangle(vertices) {
  let e1 = edgeTypeAndLength(vertices[0], vertices[1]);
  let e2 = edgeTypeAndLength(vertices[1], vertices[2]);
  let e3 = edgeTypeAndLength(vertices[2], vertices[0]);
  let types = [e1.etype, e2.etype, e3.etype];
  let countS = types.filter(t => t === "S").length;
  let countL = types.filter(t => t === "L").length;
  if (countS === 1 && countL === 2) return "T";
  if (countS === 2 && countL === 1) return "G";
  return "?";
}

// ===== Tube Definition =====

// Our tube’s central axis runs from start to end in Cartesian space.
const start = { x: 0, y: 0, z: 0 };
const end = { x: 5, y: 7, z: 8 };

/**
 * Linear interpolation in Cartesian space.
 * @param {number} t - 0 ≤ t ≤ 1.
 * @returns {{x:number, y:number, z:number}}
 */
function interpolateLine(t) {
  return {
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y),
    z: start.z + t * (end.z - start.z)
  };
}

/**
 * Computes a discrete central axis in six‑basis.
 * For each t along the line, convert the interpolated Cartesian point to six‑basis and round.
 * @param {number} numSections
 * @returns {Array} Array of six‑vector central axis points.
 */
function getDiscreteCentralAxis(numSections) {
  let axis = [];
  for (let i = 0; i < numSections; i++) {
    let t = i / (numSections - 1);
    let cartPt = interpolateLine(t);
    let sixCont = cartesianToSixBasis(cartPt);
    let sixPt = roundSixVector(sixCont);
    axis.push(sixPt);
  }
  return axis;
}

// ===== Fixed Cross‐Section Offsets =====
// We precompute 12 allowed neighbor moves (the 12 immediate neighbors) – these are constant.
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
 * Using the 12 neighbor directions (as six‑vectors), convert them to Cartesian and project them
 * onto a fixed plane (perpendicular to the tube’s axis). Then sort by angle and choose every other one
 * to yield a 6–vertex polygon. (This set of offsets is fixed for all cross–sections.)
 * @returns {Array} Array of 6 integer six–vector offsets.
 */
function getFixedCrossSectionOffsets() {
  // First compute the tube’s axis (in Cartesian) and its perpendicular basis.
  let axisVec = { x: end.x - start.x, y: end.y - start.y, z: end.z - start.z };
  // Compute perpendicular unit vectors (v1, v2) using a helper.
  function getPerpendicularVectors(dir) {
    let mag = Math.sqrt(dir.x**2 + dir.y**2 + dir.z**2);
    let d = { x: dir.x/mag, y: dir.y/mag, z: dir.z/mag };
    let arbitrary = (Math.abs(d.x) < 0.9) ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    let v1 = {
      x: d.y * arbitrary.z - d.z * arbitrary.y,
      y: d.z * arbitrary.x - d.x * arbitrary.z,
      z: d.x * arbitrary.y - d.y * arbitrary.x
    };
    let magV1 = Math.sqrt(v1.x**2 + v1.y**2 + v1.z**2);
    v1 = { x: v1.x/magV1, y: v1.y/magV1, z: v1.z/magV1 };
    let v2 = {
      x: d.y * v1.z - d.z * v1.y,
      y: d.z * v1.x - d.x * v1.z,
      z: d.x * v1.y - d.y * v1.x
    };
    return { v1, v2 };
  }
  const { v1, v2 } = getPerpendicularVectors(axisVec);
  
  // For each neighbor direction, compute its Cartesian representation (as a vector) and then its angle.
  let candidates = neighborDirs.map(dir => {
    // Note: since these are differences, we can use sixBasisToCartesian directly.
    let cart = sixBasisToCartesian(dir);
    let dot1 = cart.x * v1.x + cart.y * v1.y + cart.z * v1.z;
    let dot2 = cart.x * v2.x + cart.y * v2.y + cart.z * v2.z;
    let angle = Math.atan2(dot2, dot1);
    return { offset: dir, angle };
  });
  // Sort by angle.
  candidates.sort((a, b) => a.angle - b.angle);
  // Choose every other candidate (to get 6 evenly spaced offsets).
  let fixedOffsets = [];
  for (let i = 0; i < candidates.length; i += 2) {
    fixedOffsets.push(candidates[i].offset);
  }
  return fixedOffsets;
}

// ===== Build the Tube Using Lego–Style Triangles =====

const numSections = 11;  // Number of cross–sections along the tube.
let centralAxis = getDiscreteCentralAxis(numSections); // Array of six–vector central points.
let crossSections = [];  // Each cross–section is an array of 6 six–vectors.

const crossOffsets = getFixedCrossSectionOffsets();  // 6 fixed offsets (each is a six–vector).

// For each central axis point, add each fixed offset to get cross–section vertices.
centralAxis.forEach(center => {
  let section = crossOffsets.map(offset => addSixVectors(center, offset));
  crossSections.push(section);
});

// Now, “extrude” the tube by connecting adjacent cross–sections.
// For each adjacent pair of sections, form quadrilaterals and split each into 2 triangles.
let triangles = [];
for (let i = 0; i < crossSections.length - 1; i++) {
  let ringA = crossSections[i];
  let ringB = crossSections[i + 1];
  let n = 6;  // since each ring has 6 vertices.
  for (let j = 0; j < n; j++) {
    let jNext = (j + 1) % n;
    // Quadrilateral vertices: A = ringA[j], B = ringB[j], C = ringB[jNext], D = ringA[jNext].
    // Form two triangles: (A, B, C) and (A, C, D)
    triangles.push({ vertices: [ ringA[j], ringB[j], ringB[jNext] ] });
    triangles.push({ vertices: [ ringA[j], ringB[jNext], ringA[jNext] ] });
  }
}

// Now, label each triangle based on its allowed edge differences.
triangles.forEach(tri => {
  tri.label = labelTriangle(tri.vertices);
});

// ===== Output the Constructed Triangles =====

console.log("Constructed Tube Tiling (each triangle with label and integer 6-vector vertices):");
triangles.forEach((tri, idx) => {
  console.log(`Triangle ${idx+1} [Type: ${tri.label}]`);
  tri.vertices.forEach((v, vi) => {
    console.log(`  Vertex ${vi+1}: [${v.join(", ")}]`);
  });
});
