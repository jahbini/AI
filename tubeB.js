// ----- CONSTANTS & CONVERSION FUNCTIONS -----

// Golden ratio
const phi = (1 + Math.sqrt(5)) / 2;

// Our six‑basis (derived from the dodecahedron) is defined by:
//   b1 = (0,  1,  φ)
//   b2 = (0, -1,  φ)
//   b3 = (1,  φ,  0)
//   b4 = (-1, φ,  0)
//   b5 = (φ,  0,  1)
//   b6 = (φ,  0, -1)
// In the unscaled system a unit (short) step (one nonzero ±1) has length = √(1+φ²).
// We choose the scaling factor so that a unit step becomes 0.4.
const unscaledUnit = Math.sqrt(1 + phi * phi); // ≈ 1.902
const s = 0.4 / unscaledUnit;  // ≈ 0.2105

/**
 * Converts an integer six‑vector to scaled Cartesian coordinates.
 * @param {number[]} coords – array [c1, c2, c3, c4, c5, c6]
 * @returns {{x:number, y:number, z:number}} Scaled Cartesian coordinates.
 */
function sixBasisToCartesian(coords) {
  const [c1, c2, c3, c4, c5, c6] = coords;
  let x = c3 - c4 + phi * (c5 + c6);
  let y = c1 - c2 + phi * (c3 + c4);
  let z = phi * (c1 + c2) + c5 - c6;
  return { x: s * x, y: s * y, z: s * z };
}

/**
 * Converts Cartesian coordinates to six‑basis (using the pseudoinverse).
 * @param {{x:number, y:number, z:number}} point – Cartesian point.
 * @returns {number[]} 6‑vector (non‑integer; round for lattice use)
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
 * @param {number[]} v
 * @returns {number[]} Rounded six‑vector.
 */
function roundSixVector(v) {
  return v.map(Math.round);
}

/**
 * Adds two six‑vectors.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]} a+b.
 */
function addSix(a, b) {
  return a.map((val, i) => val + b[i]);
}

// ----- DEFINE ALLOWED TRANSVERSE MOVES -----
// These moves are used to build cross‐sections perpendicular to the tube's axis.
const S = [0, 0, 1, 0, 0, 0];   // Allowed short step (transverse direction 1)
const T = [0, 0, 0, 0, 1, 0];   // Allowed short step (transverse direction 2)

// ----- VALIDATION FUNCTION -----
// Allowed moves: a short edge is a unit step (one nonzero ±1); a long edge is the sum of two short edges.
function edgeTypeAndLength(a, b) {
  let diff = b.map((val, i) => val - a[i]);
  let nonZero = diff.filter(x => x !== 0);
  let etype = "";
  if (nonZero.length === 1) {
    etype = "S"; // short
  } else if (nonZero.length === 2) {
    etype = "L"; // long
  } else {
    etype = "X"; // invalid
  }
  let cartDiff = sixBasisToCartesian(diff);
  let len = Math.sqrt(cartDiff.x**2 + cartDiff.y**2 + cartDiff.z**2);
  return { etype, length: len };
}

/**
 * Validates a triangle (three six‑vector vertices).
 * Expects either:
 *   - Golden gnomon (G): two short edges and one long edge (ratio long/short ≈ φ),
 *   - or Golden triangle (T): two long edges and one short edge.
 * @param {number[][]} vertices
 * @param {number} tolRatio – tolerance for the ratio.
 * @returns {{type: string, lengths: number[], edgetypes: string[]}}
 */
function validateTriangle(vertices, tolRatio = 0.06) {
  let e1 = edgeTypeAndLength(vertices[0], vertices[1]);
  let e2 = edgeTypeAndLength(vertices[1], vertices[2]);
  let e3 = edgeTypeAndLength(vertices[2], vertices[0]);
  let types = [e1.etype, e2.etype, e3.etype];
  let lengths = [e1.length, e2.length, e3.length];
  let countS = types.filter(t => t === "S").length;
  let countL = types.filter(t => t === "L").length;
  let typeLabel = "?";
  if (countS === 2 && countL === 1) {
    let shortEdge = lengths[types.indexOf("S")];
    let longEdge = lengths[types.indexOf("L")];
    let ratio = longEdge / shortEdge;
    if (Math.abs(ratio - phi) / phi < tolRatio) {
      typeLabel = "G";
    }
  } else if (countS === 1 && countL === 2) {
    typeLabel = "T";
  }
  return { type: typeLabel, lengths, edgetypes: types };
}

