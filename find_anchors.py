#!/usr/bin/env python3
import sys
import json
import networkx as nx

# Ensure the embeddings file is provided
if len(sys.argv) < 2:
    print("Usage: python3 find_anchors.py embeddings.json < graph.json", file=sys.stderr)
    sys.exit(1)

embeddings_file = sys.argv[1]

# ✅ Read JSONL file line by line (supports streaming format)
embeddings = {}
with open(embeddings_file, "r") as f:
    for line in f:
        try:
            obj = json.loads(line)
            embeddings[obj["header"]] = obj["embedding"]
        except json.JSONDecodeError:
            print(f"Error parsing line: {line}", file=sys.stderr)

# ✅ Read graph data from stdin
data = json.load(sys.stdin)
G = nx.Graph()

# Add edges to the graph
for link in data["links"]:
    G.add_edge(link["source"], link["target"], weight=link["value"])

# Find most connected nodes (anchors)
node_strengths = {node: sum(d["weight"] for _, _, d in G.edges(node, data=True)) for node in G.nodes}
sorted_anchors = sorted(node_strengths.items(), key=lambda x: x[1], reverse=True)

print("📌 **Anchor Headlines (Most Connected Nodes):**\n")
for node, strength in sorted_anchors[:5]:  # Show top 5 anchors
    print(f"🔹 {node} (Total Similarity: {strength:.2f})")

# Find least connected nodes (outliers)
sorted_outliers = sorted(node_strengths.items(), key=lambda x: x[1])

print("\n🚨 **Outlier Paragraphs (Most Distant Nodes):**\n")
for node, strength in sorted_outliers[:5]:  # Show top 5 outliers
    print(f"⚠️ {node} (Total Similarity: {strength:.2f})")


# ✅ Fix: Ensure we fetch embeddings correctly
def find_bridges(anchor, outlier):
    if anchor not in embeddings or outlier not in embeddings:
        return None  # If no embedding found, return None

    anchor_vec = embeddings[anchor]
    outlier_vec = embeddings[outlier]

    # Ensure both embeddings exist and are valid
    if not anchor_vec or not outlier_vec or len(anchor_vec) != len(outlier_vec):
        return None

    # Compute midpoint vector
    midpoint_vec = [(a + b) / 2 for a, b in zip(anchor_vec, outlier_vec)]

    # Find the closest paragraph to this midpoint
    closest_node = min(embeddings.keys(),
                       key=lambda n: sum((x - y) ** 2 for x, y in zip(midpoint_vec, embeddings[n])) if embeddings[n] else float('inf'))

    return closest_node


# Identify bridges for top outliers
print("\n🛤 **Bridging Paragraphs (Between Anchors & Outliers):**\n")
for anchor, _ in sorted_anchors[:3]:  # Check first 3 anchors
    for outlier, _ in sorted_outliers[:3]:  # Check first 3 outliers
        bridge = find_bridges(anchor, outlier)
        if bridge:
            print(f"🌉 {bridge} (Bridges 🔹 {anchor} ↔ ⚠️ {outlier})")
