const fs = require("fs");
const fetch = require("node-fetch");

const OLLAMA_API = "http://localhost:11434/api/embeddings";

// Read extracted.json
const rawData = fs.readFileSync("extracted.json", "utf8");
let data;
try {
    data = JSON.parse(rawData);
} catch (err) {
    console.error("Error: extracted.json is not valid JSON.", err);
    process.exit(1);
}

// Process each entry
async function processEmbeddings() {
    for (const item of data) {
        const header = item.header.replace(/"/g, '\\"');
        const text = item.text.replace(/"/g, '\\"');

        if (!text) continue; // Skip empty entries

        try {
            const response = await fetch.default(OLLAMA_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: "mistral", prompt: text }),
            });

            const json = await response.json();
            const embedding = json.embedding.map(n => Math.round(n * 10000) / 10000);

            console.log(JSON.stringify({ header, embedding }));
        } catch (err) {
            console.error("Error fetching embedding:", err);
        }
    }
}

processEmbeddings();
