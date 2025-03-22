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
// In the unscaled system a unit (short) step has length = √(1+φ²).
// We choose the scaling factor so that a unit step becomes 0.4.
const unscaledUnit = Math.sqrt(1 + phi * phi); // ≈ 1.902
const s = 0.4 / unscaledUnit;  // ≈ 0.2105

/**
 * Converts an integer six‑vector to Cartesian coordinates.
 * @param {number[]} coords – an array [c1,c2,c3,c4,c5,c6]
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
 * @param {{x:number, y:number, z:number}} point – Cartesian coordinates.
 * @returns {number[]} 6-vector (usually non‑integer; round for lattice use)
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
// In our lattice an allowed short edge is a unit step (one entry ±1, all others 0).
// An allowed long edge is the sum of two allowed short edges (here, we use S+T).
function edgeTypeAndLength(a, b) {
  let d = b.map((val, i) => val - a[i]);
  // Determine edge “type” by counting nonzero entries.
  let nonZero = d.filter(x => x !== 0);
  let etype = "";
  if (nonZero.length === 1) {
    etype = "S"; // short edge
  } else if (nonZero.length === 2) {
    etype = "L"; // long edge
  } else {
    etype = "X"; // not allowed
  }
  let cart = sixBasisToCartesian(d);
  let len = Math.sqrt(cart.x * cart.x + cart.y * cart.y + cart.z * cart.z);
  return { etype, length: len };
}

/**
 * Validates a triangle given by three six‑vector vertices.
 * For a golden gnomon we expect two short edges and one long edge,
 * with the ratio long/short ≈ φ (within a small tolerance).
 * @param {number[][]} vertices – array of three six‑vectors.
 * @param {number} tolRatio – fractional tolerance for long/short ratio.
 * @returns {{type: string, lengths: number[], edgetypes: string[]}}
 */
function validateTriangle(vertices, tolRatio = 0.06) {
  let e1 = edgeTypeAndLength(vertices[0], vertices[1]);
  let e2 = edgeTypeAndLength(vertices[1], vertices[2]);
  let e3 = edgeTypeAndLength(vertices[2], vertices[0]);
  let types = [e1.etype, e2.etype, e3.etype];
  let lengths = [e1.length, e2.length, e3.length];
  // For a golden gnomon, we expect pattern: two short edges and one long edge.
  let countS = types.filter(t => t === "S").length;
  let countL = types.filter(t => t === "L").length;
  let typeLabel = "?";
  if (countS === 2 && countL === 1) {
    // Identify which edge is long.
    let shortEdge = lengths[types.indexOf("S")]; // first occurrence
    let longEdge = lengths[types.indexOf("L")];
    let ratio = longEdge / shortEdge;
    if (Math.abs(ratio - phi) / phi < tolRatio) {
      typeLabel = "G";
    }
  }
  return { type: typeLabel, lengths, edgetypes: types };
}

// ----- TILING THE TUBE WITH LEGO‐LIKE TRIANGLES -----
//
// Our approach here is “constructive.” We fix our building block—a golden gnomon triangle.
// Its vertices (in six‑space) are defined relative to a base lattice point P as follows:
//   A = P
//   B = P + S, where S = [0,0,1,0,0,0]  (an allowed short step)
//   C = P + S + T, where T = [0,0,0,0,1,0]  (so that B→C = T is short,
//      and A→C = S+T is a long edge).
//
// We now “extrude” the tube’s axis by choosing a series of base points along it.
// (Our desired endpoint (5,7,8) in Cartesian is represented in six‑space as an integer vector.
// For this demo we set that vector to be v_end = [3, 1, 2, 1, 2, 0].)
// We then decompose v_end into allowed unit‐steps. (Allowed unit‐steps are the 12 vectors
// with one nonzero entry of ±1.) In our example we choose:
//
 //  3 steps in [1,0,0,0,0,0]
 //  1 step in [0,1,0,0,0,0]
 //  2 steps in [0,0,1,0,0,0]
 //  1 step in [0,0,0,1,0,0]
 //  2 steps in [0,0,0,0,1,0]
//
// The cumulative sum of these 9 steps gives a series of 10 base points along the tube’s axis.
// (For simplicity we ignore the 6th coordinate here since it is 0 in our chosen v_end.)
//
// Then at each base point P we “place” a golden gnomon triangle as defined above.
//

// Define our two fixed allowed differences:
const S = [0, 0, 1, 0, 0, 0];  // short step
const T = [0, 0, 0, 0, 1, 0];  // short step (used so that S+T becomes a long edge)

// Define the target endpoint in six‑space (for our tube’s axis)
const v_end = [3, 1, 2, 1, 2, 0];

// Define a sequence of allowed unit steps that sum to v_end.
// (Here we hard‐code the decomposition based on v_end’s components.)
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

// Verify that the sum equals v_end.
let sumAxis = [0, 0, 0, 0, 0, 0];
axisSteps.forEach(step => {
  sumAxis = addSix(sumAxis, step);
});
// (For our chosen v_end, sumAxis should equal [3,1,2,1,2,0].)

// Compute base points along the axis.
let basePoints = [];
let current = [0, 0, 0, 0, 0, 0];
basePoints.push(current);
axisSteps.forEach(step => {
  current = addSix(current, step);
  basePoints.push(current);
});

// Now, at each base point, place one golden gnomon triangle.
// That is, for each base point P, define vertices:
function makeGnomonAt(P) {
  let A = P;
  let B = addSix(P, S);
  let C = addSix(B, T);  // which is P + S + T
  return [A, B, C];
}

// Build the list of triangles.
let triangles = [];
basePoints.forEach(P => {
  let tri = makeGnomonAt(P);
  triangles.push(tri);
});

// ----- OUTPUT & VALIDATION -----
console.log("Built Tube from Lego‐like Golden Gnomon Triangles:");
triangles.forEach((tri, idx) => {
  let validation = validateTriangle(tri, 0.06);
  // Compute Cartesian positions for display.
  let pts = tri.map(v => sixBasisToCartesian(v));
  console.log(`Triangle ${idx + 1} [Type: ${validation.type}]`);
  console.log(`  Edge lengths: ${validation.lengths.map(l => l.toFixed(4)).join(", ")}`);
  tri.forEach((vertex, vi) => {
    console.log(`  Vertex ${vi + 1}: [${vertex.join(", ")}]  --> Cartesian: (${pts[vi].x.toFixed(3)}, ${pts[vi].y.toFixed(3)}, ${pts[vi].z.toFixed(3)})`);
  });
});
