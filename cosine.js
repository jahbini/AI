#!/usr/bin/env node
// cosine.js - Computes cosine similarity for embeddings (stdin → stdout)

const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin });

let headers = [];
let embeddings = [];

// Read JSON input from stdin
rl.on("line", (line) => {
    try {
        let obj = JSON.parse(line);
        headers.push(obj.header);
        embeddings.push(obj.embedding);
    } catch (err) {
        console.error("Error parsing JSON:", err);
    }
});

rl.on("close", () => {
    function cosineSimilarity(vecA, vecB) {
        let dotProduct = 0, magA = 0, magB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            magA += vecA[i] * vecA[i];
            magB += vecB[i] * vecB[i];
        }
        magA = Math.sqrt(magA);
        magB = Math.sqrt(magB);
        return magA && magB ? (dotProduct / (magA * magB)).toFixed(4) : 0;
    }

    let graph = { nodes: [], links: [] };

    headers.forEach((header, i) => {
        graph.nodes.push({ id: header });
        for (let j = 0; j < headers.length; j++) {
            if (i !== j) {
                let similarity = cosineSimilarity(embeddings[i], embeddings[j]);
                graph.links.push({
                    source: headers[i],
                    target: headers[j],
                    value: parseFloat(similarity),
                });
            }
        }
    });

    console.log(JSON.stringify(graph, null, 2));
});
