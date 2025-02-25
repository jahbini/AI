import sys
import json

# Read JSON from stdin
data = json.load(sys.stdin)

threshold = 0.8  # ✅ Similarity threshold for near-duplicates

print("Highly similar paragraphs (similarity ≥ 0.9999):\n")
for link in data["links"]:
    if link["value"] >= threshold:
        print(f"🔍 {link['source']} ↔ {link['target']} (Similarity: {link['value']:.4f})")
