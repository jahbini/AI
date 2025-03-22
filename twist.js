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

// Example Usage:
let vector = [12, 23, 32, 0, 1, 1];
console.log(sixBaseToCartesian(vector)); 
