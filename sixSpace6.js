// --- Canonical Decomposition and Recomposition Routines --- //

/**
 * decomposeLegalSixVector:
 * Given a legal 6–vector v = [a, b, c, d, e, f],
 * returns its canonical free–parameters:
 *   Y0 = a + b,    Z1 = a - b,
 *   X0 = c + d,    Y1 = c - d,
 *   X1 = e + f,    Z0 = e - f.
 */
function decomposeLegalSixVector(v) {
  if (v.length !== 6) {
    throw new Error("Input must be a 6–vector.");
  }
  const [a, b, c, d, e, f] = v;
  return {
    Y0: a + b,
    Z1: a - b,
    X0: c + d,
    Y1: c - d,
    X1: e + f,
    Z0: e - f
  };
}

/**
 * recomposeLegalSixVector:
 * Given an object with free parameters { Y0, Z1, X0, Y1, X1, Z0 } (each pair must have the same parity),
 * returns the corresponding legal 6–vector:
 *   a = (Y0 + Z1)/2,   b = (Y0 - Z1)/2,
 *   c = (X0 + Y1)/2,   d = (X0 - Y1)/2,
 *   e = (X1 + Z0)/2,   f = (X1 - Z0)/2.
 */
function recomposeLegalSixVector(params) {
  const { Y0, Z1, X0, Y1, X1, Z0 } = params;
  // Parity check: each difference must be even.
  if (((Y0 - Z1) % 2) !== 0) {
    throw new Error("Parity condition failed for (Y0, Z1).");
  }
  if (((X0 - Y1) % 2) !== 0) {
    throw new Error("Parity condition failed for (X0, Y1).");
  }
  if (((X1 - Z0) % 2) !== 0) {
    throw new Error("Parity condition failed for (X1, Z0).");
  }
  const a = (Y0 + Z1) / 2;
  const b = (Y0 - Z1) / 2;
  const c = (X0 + Y1) / 2;
  const d = (X0 - Y1) / 2;
  const e = (X1 + Z0) / 2;
  const f = (X1 - Z0) / 2;
  return [a, b, c, d, e, f];
}

// --- Update Routine Using Index (0...5) --- //

/**
 * updateLegalSixVectorAtIndex:
 * Given a legal 6–vector v (an array of 6 integers), an index (0..5),
 * and a new integer value for that element,
 * returns a new legal 6–vector in which that element is updated.
 *
 * The update is done in the canonical way:
 * - For indices 0 and 1 (a and b): update the chosen element and adjust the free parameters so that
 *   the partner remains unchanged.
 * - Similarly for indices 2/3 and 4/5.
 *
 * For example:
 *   If v = [a, b, c, d, e, f] and index 0 (a) is to be updated to newA,
 *   then we hold b constant and compute:
 *      newY0 = newA + b,   newZ1 = newA - b.
 *   The new legal vector becomes:
 *      [ newA, b, c, d, e, f ]  (reconstructed from free parameters).
 */
function updateLegalSixVectorAtIndex(v, index, newValue) {
  if (v.length !== 6) {
    throw new Error("Input must be a 6–vector.");
  }
  if (!Number.isInteger(newValue)) {
    throw new Error("New value must be an integer.");
  }
  // Decompose the original legal 6–vector into free parameters.
  let params = decomposeLegalSixVector(v);

  // There are three free-parameter pairs:
  // Pair for indices 0,1: (Y0, Z1) with a = (Y0+Z1)/2, b = (Y0-Z1)/2.
  // Pair for indices 2,3: (X0, Y1) with c = (X0+Y1)/2, d = (X0-Y1)/2.
  // Pair for indices 4,5: (X1, Z0) with e = (X1+Z0)/2, f = (X1-Z0)/2.
  switch (index) {
    case 0: {
      // Update element 0 (a) to newValue, preserving b.
      // b = (Y0 - Z1)/2 remains unchanged.
      let b = v[1];
      params.Y0 = newValue + b;
      params.Z1 = newValue - b;
      break;
    }
    case 1: {
      // Update element 1 (b) to newValue, preserving a.
      let a = v[0];
      params.Y0 = a + newValue;
      params.Z1 = a - newValue;
      break;
    }
    case 2: {
      // Update element 2 (c) to newValue, preserving d.
      let d = v[3];
      params.X0 = newValue + d;
      params.Y1 = newValue - d;
      break;
    }
    case 3: {
      // Update element 3 (d) to newValue, preserving c.
      let c = v[2];
      params.X0 = c + newValue;
      params.Y1 = c - newValue;
      break;
    }
    case 4: {
      // Update element 4 (e) to newValue, preserving f.
      let f = v[5];
      params.X1 = newValue + f;
      params.Z0 = newValue - f;
      break;
    }
    case 5: {
      // Update element 5 (f) to newValue, preserving e.
      let e = v[4];
      params.X1 = e + newValue;
      params.Z0 = e - newValue;
      break;
    }
    default:
      throw new Error("Index must be between 0 and 5.");
  }
  // Recompose and return the new legal 6–vector.
  return recomposeLegalSixVector(params);
}

// --- Example Usage --- //

// Suppose we start with a known legal 6–vector.
// For example, let v = [3, 1, 4, 2, 4, 1].
// (This corresponds to free parameters:
//   Y0 = 3+1 = 4,   Z1 = 3-1 = 2,
//   X0 = 4+2 = 6,   Y1 = 4-2 = 2,
//   X1 = 4+1 = 5,   Z0 = 4-1 = 3.)
const legalVector = [3, 1, 4, 2, 4, 1];
console.log("Original legal 6–vector:", legalVector);
console.log("Decomposed free parameters:", decomposeLegalSixVector(legalVector));

// Now, suppose the engineer wants to update element at index 0 (a) from 3 to 7.
const updatedVector0 = updateLegalSixVectorAtIndex(legalVector, 0, 7);
console.log("Updated legal 6–vector (index 0 set to 7):", updatedVector0);
console.log("New free parameters:", decomposeLegalSixVector(updatedVector0));

// Or, if the engineer wants to update element at index 3 (d) from 2 to 5.
const updatedVector3 = updateLegalSixVectorAtIndex(legalVector, 3, 5);
console.log("Updated legal 6–vector (index 3 set to 5):", updatedVector3);
console.log("New free parameters:", decomposeLegalSixVector(updatedVector3));
