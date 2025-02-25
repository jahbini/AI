import sys
import networkx as nx
import matplotlib.pyplot as plt
import csv
import json

G = nx.Graph()

# Read CSV from stdin
# reader = csv.reader(sys.stdin)
# next(reader, None);
#for row in reader:
#    if row[0] != row[1]:  # Skip self-loops
#        G.add_edge(row[0], row[1], weight=float(row[2]))

# read from json
data = json.load(sys.stdin)
for link in data["links"]:
    G.add_edge(link["source"], link["target"], weight=link["value"])

# Position nodes in 3D space
pos = nx.spring_layout(G, dim=3, weight="weight")

# Draw 3D Graph
fig = plt.figure(figsize=(10, 8))
ax = fig.add_subplot(111, projection="3d")

for node, (x, y, z) in pos.items():
    ax.scatter(x, y, z, s=50, label=node)

for edge in G.edges(data=True):
    x, y, z = zip(pos[edge[0]], pos[edge[1]])
    ax.plot(x, y, z, linewidth=edge[2]["weight"] * 2)

# Add text labels to nodes
for node, (x, y, z) in pos.items():
    ax.text(x, y, z, node, fontsize=8, ha="right", color="black")  # ✅ Labels

ax.set_title("3D Cosine Similarity Graph")
plt.show()
