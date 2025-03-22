// Constant: the golden ratio
const phi = (1 + Math.sqrt(5)) / 2;

// Helper: Check if a number is effectively an integer
function isInteger(value, tolerance = 1e-10) {
  return Math.abs(value - Math.round(value)) < tolerance;
}

// Check that a 6-vector has all integer components (avoiding half–increments)
function isValidSixVector(v) {
  if (v.length !== 6) {
    return false;
  }
  return v.every(comp => isInteger(comp));
}

// Arithmetic in 6–space

/**
 * Adds two 6–vectors.
 * @param {number[]} v1 - First 6–vector.
 * @param {number[]} v2 - Second 6–vector.
 * @returns {number[]} The sum v1 + v2.
 */
function addSixVectors(v1, v2) {
  if (v1.length !== 6 || v2.length !== 6) {
    throw new Error("Both vectors must be 6-dimensional.");
  }
  const result = [];
  for (let i = 0; i < 6; i++) {
    result.push(v1[i] + v2[i]);
  }
  if (!isValidSixVector(result)) {
    throw new Error("Addition resulted in non-integer components in the 6–vector.");
  }
  return result;
}

/**
 * Subtracts two 6–vectors.
 * @param {number[]} v1 - First 6–vector.
 * @param {number[]} v2 - Second 6–vector.
 * @returns {number[]} The difference v1 - v2.
 */
function subtractSixVectors(v1, v2) {
  if (v1.length !== 6 || v2.length !== 6) {
    throw new Error("Both vectors must be 6-dimensional.");
  }
  const result = [];
  for (let i = 0; i < 6; i++) {
    result.push(v1[i] - v2[i]);
  }
  if (!isValidSixVector(result)) {
    throw new Error("Subtraction resulted in non-integer components in the 6–vector.");
  }
  return result;
}

/**
 * Scales a 6–vector by an integer factor.
 * @param {number[]} v - A 6–vector.
 * @param {number} factor - The scaling factor (must be integer).
 * @returns {number[]} The scaled vector.
 */
function scaleSixVector(v, factor) {
  if (v.length !== 6) {
    throw new Error("Vector must be 6-dimensional.");
  }
  const result = v.map(comp => comp * factor);
  if (!isValidSixVector(result)) {
    throw new Error("Scaling resulted in non-integer components.");
  }
  // Map components to integers explicitly (they should already be integers)
  return result.map(comp => Math.round(comp));
}

// Conversion between 6–vector (our φ–lattice representation) and Cartesian coordinates

/**
 * Converts a 6–vector to Cartesian coordinates.
 * Our conversion is defined as:
 *    x = c + d + φ·(e + f)
 *    y = a + b + φ·(c – d)
 *    z = φ·(a – b) + (e – f)
 *
 * @param {number[]} six - Array [a, b, c, d, e, f].
 * @returns {Object} An object with properties x, y, z.
 */
function sixToCartesian(six) {
  if (six.length !== 6) {
    throw new Error("Input must be a 6–vector.");
  }
  const [a, b, c, d, e, f] = six;
  const x = c + d + phi * (e + f);
  const y = a + b + phi * (c - d);
  const z = phi * (a - b) + (e - f);
  return { x, y, z };
}

/**
 * Converts Cartesian coordinates back into a 6–vector.
 * We require that each Cartesian coordinate is exactly represented as:
 *    value = (integer part) + φ × (phi part)
 * The input must be given in the form:
 *    { x: { int: X0, phi: X1 }, y: { int: Y0, phi: Y1 }, z: { int: Z0, phi: Z1 } }
 *
 * The inversion formulas are:
 *    a = (Y0 + Z1) / 2,    b = (Y0 - Z1) / 2
 *    c = (X0 + Y1) / 2,    d = (X0 - Y1) / 2
 *    e = (X1 + Z0) / 2,    f = (X1 - Z0) / 2
 *
 * @param {Object} cartesian - Cartesian coordinates with φ–decomposition.
 * @returns {number[]} A 6–vector [a, b, c, d, e, f].
 */
function cartesianToSix(cartesian) {
  const { x, y, z } = cartesian;
  const X0 = x.int, X1 = x.phi;
  const Y0 = y.int, Y1 = y.phi;
  const Z0 = z.int, Z1 = z.phi;
  
  const a = (Y0 + Z1) / 2;
  const b = (Y0 - Z1) / 2;
  const c = (X0 + Y1) / 2;
  const d = (X0 - Y1) / 2;
  const e = (X1 + Z0) / 2;
  const f = (X1 - Z0) / 2;
  
  const result = [a, b, c, d, e, f];
  if (!isValidSixVector(result)) {
    throw new Error("Conversion from Cartesian produced non-integer six–vector components.");
  }
  return result;
}

// --- Example Usage ---

// Define two example 6–vectors from our canonical brick definitions:
const goldenTriangleEdge1 = [1, -1, 0, 0, 1, 0]; // (e.g., T₁)
const goldenTriangleEdge2 = [0, 1, 1, 0, 0, -1]; // (e.g., T₂)

try {
  // Add two 6–vectors (this corresponds to laying bricks by vector addition)
  const sumSixVector = addSixVectors(goldenTriangleEdge1, goldenTriangleEdge2);
  console.log("Sum 6–vector:", sumSixVector);
  
  // Convert the resulting 6–vector to Cartesian coordinates
  const cartesianCoords = sixToCartesian(sumSixVector);
  console.log("Cartesian coordinates:", cartesianCoords);
  
  // To convert back from Cartesian to 6–vector, we need the coordinates decomposed in the φ–lattice form.
  // Here we assume the Cartesian input is given as { int, phi } for each coordinate.
  // (In practice, this decomposition must be done carefully; here we provide a sample input.)
  const cartesianDecomposed = {
    x: { int: 0, phi: 2 },  // Example values – these must come from a proper φ–lattice decomposition.
    y: { int: 0, phi: 0 },
    z: { int: 0, phi: 0 }
  };
  const sixFromCartesian = cartesianToSix(cartesianDecomposed);
  console.log("Recovered 6–vector from Cartesian:", sixFromCartesian);
  
  // Additional arithmetic: subtracting two 6–vectors
  const diffSixVector = subtractSixVectors(goldenTriangleEdge1, goldenTriangleEdge2);
  console.log("Difference 6–vector:", diffSixVector);
  
  // Scaling a 6–vector by an integer factor (e.g., doubling a brick’s displacement)
  const scaledSixVector = scaleSixVector(goldenTriangleEdge1, 2);
  console.log("Scaled 6–vector (factor 2):", scaledSixVector);
  
} catch (error) {
  console.error("Error during 6–vector arithmetic:", error);
}
