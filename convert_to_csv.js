#!/usr/bin/env node
// convert_to_csv.js - Converts JSON graph output to CSV format
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin });
let jsonData = "";
rl.on("line", (line) => { jsonData += line; });

rl.on("close", () => {
    try {
        const graph = JSON.parse(jsonData);

        if (!graph.nodes || !graph.links) {
            throw new Error("Invalid JSON format: Expected 'nodes' and 'links' arrays.");
        }

        console.log('"Source","Target","Distance"'); // CSV Header

        graph.links.forEach(link => {
            let source = escapeCsv(link.source);
            let target = escapeCsv(link.target);
            let value = link.value;
            console.log(`"${source}","${target}",${value}`);
           
        });

    } catch (err) {
        console.error("Error parsing JSON:", err);
    }
});
// Function to properly escape CSV values
function escapeCsv(value) {
    if (typeof value !== "string") return value;
    if ( value.includes('"') || value.includes('\n')) {
        return value.replace(/"/g, '""');
        }
    return value;
}
 
