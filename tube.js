// Define basic parameters
const startPoint = { x: 0, y: 0, z: 0 };
const endPoint = { x: 5, y: 7, z: 8 };
const minimalEdge = 0.4;

// Compute the central line vector and length
const centralVector = {
  x: endPoint.x - startPoint.x,
  y: endPoint.y - startPoint.y,
  z: endPoint.z - startPoint.z,
};
const length = Math.sqrt(centralVector.x**2 + centralVector.y**2 + centralVector.z**2);

// Normalize to get the tangent vector T
const T = {
  x: centralVector.x / length,
  y: centralVector.y / length,
  z: centralVector.z / length,
};

// Choose an arbitrary vector not parallel to T to compute N
const arbitrary = { x: 0, y: 0, z: 1 };  // adjust if needed
// Compute Normal (N) = normalize( arbitrary - (arbitrary·T)*T )
const dot = arbitrary.x * T.x + arbitrary.y * T.y + arbitrary.z * T.z;
const proj = { x: dot * T.x, y: dot * T.y, z: dot * T.z };
const N_temp = { x: arbitrary.x - proj.x, y: arbitrary.y - proj.y, z: arbitrary.z - proj.z };
const N_len = Math.sqrt(N_temp.x**2 + N_temp.y**2 + N_temp.z**2);
const N = { x: N_temp.x / N_len, y: N_temp.y / N_len, z: N_temp.z / N_len };

// Compute Binormal B = T x N
const B = {
  x: T.y * N.z - T.z * N.y,
  y: T.z * N.x - T.x * N.z,
  z: T.x * N.y - T.y * N.x,
};

// Now, create a function that builds the cross-section using triangles
function buildCrossSection(scale) {
  // Use golden triangle and gnomon geometry here,
  // define vertices in the 2D plane (u,v) then scale so minimal edge equals "scale".
  // For demonstration, return an array of vertices.
  return [
    { u: 0, v: 0 },
    { u: scale, v: 0 },
    { u: scale/2, v: scale * Math.sin(Math.PI/5) } // dummy values, replace with actual geometry
  ];
}

// Convert local (u,v) in the cross-section into global Cartesian coordinates
function localToGlobal(u, v, pointOnLine) {
  // The cross-section lies in the plane spanned by N and B.
  return {
    x: pointOnLine.x + u * N.x + v * B.x,
    y: pointOnLine.y + u * N.y + v * B.y,
    z: pointOnLine.z + u * N.z + v * B.z,
  };
}

// Discretize the central line:
const steps = Math.floor(length / minimalEdge);
const crossSections = [];
for (let i = 0; i <= steps; i++) {
  const t = i / steps;
  // Linear interpolation along the line:
  const pointOnLine = {
    x: startPoint.x + t * centralVector.x,
    y: startPoint.y + t * centralVector.y,
    z: startPoint.z + t * centralVector.z,
  };
  // Build the cross-section at this station
  const section = buildCrossSection(minimalEdge);
  // Map each vertex from the cross-section to global coordinates
  const globalSection = section.map(({u, v}) => localToGlobal(u, v, pointOnLine));
  crossSections.push(globalSection);
}

// At this point, you would determine how the triangles (built from these vertices)
// connect between adjacent cross-sections and assign six-basis addresses using your conversion functions.

// (Include the sixBasisToCartesian and cartesianToSixBasis functions defined earlier.)

console.log(crossSections);
