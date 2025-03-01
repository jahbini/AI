import sys
import json
import numpy as np
from scipy.spatial.distance import pdist, squareform

DEBUG = False  # 🔴 Toggle debugging here (True = full debug, False = normal mode)

# 🚀 Rule #1: Output Input
raw_input = sys.stdin.read().strip()

if DEBUG:
    print("🔍 DEBUG: Raw Input (First 500 chars):\n", raw_input[:500], "\n")

try:
    data = json.loads(raw_input)
except json.JSONDecodeError as e:
    print(f"❌ Error: Invalid JSON input. {e}", file=sys.stderr)
    sys.exit(1)

if DEBUG:
    print("✅ DEBUG: Successfully parsed JSON. Total items:", len(data))

# 🚀 Rule #2: Instrument Processing Steps

# Ensure JSON is a list
if not isinstance(data, list):
    print("❌ Error: JSON input is not a list of objects.", file=sys.stderr)
    sys.exit(1)

if len(data) == 0:
    print("❌ Error: JSON input is empty.", file=sys.stderr)
    sys.exit(1)

if DEBUG:
    print("🔍 DEBUG: First item structure:", json.dumps(data[0], indent=2))

# Extract embeddings and headers
headers = [item.get("header", "UNKNOWN") for item in data]
embeddings = np.array([item.get("embedding", []) for item in data])

if DEBUG:
    print("✅ DEBUG: First 5 headers:", headers[:5])
    print("✅ DEBUG: Embedding shape:", embeddings.shape)

# Compute distances
distance_matrix = squareform(pdist(embeddings, "cosine"))

if DEBUG:
    print("✅ DEBUG: Distance matrix shape:", distance_matrix.shape)

# 🚀 Rule #3: Validate Output Format by Re-Parsing It

# Find the most central nodes (anchors)
anchor_indices = np.argsort(distance_matrix.sum(axis=1))[:10]
anchors = [headers[i] for i in anchor_indices]

# Find the most isolated nodes (outliers)
outlier_indices = np.argsort(distance_matrix.sum(axis=1))[-10:]
outliers = [headers[i] for i in outlier_indices]

output = {
    "anchors": anchors,
    "outliers": outliers,
}

# Validate the output can be re-parsed
output_json = json.dumps(output, indent=2)

try:
    reloaded_output = json.loads(output_json)
    if DEBUG:
        print("✅ DEBUG: Successfully re-parsed output JSON.")
except json.JSONDecodeError as e:
    print(f"❌ Error: Generated output is not valid JSON. {e}", file=sys.stderr)
    sys.exit(1)

if DEBUG:
    print("✅ DEBUG: Final Output JSON:", output_json)

print(output_json)  # ✅ Final output only if everything is valid
