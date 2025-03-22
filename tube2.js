// Define the golden ratio
const phi = (1 + Math.sqrt(5)) / 2;
const D = 4 + 2 * phi; // Denominator used in the inverse conversion

// Scaling factor to ensure that a unit step in the six-basis equals 0.4 in Cartesian space
const s = 0.4 / Math.sqrt(1 + phi * phi);  // ~0.4 / 1.902 ≈ 0.210

/**
 * Converts six-basis coordinates (with integer addresses) to scaled Cartesian coordinates.
 * The six basis vectors are defined as:
 *   b1 = (0,  1,  phi)
 *   b2 = (0, -1,  phi)
 *   b3 = (1,  phi, 0)
 *   b4 = (-1, phi, 0)
 *   b5 = (phi, 0,  1)
 *   b6 = (phi, 0, -1)
 *
 * The final Cartesian coordinates are scaled by s so that a unit step corresponds to 0.4 units.
 *
 * @param {number[]} coords - Array [c1, c2, c3, c4, c5, c6] (integers)
 * @returns {{x: number, y: number, z: number}} Scaled Cartesian coordinates.
 */
function sixBasisToCartesian(coords) {
  const [c1, c2, c3, c4, c5, c6] = coords;
  
  // Compute unscaled Cartesian coordinates
  const x_unscaled = c3 - c4 + phi * (c5 + c6);
  const y_unscaled = c1 - c2 + phi * (c3 + c4);
  const z_unscaled = phi * (c1 + c2) + c5 - c6;
  
  // Scale the coordinates
  return { 
    x: s * x_unscaled, 
    y: s * y_unscaled, 
    z: s * z_unscaled 
  };
}

/**
 * Converts scaled Cartesian coordinates to six-basis coordinates.
 * Because the six basis vectors are overcomplete, we use the Moore-Penrose pseudoinverse.
 * The input Cartesian coordinates are first unscaled (divided by s) before applying the inverse formulas.
 *
 * The formulas are:
 *   c1 = ( y_unscaled + phi*z_unscaled ) / D
 *   c2 = ( -y_unscaled + phi*z_unscaled ) / D
 *   c3 = ( x_unscaled + phi*y_unscaled ) / D
 *   c4 = ( -x_unscaled + phi*y_unscaled ) / D
 *   c5 = ( phi*x_unscaled + z_unscaled ) / D
 *   c6 = ( phi*x_unscaled - z_unscaled ) / D
 *
 * @param {{x: number, y: number, z: number}} point - Scaled Cartesian coordinates.
 * @returns {number[]} Array [c1, c2, c3, c4, c5, c6] representing the six-basis coordinates.
 */
function cartesianToSixBasis(point) {
  const { x, y, z } = point;
  
  // Unscale the coordinates to get the original (unscaled) values
  const x_unscaled = x / s;
  const y_unscaled = y / s;
  const z_unscaled = z / s;
  
  const c1 = (y_unscaled + phi * z_unscaled) / D;
  const c2 = (-y_unscaled + phi * z_unscaled) / D;
  const c3 = (x_unscaled + phi * y_unscaled) / D;
  const c4 = (-x_unscaled + phi * y_unscaled) / D;
  const c5 = (phi * x_unscaled + z_unscaled) / D;
  const c6 = (phi * x_unscaled - z_unscaled) / D;
  
  return [c1, c2, c3, c4, c5, c6];
}

// Example usage:

// Suppose a robot assigns an integer address to a triangle edge:
const sixCoords = [3, -2, 5, 1, 0, -4];  // Integer coordinates
const cartesianPoint = sixBasisToCartesian(sixCoords);
console.log("Scaled Cartesian coordinates:", cartesianPoint);

// Converting back (note: due to overcompleteness, this recovers the minimal-norm representation)
const recoveredSixCoords = cartesianToSixBasis(cartesianPoint);
console.log("Recovered six-basis coordinates:", recoveredSixCoords);
