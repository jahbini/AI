// ===== Constants and Scaling =====

// The golden ratio
const phi = (1 + Math.sqrt(5)) / 2;

// In our unscaled six‑basis system, a “unit” step (e.g. [0,0,1,0,0,0])
// converts to a Cartesian vector of length approximately sqrt(1 + phi^2).
const unscaledUnit = Math.sqrt(1 + phi * phi); // ~1.902
// To have the minimal edge length be 0.4, we set a scaling factor:
const s = 0.4 / unscaledUnit; // ~0.2105

// ===== Conversion Functions =====

/**
 * Converts a six‑basis integer vector to Cartesian coordinates.
 * (Uses the six basis below, scaled so that a minimal edge is 0.4.)
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
 * Converts Cartesian coordinates to six‑basis coordinates (using pseudoinverse).
 * (Coordinates are “unscaled” first.)
 *
 * @param {{x: number, y: number, z: number}} point - Scaled Cartesian coordinates.
 * @returns {number[]} Array [c1, c2, c3, c4, c5, c6] (typically non‐integer).
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
 * Snaps a Cartesian point to its nearest six‑basis lattice point.
 *
 * @param {{x: number, y: number, z: number}} point - A Cartesian coordinate.
 * @returns {{six: number[], cartesian: {x:number, y:number, z:number}}}
 */
function snapToSixBasis(point) {
  let coords = cartesianToSixBasis(point);
  let intCoords = coords.map(Math.round);
  return { six: intCoords, cartesian: sixBasisToCartesian(intCoords) };
}

// ===== Global Tube Setup =====

// The tube’s central axis from (0,0,0) to (5,7,8)
const start = { x: 0, y: 0, z: 0 };
const end = { x: 5, y: 7, z: 8 };

/**
 * Linear interpolation along the axis.
 * @param {number} t - Parameter from 0 to 1.
 * @returns {{x: number, y: number, z: number}} Point on the line.
 */
function interpolateLine(t) {
  return {
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y),
    z: start.z + t * (end.z - start.z)
  };
}

/**
 * Given the tube’s direction, return two perpendicular unit vectors.
 * These define the plane in which envelope cross–sections are measured.
 *
 * @param {{x: number, y: number, z: number}} dir - Direction vector.
 * @returns {{v1: {x:number, y:number, z:number}, v2: {x:number, y:number, z:number}}}
 */
function getPerpendicularVectors(dir) {
  let mag = Math.hypot(dir.x, dir.y, dir.z);
  let d = { x: dir.x / mag, y: dir.y / mag, z: dir.z / mag };
  // Choose an arbitrary vector not parallel to d.
  let arbitrary = (Math.abs(d.x) < 0.9) ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  let v1 = {
    x: d.y * arbitrary.z - d.z * arbitrary.y,
    y: d.z * arbitrary.x - d.x * arbitrary.z,
    z: d.x * arbitrary.y - d.y * arbitrary.x
  };
  let magV1 = Math.hypot(v1.x, v1.y, v1.z);
  v1 = { x: v1.x / magV1, y: v1.y / magV1, z: v1.z / magV1 };
  let v2 = {
    x: d.y * v1.z - d.z * v1.y,
    y: d.z * v1.x - d.x * v1.z,
    z: d.x * v1.y - d.y * v1.x
  };
  return { v1, v2 };
}

// Precompute perpendicular vectors for the entire tube.
let lineDir = { x: end.x - start.x, y: end.y - start.y, z: end.z - start.z };
const { v1, v2 } = getPerpendicularVectors(lineDir);

// ===== Envelope Cross–Section Generation =====

/**
 * For a given parameter t along the tube’s axis, compute a cross–section
 * of lattice points that form the “closest envelope.” This is done by:
 *   1. Snapping the central (interpolated) point to the lattice.
 *   2. Generating its immediate neighbors (Manhattan distance 1).
 *   3. Projecting these candidate points (neighbors only) onto the (v1,v2) plane.
 *   4. Dividing the circle into a fixed number of sectors (here, 12) and, in each sector,
 *      selecting the candidate with the minimum radial distance.
 *   5. If a sector is empty, a fallback candidate (the overall closest) is used.
 *
 * @param {number} t - Parameter along the axis (0 to 1).
 * @param {number} sectors - Number of sectors to force in the envelope.
 * @returns {Array} Array (length = sectors) of candidate objects { six, cartesian, angle, radial }.
 */
