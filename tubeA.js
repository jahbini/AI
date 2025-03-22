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
 * Converts an integer six‑vector to Cartesian coordinates.
 * @param {number[]} coords – array [c1,c2,c3,c4,c5,c6]
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

// ----- VALIDATION FUNCTION -----
// We want to check that a triangle has two short edges and one long edge.
// In our lattice an allowed short edge is a unit step (one nonzero ±1).
// An allowed long edge is the sum of two allowed short edges.
function edgeTypeAndLength(a, b) {
  let diff = b.map((val, i) => val - a[i]);
  // Count nonzero entries to decide type.
  let nonZero = diff.filter(x => x !== 0);
  let etype = "";
  if (nonZero.length === 1) {
    etype = "S"; // short edge
  } else if (nonZero.length === 2) {
    etype = "L"; // long edge
  } else {
    etype = "X"; // not allowed
  }
  let cartDiff = sixBasisToCartesian(diff);
  let len = Math.sqrt(cartDiff.x**2 + cartDiff.y**2 + cartDiff.z**2);
  return { etype, length: len };
}

/**
 * Validates a triangle (array of three six‑vector vertices).
 * For a golden module, we expect either:
 *   - Golden gnomon (G): two short edges and one long edge with long/short ≈ φ,
 *   - or Golden triangle (T): two long edges and one short edge.
 * Here our construction will tend to yield modules with two short and one long.
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
    let shortEdge = lengths[types.indexOf("S")]; // first short edge
    let longEdge = lengths[types.indexOf("L")];
    let ratio = longEdge / shortEdge;
    if (Math.abs(ratio - phi) / phi < tolRatio) {
      typeLabel = "G";
    }
  } else if (countS === 1 && countL === 2) {
    // Optionally, one could validate the golden triangle (T) here.
    typeLabel = "T";
  }
  return { type: typeLabel, lengths, edgetypes: types };
}

// ----- BUILDING THE TUBE HULL WITH DISCRETE BUILDING BLOCKS -----
//
// 1. Build the tube’s axis in six‑space.
//    We represent the Cartesian endpoint (5,7,8) with an integer six‑vector v_end.
//    For this demo, we choose v_end = [3, 1, 2, 1, 2, 0] and decompose it into allowed unit steps.
const v_end = [3, 1, 2, 1, 2, 0];
let axisSteps = [];
// 3 steps in [1,0,0,0,0,0]
for (let i = 0; i < 3; i++) axisSteps.push([1, 0, 0, 0, 0, 0]);
// 1 step in [0,1,0,0,0,0]
axisSteps.push([0, 1, 0, 0, 0, 0]);
// 2 steps in [0,0,1,0,0,0]
for (let i = 0; i < 2; i++) axisSteps.push([0, 0, 1, 0, 0, 0]);
// 1 step in [0,0,0,1,0,0]
axisSteps.push([0, 0, 0, 1, 0, 0]);
// 2 steps in [0,0,0,0,1,0]
for (let i = 0; i < 2; i++) axisSteps.push([0, 0, 0, 0, 1, 0]);

// Compute the cumulative base points along the axis.
let basePoints = [];
let current = [0, 0, 0, 0, 0, 0];
basePoints.push(current);
axisSteps.forEach(step => {
  current = addSix(current, step);
  basePoints.push(current);
});
// (For our chosen v_end, basePoints[basePoints.length - 1] equals [3,1,2,1,2,0].)

// 2. At each base point, generate a cross‑section ring of vertices.
//    We choose 4 vertices around the base point using two allowed transverse moves.
//    Here we use S and T and their negatives.
const S = [0, 0, 1, 0, 0, 0];   // allowed short step
const T = [0, 0, 0, 0, 1, 0];   // another allowed short step

function makeCrossSection(P) {
  return [
    addSix(P, S),    // P + S
    addSix(P, T),    // P + T
    addSix(P, S.map(x => -x)),  // P - S
    addSix(P, T.map(x => -x))   // P - T
  ];
}

let rings = basePoints.map(P => makeCrossSection(P));

// 3. Triangulate between adjacent rings.
//    For two consecutive rings (with the same number of vertices), “zip” them together.
//    For each index j (and next index jNext = (j+1) mod N), form two triangles per quadrilateral.
let triangles = [];
for (let i = 0; i < rings.length - 1; i++) {
  let ringA = rings[i];
  let ringB = rings[i + 1];
  let N = ringA.length; // should be 4
  for (let j = 0; j < N; j++) {
    let jNext = (j + 1) % N;
    // Triangle 1: (ringA[j], ringB[j], ringB[jNext])
    triangles.push([ringA[j], ringB[j], ringB[jNext]]);
    // Triangle 2: (ringA[j], ringB[jNext], ringA[jNext])
    triangles.push([ringA[j], ringB[jNext], ringA[jNext]]);
  }
}

// ----- OUTPUT & VALIDATION -----
console.log("Tube Hull Built from Discrete Building Blocks:");
triangles.forEach((tri, idx) => {
  let validation = validateTriangle(tri, 0.06);
  // Compute Cartesian positions for display.
  let pts = tri.map(v => sixBasisToCartesian(v));
  console.log(`Triangle ${idx + 1} [Type: ${validation.type}]`);
  console.log(`  Edge lengths: ${validation.lengths.map(l => l.toFixed(4)).join(", ")}`);
  tri.forEach((vertex, vi) => {
    let c = sixBasisToCartesian(vertex);
    console.log(`  Vertex ${vi + 1}: [${vertex.join(", ")}]  --> Cartesian: (${c.x.toFixed(3)}, ${c.y.toFixed(3)}, ${c.z.toFixed(3)})`);
  });
});
