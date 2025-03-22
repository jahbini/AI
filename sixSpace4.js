// ==================================================
// Canonical Decomposition and Recomposition Routines
// ==================================================

// decomposeLegalSixVector: Extract the canonical free parameters from a legal 6–vector.
function decomposeLegalSixVector(v) {
  // v is assumed to be [a, b, c, d, e, f] with all integers.
  if (v.length !== 6) {
    throw new Error("Input must be a 6–vector.");
  }
  const [a, b, c, d, e, f] = v;
  return {
    Y0: a + b,   // from a and b
    Z1: a - b,
    X0: c + d,   // from c and d
    Y1: c - d,
    X1: e + f,   // from e and f
    Z0: e - f
  };
}

// recomposeLegalSixVector: Given the canonical free parameters, return the legal 6–vector.
function recomposeLegalSixVector(params) {
  // Expect params to have keys: Y0, Z1, X0, Y1, X1, Z0.
  const { Y0, Z1, X0, Y1, X1, Z0 } = params;
  // Check parity conditions:
  if (((Y0 - Z1) % 2) !== 0) {
    throw new Error("Parity condition failed for (Y0, Z1): They must have the same parity.");
  }
  if (((X0 - Y1) % 2) !== 0) {
    throw new Error("Parity condition failed for (X0, Y1): They must have the same parity.");
  }
  if (((X1 - Z0) % 2) !== 0) {
    throw new Error("Parity condition failed for (X1, Z0): They must have the same parity.");
  }
  const a = (Y0 + Z1) / 2;
  const b = (Y0 - Z1) / 2;
  const c = (X0 + Y1) / 2;
  const d = (X0 - Y1) / 2;
  const e = (X1 + Z0) / 2;
  const f = (X1 - Z0) / 2;
  return [a, b, c, d, e, f];
}

// ==================================================
// Update Routine in 6–Space (No Cartesian Conversions)
// ==================================================

/**
 * updateLegalSixVector: Given a legal 6–vector v, update one free parameter.
 *   - v: a legal 6–vector (an array of 6 integers).
 *   - paramName: one of "Y0", "Z1", "X0", "Y1", "X1", or "Z0".
 *   - delta: an integer increment.
 *
 * Returns a new legal 6–vector whose canonical parameters are updated.
 * Throws an error if the update would violate the parity condition.
 */
function updateLegalSixVector(v, paramName, delta) {
  // First, decompose the current legal 6–vector into its free parameters.
  let params = decomposeLegalSixVector(v);
  if (!params.hasOwnProperty(paramName)) {
    throw new Error("Invalid parameter name. Must be one of: Y0, Z1, X0, Y1, X1, Z0.");
  }
  // Update the selected parameter:
  params[paramName] += delta;
  
  // Check the parity of the pair containing the updated parameter.
  // The pairs are: (Y0, Z1), (X0, Y1), (X1, Z0).
  if ((paramName === "Y0" || paramName === "Z1") && ((params.Y0 - params.Z1) % 2 !== 0)) {
    throw new Error("Update violates parity condition for the (Y0, Z1) pair.");
  }
  if ((paramName === "X0" || paramName === "Y1") && ((params.X0 - params.Y1) % 2 !== 0)) {
    throw new Error("Update violates parity condition for the (X0, Y1) pair.");
  }
  if ((paramName === "X1" || paramName === "Z0") && ((params.X1 - params.Z0) % 2 !== 0)) {
    throw new Error("Update violates parity condition for the (X1, Z0) pair.");
  }
  
  // Return the recomposed legal 6–vector.
  return recomposeLegalSixVector(params);
}

// ==================================================
// Example Usage
// ==================================================

// Suppose we start with a known legal 6–vector.
// For example, using our canonical representation with free parameters:
const initialParams = {
  Y0: 4,    // a + b
  Z1: 2,    // a - b  (Y0 and Z1 are both even → ok)
  X0: 6,    // c + d
  Y1: 2,    // c - d  (X0 and Y1: 6-2 = 4, even)
  X1: 5,    // e + f
  Z0: 3     // e - f  (X1 and Z0: 5-3 = 2, even)
};

// Compute the legal 6–vector from these parameters:
const legalVector = recomposeLegalSixVector(initialParams);
console.log("Initial legal 6–vector:", legalVector);
// Decomposition (for display):
console.log("Decomposed free parameters:", decomposeLegalSixVector(legalVector));

// Now, suppose an engineer wishes to iterate on one free parameter.
// For example, increment X0 by 1:
try {
  const updatedVector = updateLegalSixVector(legalVector, "X0", 1);
  console.log("Updated legal 6–vector (X0 incremented by 1):", updatedVector);
  console.log("New free parameters:", decomposeLegalSixVector(updatedVector));
} catch (error) {
  console.error("Error updating legal 6–vector:", error);
}
