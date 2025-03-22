// ----- CONSTANTS & CONVERSION FUNCTIONS -----
// Golden ratio
const phi = (1 + Math.sqrt(5)) / 2;

// Our six–basis (from the dodecahedron):
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
 * Converts an integer six–vector to scaled Cartesian coordinates.
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
 * Adds two 6–vectors.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]} a + b.
 */
function addSix(a, b) {
  return a.map((val, i) => val + b[i]);
}

// ----- CANONICAL BRICKS -----
// Define the canonical golden gnomon brick (our “brick”).
// Vertices are expressed as 6–vectors.
const GnomonCanonical = [
  [0, 0, 0, 0, 0, 0],   // A
  [0, 0, 1, 0, 0, 0],   // B
  [0, 0, 1, 0, 1, 0]    // C
];
// (By construction, edge AB and BC are short, and edge AC is the sum, a long edge.)

// ----- ROTATION OF BRICKS -----
// Since the 6–vector is overspecified, we generate rotations of our canonical brick.
// Here we rotate in the plane spanned by the 3rd and 5th coordinates.
// A rotation by angle θ transforms a vertex v as follows (only affecting indices 2 and 4):
function rotateBrick(brick, theta) {
  return brick.map(vertex => {
    let newVertex = vertex.slice(); // copy
    let x = vertex[2];
    let y = vertex[4];
    // Rotate: x' = x cosθ – y sinθ, y' = x sinθ + y cosθ.
    newVertex[2] = Math.round(x * Math.cos(theta) - y * Math.sin(theta));
    newVertex[4] = Math.round(x * Math.sin(theta) + y * Math.cos(theta));
    return newVertex;
  });
}

// For example, we can generate a few rotated bricks.
let brickSet = [];
// Identity rotation (θ = 0)
brickSet.push(GnomonCanonical);
// Rotation by 30 degrees:
brickSet.push(rotateBrick(GnomonCanonical, Math.PI / 6));
// Rotation by 60 degrees:
brickSet.push(rotateBrick(GnomonCanonical, Math.PI / 3));
// (You can generate as many as needed from the symmetry group of the lattice.)

// ----- TRANSLATION FUNCTION -----
// To place a brick at a given location (base point), simply add the base point to every vertex.
function translateBrick(brick, offset) {
  return brick.map(vertex => addSix(vertex, offset));
}

// ----- ASSEMBLE THE TUBE -----
// For the tube from (0,0,0) to (5,7,8), we first build an axis in 6–space.
// One possible integer 6–vector representation for (5,7,8) is v_end = [3, 1, 2, 1, 2, 0].
// We decompose v_end into allowed unit–steps to get a sequence of base points.
const v_end = [3, 1, 2, 1, 2, 0];
let axisSteps = [];
// For example, decompose as:
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

// Compute cumulative base points.
let basePoints = [];
let current = [0, 0, 0, 0, 0, 0];
basePoints.push(current);
axisSteps.forEach(step => {
  current = addSix(current, step);
  basePoints.push(current);
});
// (The last base point should equal [3, 1, 2, 1, 2, 0].)

// Now, at each base point, we place one of our canonical bricks.
// For demonstration, we’ll alternate among some rotations from brickSet.
let assembledTriangles = [];
basePoints.forEach((base, idx) => {
  // Pick a brick from brickSet in a cyclic fashion.
  let brick = brickSet[idx % brickSet.length];
  // Translate the canonical brick to the base point.
  let placedBrick = translateBrick(brick, base);
  // Save the brick's triangles (here the brick is a single triangle, i.e. the gnomon).
  assembledTriangles.push(placedBrick);
});

// ----- OUTPUT THE ASSEMBLED BRICKS -----
// Each brick is output as a triangle with vertices given as integer 6–vectors and Cartesian coordinates.
console.log("Tube Assembly from Canonical Bricks:");
assembledTriangles.forEach((tri, idx) => {
  console.log(`Brick ${idx + 1}:`);
  tri.forEach((vertex, vi) => {
    let cart = sixBasisToCartesian(vertex);
    console.log(`  Vertex ${vi + 1}: [${vertex.join(", ")}] --> Cartesian: (${cart.x.toFixed(3)}, ${cart.y.toFixed(3)}, ${cart.z.toFixed(3)})`);
  });
});