// ----- BUILDING THE TUBE HULL WITH EXACT TRIANGLES (BRICKLAYER STYLE) -----

// 1. Build the axis in six‑space.
// Represent (5,7,8) by v_end = [3,1,2,1,2,0] and decompose it into allowed unit steps.
const v_end = [3, 1, 2, 1, 2, 0];
let axisSteps = [];
// 3 steps in [1,0,0,0,0,0]
for (let i = 0; i < 3; i++) axisSteps.push([1,0,0,0,0,0]);
// 1 step in [0,1,0,0,0,0]
axisSteps.push([0,1,0,0,0,0]);
// 2 steps in [0,0,1,0,0,0]
for (let i = 0; i < 2; i++) axisSteps.push([0,0,1,0,0,0]);
// 1 step in [0,0,0,1,0,0]
axisSteps.push([0,0,0,1,0,0]);
// 2 steps in [0,0,0,0,1,0]
for (let i = 0; i < 2; i++) axisSteps.push([0,0,0,0,1,0]);

// Compute cumulative base points along the axis.
let basePoints = [];
let current = [0,0,0,0,0,0];
basePoints.push(current);
axisSteps.forEach(step => {
  current = addSix(current, step);
  basePoints.push(current);
});
// (The last base point should equal [3,1,2,1,2,0].)

// 2. At each base point P, build the cross–section using exact building–block triangles.
// We form a complete ring by placing two triangles that exactly cover a region around P.
// Define three vertices relative to P:
//   U = P + S
//   V = P + T
//   W = P + S + T
// Then form two triangles:
//   T_upper = (P, U, W)
//   T_lower = (P, W, V)
function makeCrossSectionTriangles(P) {
  const U = addSix(P, S);
  const V = addSix(P, T);
  const W = addSix(P, addSix(S, T)); // P + S + T
  return { upper: [P, U, W], lower: [P, W, V], vertices: { U, V, W } };
}

// 3. For each adjacent pair of base points, connect the cross–sections with additional triangles.
// Let the cross–section at P be (U, V, W) and at Q be (U', V', W').
// We form connecting quadrilaterals on the "upper" and "lower" sides and split each quadrilateral into two triangles.
// Upper connection (from U, W at level P to U', W' at level Q):
//   C_upper1: (U, U', W')
//   C_upper2: (U, W', W)
// Lower connection (from V, W at level P to V', W' at level Q):
//   C_lower1: (V, W, W')
//   C_lower2: (V, W', V')
let crossSections = basePoints.map(P => makeCrossSectionTriangles(P));
let hullTriangles = [];

// Place the cross–section triangles (the "bricklayer" layer at each base point)
crossSections.forEach(cs => {
  hullTriangles.push(cs.upper);
  hullTriangles.push(cs.lower);
});

// Connect adjacent levels.
for (let i = 0; i < crossSections.length - 1; i++) {
  let cs1 = crossSections[i].vertices;   // { U, V, W } at level i
  let cs2 = crossSections[i+1].vertices;   // { U', V', W' } at level i+1

  // Upper connection quadrilateral: (U, W, W', U')
  // Triangle 1: (U, U', W')
  hullTriangles.push([cs1.U, cs2.U, cs2.W]);
  // Triangle 2: (U, W', W)
  hullTriangles.push([cs1.U, cs2.W, cs1.W]);

  // Lower connection quadrilateral: (V, W, W', V')
  // Triangle 3: (V, W, W')
  hullTriangles.push([cs1.V, cs1.W, cs2.W]);
  // Triangle 4: (V, W', V')
  hullTriangles.push([cs1.V, cs2.W, cs2.V]);
}

// ----- OUTPUT & VALIDATION -----
console.log("Tube Hull Built with Exact Building–Block Triangles:");
hullTriangles.forEach((tri, idx) => {
  let validation = validateTriangle(tri, 0.06);
  let pts = tri.map(v => sixBasisToCartesian(v));
  console.log(`Triangle ${idx + 1} [Type: ${validation.type}]`);
  console.log(`  Edge lengths: ${validation.lengths.map(l => l.toFixed(4)).join(", ")}`);
  tri.forEach((vertex, vi) => {
    let cart = sixBasisToCartesian(vertex);
    console.log(`  Vertex ${vi + 1}: [${vertex.join(", ")}] --> Cartesian: (${cart.x.toFixed(3)}, ${cart.y.toFixed(3)}, ${cart.z.toFixed(3)})`);
  });
});
