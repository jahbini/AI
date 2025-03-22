// ===== Constants and Scaling =====

// The golden ratio
const phi = (1 + Math.sqrt(5)) / 2;

// In our unscaled six-basis system, a unit step (e.g. [0,0,1,0,0,0]) converts to a Cartesian vector of length:
const unscaledUnit = Math.sqrt(1 + phi * phi); // ≈ 1.902
// To have the minimal edge length be 0.4, we set:
const s = 0.4 / unscaledUnit; // scaling factor ~0.2105

// ===== Conversion Functions =====

/**
 * Converts a six-basis integer vector to Cartesian coordinates.
 * (Each six-basis point is scaled so that the minimal edge becomes 0.4.)
 *
 * Basis vectors (unscaled):
 *   b1 = ( 0,  1,  phi)
 *   b2 = ( 0, -1,  phi)
 *   b3 = ( 1,  phi, 0)
 *   b4 = (-1,  phi, 0)
 *   b5 = (phi, 0,  1)
 *   b6 = (phi, 0, -1)
 *
 * @param {number[]} coords - Array [c1, c2, c3, c4, c5, c6] (integers)
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
 * Converts Cartesian coordinates to six-basis coordinates (using the pseudoinverse).
 * (First “unscales” the coordinates before applying the inverse.)
 *
 * @param {{x: number, y: number, z: number}} point - Scaled Cartesian coordinates.
 * @returns {number[]} Array [c1, c2, c3, c4, c5, c6] (typically non-integer; will be rounded later)
 */
function cartesianToSixBasis(point) {
  const { x, y, z } = point;
  // Unscale the point to get the “raw” six-basis coordinates.
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
 * Snaps a Cartesian point to the nearest lattice point in six-basis space.
 * Returns both the integer six-vector and its (snapped) Cartesian position.
 *
 * @param {{x: number, y: number, z: number}} point - A Cartesian coordinate.
 * @returns {{six: number[], cartesian: {x:number, y:number, z:number}}}
 */
function snapToSixBasis(point) {
  let coords = cartesianToSixBasis(point);
  // Round each coordinate to the nearest integer.
  let intCoords = coords.map(Math.round);
  return { six: intCoords, cartesian: sixBasisToCartesian(intCoords) };
}

// ===== Tube Geometry Setup =====

// The tube’s central axis from (0,0,0) to (5,7,8)
const start = { x: 0, y: 0, z: 0 };
const end = { x: 5, y: 7, z: 8 };

/**
 * Linear interpolation along the central axis.
 * @param {number} t - Parameter from 0 to 1.
 * @returns {{x: number, y: number, z: number}} Point along the line.
 */
function interpolateLine(t) {
  return {
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y),
    z: start.z + t * (end.z - start.z)
  };
}

/**
 * Given the direction vector, find two perpendicular unit vectors.
 * These define a plane perpendicular to the tube axis.
 *
 * @param {{x: number, y: number, z: number}} dir - Direction vector.
 * @returns {{v1: {x:number, y:number, z:number}, v2: {x:number, y:number, z:number}}}
 */
function getPerpendicularVectors(dir) {
  // Normalize the direction vector.
  let mag = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
  let d = { x: dir.x / mag, y: dir.y / mag, z: dir.z / mag };
  // Pick an arbitrary vector not parallel to d.
  let arbitrary = (Math.abs(d.x) < 0.9) ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  // First perpendicular: cross product of d and the arbitrary vector.
  let v1 = {
    x: d.y * arbitrary.z - d.z * arbitrary.y,
    y: d.z * arbitrary.x - d.x * arbitrary.z,
    z: d.x * arbitrary.y - d.y * arbitrary.x
  };
  let magV1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  v1 = { x: v1.x / magV1, y: v1.y / magV1, z: v1.z / magV1 };
  // Second perpendicular: d cross v1.
  let v2 = {
    x: d.y * v1.z - d.z * v1.y,
    y: d.z * v1.x - d.x * v1.z,
    z: d.x * v1.y - d.y * v1.x
  };
  return { v1, v2 };
}

// Parameters for the tube construction.
const numSections = 11;         // Number of cross-sectional slices along the tube.
const verticesPerSection = 8;   // Number of vertices per cross-section (to approximate a circle).
const tubeRadius = 1.0;         // Tube radius in Cartesian coordinates.

// Build the cross-sections.
let crossSections = [];
let lineDir = { x: end.x - start.x, y: end.y - start.y, z: end.z - start.z };
let { v1, v2 } = getPerpendicularVectors(lineDir);