function getEnvelopeCrossSection(t, sectors = 12) {
  // Central point along axis and its lattice snap.
  let center = interpolateLine(t);
  let centerSnap = snapToSixBasis(center);
  let centerSix = centerSnap.six;
  let centerCart = centerSnap.cartesian;
  
  // Generate candidate neighbors (Manhattan distance 1).
  let candidates = [];
  for (let i = 0; i < 6; i++) {
    for (let delta of [1, -1]) {
      let candidate = [...centerSix];
      candidate[i] += delta;
      // Avoid duplicate candidates.
      if (!candidates.some(c => c.join(',') === candidate.join(','))) {
        candidates.push(candidate);
      }
    }
  }
  
  // Project each candidate onto the (v1,v2) plane relative to center.
  let projected = candidates.map(six => {
    let cart = sixBasisToCartesian(six);
    let dx = cart.x - centerCart.x;
    let dy = cart.y - centerCart.y;
    let dz = cart.z - centerCart.z;
    // Dot product with v1 and v2.
    let u = dx * v1.x + dy * v1.y + dz * v1.z;
    let w = dx * v2.x + dy * v2.y + dz * v2.z;
    let angle = Math.atan2(w, u);
    if (angle < 0) angle += 2 * Math.PI;
    let radial = Math.hypot(u, w);
    return { six, cartesian: cart, angle, radial };
  });
  
  // For each of the given sectors, choose the candidate with minimum radial distance.
  let sectorSize = 2 * Math.PI / sectors;
  let envelope = new Array(sectors).fill(null);
  for (let i = 0; i < sectors; i++) {
    let sectorStart = i * sectorSize;
    let sectorEnd = (i + 1) * sectorSize;
    let candidatesInSector = projected.filter(c => {
      // Place candidate in sector if its angle lies between sectorStart and sectorEnd.
      return (c.angle >= sectorStart && c.angle < sectorEnd);
    });
    if (candidatesInSector.length > 0) {
      // Choose candidate with smallest radial distance.
      let chosen = candidatesInSector.reduce((a, b) => a.radial < b.radial ? a : b);
      envelope[i] = chosen;
    }
  }
  // If any sector remains empty, fill it with the overall closest candidate.
  let overallClosest = projected.reduce((a, b) => a.radial < b.radial ? a : b);
  envelope = envelope.map(c => c === null ? overallClosest : c);
  // Sort envelope by angle (for consistent ordering).
  envelope.sort((a, b) => a.angle - b.angle);
  return envelope;
}

// ===== Build Tube Cross–Sections =====

const numSections = 11;   // Number of samples along the axis.
const sectors = 12;       // Fixed number of envelope points per cross–section.
let crossSections = [];   // Each cross-section is an array of 12 candidate objects.

for (let i = 0; i < numSections; i++) {
  let t = i / (numSections - 1);
  let cross = getEnvelopeCrossSection(t, sectors);
  crossSections.push(cross);
}

// ===== Tessellate the Tube Surface =====

// We now connect each adjacent pair of cross–sections by matching their envelope vertices.
// (Because each cross–section has exactly 'sectors' vertices, we can simply pair by index.)
let triangles = [];
for (let i = 0; i < numSections - 1; i++) {
  let sectionA = crossSections[i];
  let sectionB = crossSections[i + 1];
  for (let j = 0; j < sectors; j++) {
    // Wrap indices cyclically.
    let nextj = (j + 1) % sectors;
    // Quadrilateral from sectionA[j], sectionB[j], sectionB[nextj], sectionA[nextj].
    // Split into two triangles.
    triangles.push({
      // Triangle 1: A[j], B[j], B[nextj]
      vertices: [sectionA[j].six, sectionB[j].six, sectionB[nextj].six]
    });
    triangles.push({
      // Triangle 2: A[j], B[nextj], A[nextj]
      vertices: [sectionA[j].six, sectionB[nextj].six, sectionA[nextj].six]
    });
  }
}

// ===== Output the Triangulated Tube =====

console.log("Tube Triangles (each with integer six–vector addresses for vertices):");
triangles.forEach((tri, idx) => {
  console.log(`Triangle ${idx + 1}:`);
  tri.vertices.forEach((v, vi) => {
    console.log(`  Vertex ${vi + 1}: [${v.join(", ")}]`);
  });
});
