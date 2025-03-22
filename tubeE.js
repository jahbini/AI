// --- SETUP: Scaling and Six-Basis Conversion ---
// We choose a scaling factor so that a unit step in the six-basis becomes our desired minimum edge length.
// (For example, if we want a unit step to be 0.4, we use s = 0.4/√(1+φ²). Here φ is the golden ratio.)
const phi = (1 + Math.sqrt(5)) / 2;
const unscaledUnit = Math.sqrt(1 + phi * phi); // ≈ 1.902
// Note: our system will yield a long edge (the sum of two unit moves) of length s * 3.236,
// which comes out about 5% above the ideal φ* (unit) value.
const s = 0.4 / unscaledUnit;  // Scaling factor (≈0.2105)

// For display, convert a six-vector to Cartesian coordinates.
function sixBasisToCartesian(coords) {
  const [c1, c2, c3, c4, c5, c6] = coords;
  let x = c3 - c4 + phi * (c5 + c6);
  let y = c1 - c2 + phi * (c3 + c4);
  let z = phi * (c1 + c2) + c5 - c6;
  return { x: s * x, y: s * y, z: s * z };
}

// --- CANONICAL BRICKS ---
// Define the canonical golden gnomon (G) brick.
// This brick has two allowed "short" edges and one allowed "long" edge.
const canonical_G = [
  [0, 0, 0, 0, 0, 0],   // A
  [0, 0, 1, 0, 0, 0],   // B = A + S  (short)
  [0, 0, 1, 0, 1, 0]    // C = B + T  (short), so A->C = S+T (long)
];

// Define the canonical golden triangle (T) brick.
// This brick is taken as the complementary piece.
// (There are several ways to define T; here we choose one that yields two long edges and one short edge.)
const canonical_T = [
  [0, 0, 0, 0, 0, 0],    // A
  [0, 0, 1, 0, 1, 0],    // B = A + (S+T)  (long)
  [0, 1, 1, 0, 1, 0]     // C = A + (S+T) + [0,1,0,0,0,0] (a unit move in a different direction)
];

// --- HELPER FUNCTIONS ---
// Adds two 6-vectors.
function addVectors(a, b) {
  return a.map((val, i) => val + b[i]);
}

// Translates a brick (an array of 6-vector vertices) by a translation vector.
function translateBrick(brick, translation) {
  return brick.map(v => addVectors(v, translation));
}

// --- TUBE AXIS DECOMPOSITION ---
// We represent the tube’s axis from (0,0,0) to (5,7,8) by an integer 6-vector.
// For this demo we choose v_end = [3, 1, 2, 1, 2, 0] (a choice that approximately maps to (5,7,8)).
// We decompose v_end into allowed unit-steps (each with one nonzero ±1).
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
  current = addVectors(current, step);
  basePoints.push(current);
});
// Now basePoints contains a sequence of integer 6-vectors along the tube’s axis.

// --- BUILDING THE TUBE HULL ---
// Here we simply “place” a brick at each base point.
// For example, we can alternate between using a canonical G brick and a canonical T brick.
// Since translation does not change the differences between vertices,
// every edge in the translated brick is exactly the same as in the canonical brick.
let finalBricks = [];
basePoints.forEach((bp, index) => {
  // Alternate: even levels use G, odd levels use T.
  let brick = (index % 2 === 0) ? canonical_G : canonical_T;
  let placedBrick = translateBrick(brick, bp);
  finalBricks.push({ type: (index % 2 === 0) ? "G" : "T", vertices: placedBrick });
});

// --- OUTPUT ---
// For each placed brick, output its type and the 6-vector coordinates of its vertices.
// (Since each brick is an exact translation of the canonical brick, every edge is exactly one of the allowed moves.)
console.log("Tube Hull Built from Canonical Bricks (G and T):");
finalBricks.forEach((brick, idx) => {
  console.log(`Brick ${idx + 1} [Type: ${brick.type}]`);
  brick.vertices.forEach((vertex, vi) => {
    let cart = sixBasisToCartesian(vertex);
    console.log(`  Vertex ${vi + 1}: [${vertex.join(", ")}]  --> Cartesian: (${cart.x.toFixed(3)}, ${cart.y.toFixed(3)}, ${cart.z.toFixed(3)})`);
  });
});
