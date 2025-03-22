// Define the golden ratio
const phi = (1 + Math.sqrt(5)) / 2;
const D = 4 + 2 * phi; // Denominator used in the inverse conversion

/**
 * Converts six-basis coordinates to standard Cartesian coordinates.
 * The six basis vectors (b1 ... b6) are defined as:
 *   b1 = (0,  1,  phi)
 *   b2 = (0, -1,  phi)
 *   b3 = (1,  phi, 0)
 *   b4 = (-1, phi, 0)
 *   b5 = (phi, 0,  1)
 *   b6 = (phi, 0, -1)
 *
 * @param {number[]} coords - Array [c1, c2, c3, c4, c5, c6] (typically integers)
 * @returns {{x: number, y: number, z: number}} Cartesian coordinates.
 */
function sixBasisToCartesian(coords) {
  const [c1, c2, c3, c4, c5, c6] = coords;
  
  const x = c3 - c4 + phi * (c5 + c6);
  const y = c1 - c2 + phi * (c3 + c4);
  const z = phi * (c1 + c2) + c5 - c6;
  
  return { x, y, z };
}

/**
 * Converts standard Cartesian coordinates to six-basis coordinates.
 * Note: Because the six basis vectors are overcomplete (there are 6 vs. 3 dimensions),
 * this uses the minimal-norm (Moore-Penrose pseudoinverse) solution.
 *
 * The formulas are:
 *   c1 = ( y + phi*z ) / D
 *   c2 = ( -y + phi*z ) / D
 *   c3 = ( x + phi*y ) / D
 *   c4 = ( -x + phi*y ) / D
 *   c5 = ( phi*x + z ) / D
 *   c6 = ( phi*x - z ) / D
 *
 * @param {{x: number, y: number, z: number}} point - Cartesian coordinates.
 * @returns {number[]} Array [c1, c2, c3, c4, c5, c6] representing the six-basis coordinates.
 */
function cartesianToSixBasis(point) {
  const { x, y, z } = point;
  
  const c1 = (y + phi * z) / D;
  const c2 = (-y + phi * z) / D;
  const c3 = (x + phi * y) / D;
  const c4 = (-x + phi * y) / D;
  const c5 = (phi * x + z) / D;
  const c6 = (phi * x - z) / D;
  
  return [c1, c2, c3, c4, c5, c6];
}

// Example usage:

// Suppose a triangle’s edge is "addressed" by the six integers below.
const sixCoords = [3, -2, 5, 1, 0, -4];
console.log("Six Coords",sixCoords);

const cartesianPoint = sixBasisToCartesian(sixCoords);
console.log("Cartesian coordinates:", cartesianPoint);

// Converting back (note: due to the non-uniqueness, this recovers the minimal-norm representation)
const recoveredSixCoords = cartesianToSixBasis(cartesianPoint);
console.log("Recovered six-basis coordinates:", recoveredSixCoords);
