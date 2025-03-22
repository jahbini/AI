# Returns the partner index for a given index in a 6–vector.
# The pairs are defined as: (0,1), (2,3), (4,5).
# For each pair we designate the lower index as the independent one.
getPartner = (index) ->
  pairs = { 0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4 }
  pairs[index]

# Updates a legal 6–vector by replacing the value at a specified index with a new integer.
# This function preserves the parity condition in the affected pair.
updateLegalVector = (legalVector, index, newValue) ->
  throw new Error("Input must be a 6–vector (length 6).") unless legalVector.length is 6
  
  # Copy the original vector to avoid mutation.
  newVector = legalVector[..]
  partner = getPartner(index)

  # Determine whether the index is the primary (lower) element.
  # By convention, we treat indices 0, 2, and 4 as primary.
  isPrimary = index in [0, 2, 4]

  # Compute the current difference in the affected pair.
  # For a primary index i and partner j, define D = legalVector[i] - legalVector[j].
  # For a non-primary index, D is defined as (partner - value); it will be the same number.
  D = if isPrimary
    legalVector[index] - legalVector[partner]
  else
    legalVector[partner] - legalVector[index]

  # Update the chosen coordinate.
  newVector[index] = newValue

  # Adjust the partner coordinate to preserve the difference D.
  if isPrimary
    newVector[partner] = newValue - D
  else
    newVector[partner] = newValue + D

  newVector

# Example Usage

# Suppose we have a legal 6–vector representing a brick's address:
legalVector = [5, 3, 8, 4, 7, 2]

# Update the primary basis at index 0 (value 5) to 7.
updatedVector = updateLegalVector(legalVector, 0, 7)

console.log "Original legal vector:", legalVector
console.log "Updated legal vector:", updatedVector

# Update the partner coordinate in the same pair,
# updating index 1 (from 3) to 6, preserving D = 5 - 3 = 2.
updatedVector2 = updateLegalVector(legalVector, 1, 6)
console.log "Updated legal vector (index 1 to 6):", updatedVector2
