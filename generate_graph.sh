#!/bin/bash
set -e  # Exit immediately if a command fails

echo "🚀 Step 1: Extracting structured content from allpages.md..."
./extract.sh allpages.md > extract.json
./extract_pages.sh allpages.md > extracted_pages.json

echo "🔗 Step 2: Combining extracted content..."
echo '[' > extracted.json
cat extract.json >> extracted.json
echo ',' >> extracted.json
cat extracted_pages.json >> extracted.json
echo ']' >> extracted.json

echo "🤖 Step 3: Generating AI embeddings..."
node embed.js < extracted.json > embeddings.json

echo "📈 Step 4: Computing cosine similarity for graph.json..."
node cosine embeddings.json > graph.json

echo "🔍 Step 5: Identifying anchors & outliers..."
python3 find_anchors.py < embeddings.json > anchors.json

echo "🔄 Step 6: Recomputing graph with anchor info..."
node cosine embeddings.json anchors.json > graph.json

echo "🌍 Step 7: Starting local web server..."
python3 -m http.server 8080 &

echo "✅ All steps completed! Open http://localhost:8080 in your browser."
