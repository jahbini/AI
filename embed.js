#!/usr/bin/env node

const fs = require("fs");

// Ollama API endpoint
const OLLAMA_API = "http://localhost:11434/api/embeddings";

// Read input from stdin
let rawData = "";
process.stdin.on("data", (chunk) => {
    rawData += chunk;
});

process.stdin.on("end", async () => {
    const data = JSON.parse(rawData);
    const embeddings = [];

    for (const item of data) {
        const paragraph = item.text || ""; // Ensure text exists
        const response = await fetch(OLLAMA_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: "mistral", prompt: paragraph })
        }).then((res) => res.json());

        // Ensure embedding exists
        if (!response.embedding) {
            console.error(`❌ Error: No embedding received for ${item.header}`);
            continue;
        }

        // Preserve route & other fields
        embeddings.push({
            header: item.header,
            embedding: response.embedding,
            route: item.route || "" // Pass through route
        });
    }

    // Output the updated embeddings.json
    console.log(JSON.stringify(embeddings));
});
