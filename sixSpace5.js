// ==================================================
// Canonical Decomposition and Recomposition Routines
// ==================================================

/**
 * decomposeLegalSixVector:
 *   Given a legal 6–vector v = [a, b, c, d, e, f],
 *   returns its canonical free–parameters:
 *     Y0 = a + b,    Z1 = a - b,
 *     X0 = c + d,    Y1 = c - d,
 *     X1 = e + f,    Z0 = e - f.
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
 *   Given an object with free parameters { Y0, Z1, X0, Y1, X1, Z0 }
 *   (each free–parameter pair must have the same parity),
 *   returns the corresponding legal 6–vector:
 *     a = (Y0 + Z1) / 2,   b = (Y0 - Z1) / 2,
 *     c = (X0 + Y1) / 2,   d = (X0 - Y1) / 2,
 *     e = (X1 + Z0) / 2,   f = (X1 - Z0) / 2.
 */
function recomposeLegalSixVector(params) {
  const { Y0, Z1, X0, Y1, X1, Z0 } = params;
  // Parity checks: differences must be even.
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

// ==================================================
// Routine for Updating a Single Free Parameter
// ==================================================

/**
 * updateFreeParameter:
 *   Given a legal 6–vector v, a free parameter name (one of "Y0", "Z1", "X0", "Y1", "X1", "Z0"),
 *   and a new desired value for that parameter,
 *   returns an array of candidate legal 6–vectors that incorporate the update.
 *
 *   The free parameters come in pairs:
 *      (Y0, Z1), (X0, Y1), (X1, Z0).
 *
 *   If the update on the chosen parameter (say p) would leave the pair inconsistent
 *   (i.e. p_new - q is odd, where q is the partner), then two candidates are produced:
 *   one with q increased by 1 and one with q decreased by 1 (each ensuring the difference is even).
 */
function updateFreeParameter(v, paramName, newValue) {
  // Decompose v into free parameters.
  let params = decomposeLegalSixVector(v);
  
  if (!params.hasOwnProperty(paramName)) {
    throw new Error("Invalid parameter name. Must be one of: Y0, Z1, X0, Y1, X1, Z0.");
  }
  
  // Identify the partner in the free–parameter pair.
  let partner;
  if (paramName === "Y0" || paramName === "Z1") {
    partner = (paramName === "Y0") ? "Z1" : "Y0";
  } else if (paramName === "X0" || paramName === "Y1") {
    partner = (paramName === "X0") ? "Y1" : "X0";
  } else if (paramName === "X1" || paramName === "Z0") {
    partner = (paramName === "X1") ? "Z0" : "X1";
  }
  
  // Set the desired new value for the chosen parameter.
  params[paramName] = newValue;
  
  // If the updated difference is even, no further change is needed.
  if ((params[paramName] - params[partner]) % 2 === 0) {
    return [ recomposeLegalSixVector(params) ];
  } else {
    // Otherwise, offer two candidate completions by adjusting the partner.
    let candidates = [];
    let paramsCandidate1 = { ...params };
    paramsCandidate1[partner] = params[partner] + 1;
    if ((paramsCandidate1[paramName] - paramsCandidate1[partner]) % 2 === 0) {
      candidates.push(recomposeLegalSixVector(paramsCandidate1));
    }
    let paramsCandidate2 = { ...params };
    paramsCandidate2[partner] = params[partner] - 1;
    if ((paramsCandidate2[paramName] - paramsCandidate2[partner]) % 2 === 0) {
      candidates.push(recomposeLegalSixVector(paramsCandidate2));
    }
    return candidates;
  }
}

// ==================================================
// Example Usage
// ==================================================

// Start with a known legal 6–vector.
// For example, choose free parameters such that:
const initialParams = {
  Y0: 4,    // must have same parity as Z1
  Z1: 2,    // (4 - 2 = 2, even)
  X0: 6,    // must have same parity as Y1
  Y1: 2,    // (6 - 2 = 4, even)
  X1: 5,    // must have same parity as Z0
  Z0: 3     // (5 - 3 = 2, even)
};

const legalVector = recomposeLegalSixVector(initialParams);
console.log("Initial legal 6–vector:", legalVector);
console.log("Decomposed free parameters:", decomposeLegalSixVector(legalVector));

// Suppose an engineer wants to update the free parameter "X0" from 6 to 7.
const candidates = updateFreeParameter(legalVector, "X0", 7);
console.log("Candidate legal 6–vectors after updating X0 to 7:");
candidates.forEach((vec, i) => {
  console.log(`Candidate ${i+1}:`, vec, "-> Decomposed:", decomposeLegalSixVector(vec));
});

// In this example, because (X0, Y1) initially is (6, 2):
//   • 7 - 2 is odd, so the update is not legal as is.
//   • The function offers two completions: one where Y1 is adjusted to 1 (giving 7 - 1 = 6, even)
//     and one where Y1 is adjusted to 3 (giving 7 - 3 = 4, even).
