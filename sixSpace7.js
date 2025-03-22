/**
 * Returns the partner index for a given index in a 6–vector.
 * The pairs are defined as: (0,1), (2,3), (4,5).
 * For each pair we designate the lower index as the independent one.
 *
 * @param {number} index - An index from 0 to 5.
 * @returns {number} The partner index.
 */
function getPartner(index) {
  const pairs = { 0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4 };
  return pairs[index];
}

/**
 * Updates a legal 6–vector by replacing the value at a specified index with a new integer.
 * To maintain consistency (i.e. the parity condition in the affected pair), the partner element
 * is recalculated so that the original difference (D) for that pair is preserved.
 *
 * We designate indices 0, 2, and 4 as the "primary" (or lower) indices in each pair.
 * For a pair (i, j):
 *   - If i is primary and its current difference is D = v[i] – v[j],
 *     then updating v[i] to newValue gives new v[j] = newValue – D.
 *   - If j is updated (i.e. j is non–primary), then we set new v[i] = newValue + D.
 *
 * This routine performs the update entirely in 6–space (no Cartesian conversion occurs).
 *
 * @param {number[]} legalVector - A legal 6–vector (array of 6 integers).
 * @param {number} index - The index (0..5) to update.
 * @param {number} newValue - The new integer value for that index.
 * @returns {number[]} A new legal 6–vector with the update applied.
 */
function updateLegalVector(legalVector, index, newValue) {
  if (legalVector.length !== 6) {
    throw new Error("Input must be a 6–vector (length 6).");
  }
  // Copy the original vector so as not to mutate it.
  const newVector = legalVector.slice();
  const partner = getPartner(index);

  // Determine whether the index is the primary (lower) element.
  // By convention, we treat indices 0, 2, and 4 as primary.
  const isPrimary = (index === 0 || index === 2 || index === 4);

  // Compute the current difference in the affected pair.
  // For a primary index i and partner j, define D = legalVector[i] - legalVector[j].
  // For a non-primary index, D is defined as (partner - value); it will be the same number.
  let D;
  if (isPrimary) {
    D = legalVector[index] - legalVector[partner];
  } else {
    // index is non-primary; then partner is primary.
    D = legalVector[partner] - legalVector[index];
  }

  // Update the chosen coordinate.
  newVector[index] = newValue;

  // Adjust the partner coordinate to preserve the difference D.
  if (isPrimary) {
    // We want: newVector[index] - newVector[partner] = D.
    newVector[partner] = newValue - D;
  } else {
    // For a non-primary index j, we want: newVector[partner] - newVector[j] = D.
    newVector[partner] = newValue + D;
  }

  // (The other indices remain unchanged.)
  // The returned vector is legal because in the updated pair both elements now share the parity of newValue.
  return newVector;
}

// ==================================================
// Example Usage
// ==================================================

// Suppose we have a legal 6–vector representing a brick's address:
let legalVector = [5, 3, 8, 4, 7, 2];
// In the pair (indices 0,1): 5 and 3 have the same parity? 5-3=2 (even), so they are legal.
// Similarly, assume (8,4) and (7,2) satisfy the parity condition.

// An engineer wishes to update the primary basis at index 0 (value 5) to 7.
let updatedVector = updateLegalVector(legalVector, 0, 7);
// For pair (0,1): Original difference D = 5 - 3 = 2.
// New index 0 becomes 7, so we set index 1 to 7 - 2 = 5.
// Thus, updatedVector becomes: [7, 5, 8, 4, 7, 2].

console.log("Original legal vector:", legalVector);
console.log("Updated legal vector:", updatedVector);

// Similarly, if an engineer instead updates the partner coordinate in the same pair,
// for example, updating index 1 (from 3) to 6, then we preserve D = 5 - 3 = 2,
// and compute new index 0 as: new index 0 = newValue + D = 6 + 2 = 8.
let updatedVector2 = updateLegalVector(legalVector, 1, 6);
console.log("Updated legal vector (index 1 to 6):", updatedVector2);