for (let i = 0; i < numSections; i++) {
  let t = i / (numSections - 1);
  let center = interpolateLine(t);
  let section = [];
  for (let j = 0; j < verticesPerSection; j++) {
    let angle = (2 * Math.PI * j) / verticesPerSection;
    let offset = {
      x: tubeRadius * (Math.cos(angle) * v1.x + Math.sin(angle) * v2.x),
      y: tubeRadius * (Math.cos(angle) * v1.y + Math.sin(angle) * v2.y),
      z: tubeRadius * (Math.cos(angle) * v1.z + Math.sin(angle) * v2.z)
    };
    let point = {
      x: center.x + offset.x,
      y: center.y + offset.y,
      z: center.z + offset.z
    };
    // Snap this point to the nearest six-basis lattice point.
    let snapped = snapToSixBasis(point);
    section.push(snapped);
  }
  crossSections.push(section);
}

// ===== Tessellation into Triangles =====

// For each adjacent pair of cross-sections, connect the vertices to form quadrilaterals,
// then split each quadrilateral into two triangles.
let triangles = [];
for (let i = 0; i < numSections - 1; i++) {
  for (let j = 0; j < verticesPerSection; j++) {
    let nextj = (j + 1) % verticesPerSection;
    // Vertices from two adjacent cross-sections.
    let vA = crossSections[i][j];
    let vB = crossSections[i + 1][j];
    let vC = crossSections[i + 1][nextj];
    let vD = crossSections[i][nextj];

    // Two triangles per quadrilateral.
    triangles.push({
      vertices: [vA.six, vB.six, vC.six]
    });
    triangles.push({
      vertices: [vA.six, vC.six, vD.six]
    });
  }
}

// ===== Validation of Golden Geometry =====

// Helper function: Euclidean distance between two Cartesian points.
function distance(p1, p2) {
  return Math.sqrt(
    (p1.x - p2.x) ** 2 +
    (p1.y - p2.y) ** 2 +
    (p1.z - p2.z) ** 2
  );
}

/**
 * Given a triangle (with three six-vector vertices), compute the Cartesian positions,
 * then measure its three edge lengths and decide whether it fits a golden triangle (T)
 * or a golden gnomon (G). In a golden triangle the two longer edges (legs) are equal and
 * the short edge (base) is about 1/φ of the leg; in a golden gnomon the two shorter edges
 * are equal and the long edge is about φ times them.
 *
 * @param {number[][]} sixVertices - Array of three six-vector vertices.
 * @param {number} tol - Tolerance (fractional error allowed).
 * @returns {{type: string, edges: number[]}} The determined type ("T", "G", or "?" if inconclusive) and sorted edge lengths.
 */
function validateTriangle(sixVertices, tol = 0.05) {
  // Convert each six-vector to Cartesian coordinates.
  const pts = sixVertices.map(v => sixBasisToCartesian(v));
  let d12 = distance(pts[0], pts[1]);
  let d23 = distance(pts[1], pts[2]);
  let d31 = distance(pts[2], pts[0]);
  let edges = [d12, d23, d31].sort((a, b) => a - b); // Lmin, Lmid, Lmax
  let Lmin = edges[0], Lmid = edges[1], Lmax = edges[2];
  let ratio = Lmax / Lmin;

  // Check if the ratio is close to phi.
  let ratioIsGolden = Math.abs(ratio - phi) / phi < tol;
  // Determine which pair is nearly equal.
  let lowerPairEqual = Math.abs(Lmin - Lmid) / Lmin < tol;
  let upperPairEqual = Math.abs(Lmax - Lmid) / Lmax < tol;
  let type = "?";
  if (ratioIsGolden) {
    if (upperPairEqual) {
      // Two equal longer edges => golden triangle
      type = "T";
    } else if (lowerPairEqual) {
      // Two equal shorter edges => golden gnomon
      type = "G";
    }
  }
  return { type, edges };
}

// ===== Validate and Print Triangles =====

console.log("Validated Triangles (with type, edge lengths, and integer 6-vector addresses):");
triangles.forEach((tri, idx) => {
  let validation = validateTriangle(tri.vertices);
  console.log(`Triangle ${idx + 1} [Type: ${validation.type}]`);
  console.log(`  Edge lengths (sorted): ${validation.edges.map(l => l.toFixed(4)).join(", ")}`);
  tri.vertices.forEach((v, vi) => {
    console.log(`  Vertex ${vi + 1}: [${v.join(", ")}]`);
  });
});
