// Function to convert a 6D vector into Cartesian coordinates
function sixBaseToCartesian(vector) {
    if (vector.length !== 6) {
        throw new Error("Input vector must have exactly 6 components.");
    }

    let [X, Y, Z, U, V, W] = vector;

    // Define unit cube vertices mapped onto a dodecahedron
    let unitVertices = [
        [1, 1, 1], [-1, 1, 1], [1, -1, 1], [-1, -1, 1],
        [1, 1, -1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1]
    ];

    // Convert (U, V, W) into rotation angles (normalized)
    let angleU = (U * Math.PI) / 5; // Rotation around X-axis
    let angleV = (V * Math.PI) / 5; // Rotation around Y-axis
    let angleW = (W * Math.PI) / 5; // Rotation around Z-axis

    // Rotation matrices
    function rotateX(p, angle) {
        let [x, y, z] = p;
        return [
            x,
            y * Math.cos(angle) - z * Math.sin(angle),
            y * Math.sin(angle) + z * Math.cos(angle)
        ];
    }

    function rotateY(p, angle) {
        let [x, y, z] = p;
        return [
            x * Math.cos(angle) + z * Math.sin(angle),
            y,
            -x * Math.sin(angle) + z * Math.cos(angle)
        ];
    }

    function rotateZ(p, angle) {
        let [x, y, z] = p;
        return [
            x * Math.cos(angle) - y * Math.sin(angle),
            x * Math.sin(angle) + y * Math.cos(angle),
            z
        ];
    }

    // Apply rotations to each vertex of the unit cube
    let rotatedVertices = unitVertices.map(vertex => {
        let p = rotateX(vertex, angleU);
        p = rotateY(p, angleV);
        p = rotateZ(p, angleW);
        return p;
    });

    // Compute the average position of the transformed cube
    let avgX = rotatedVertices.reduce((sum, v) => sum + v[0], 0) / 8;
    let avgY = rotatedVertices.reduce((sum, v) => sum + v[1], 0) / 8;
    let avgZ = rotatedVertices.reduce((sum, v) => sum + v[2], 0) / 8;

    // Translate using (X, Y, Z)
    let finalX = X + avgX;
    let finalY = Y + avgY;
    let finalZ = Z + avgZ;

    return [finalX, finalY, finalZ];
}
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
const sixCoords = [3, -2, 5, 1, 0, 4];
console.log("Six bases", sixCoords);

const cartesianPoint = sixBasisToCartesian(sixCoords);
console.log("sixBasisTo Cartesian coordinates:", cartesianPoint);
console.log("sixBaseToCart",sixBaseToCartesian(sixCoords)); 

// Converting back (note: due to the non-uniqueness, this recovers the minimal-norm representation)
const recoveredSixCoords = cartesianToSixBasis(cartesianPoint);
console.log("Recovered six-basis coordinates:", recoveredSixCoords);

// Example Usage:
let vector = [12, 23, 32, 0, 1, 1];
console.log("Vector",vector);
console.log(sixBasisToCartesian(vector));
console.log(sixBaseToCartesian(vector)); 

