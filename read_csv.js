const fs = require('fs');
const path = require('path');

// Try multiple possible filename variations
const candidates = [
    'Export Prices .10.2025 .csv',
    'Export Prices .10.2025.csv',
    'Export Prices.10.2025.csv',
    'Export Prices .10.2025 .CSV',
];

let found = null;
let foundPath = null;
const dir = __dirname;

// List ALL files in the directory
const allFiles = fs.readdirSync(dir);
fs.writeFileSync('csv_debug.txt', '=== ALL FILES IN DIRECTORY ===\n' + allFiles.join('\n') + '\n\n');

// Find CSV files
const csvFiles = allFiles.filter(f => f.toLowerCase().endsWith('.csv'));
fs.appendFileSync('csv_debug.txt', '=== CSV FILES FOUND ===\n' + (csvFiles.length ? csvFiles.join('\n') : 'NONE') + '\n\n');

if (csvFiles.length > 0) {
    const firstCsv = csvFiles[0];
    foundPath = path.join(dir, firstCsv);
    const raw = fs.readFileSync(foundPath, 'latin1');
    const lines = raw.split(/\r?\n/).filter(l => l.trim());

    fs.appendFileSync('csv_debug.txt', `=== FILE: ${firstCsv} ===\n`);
    fs.appendFileSync('csv_debug.txt', `Total lines: ${lines.length}\n\n`);
    fs.appendFileSync('csv_debug.txt', `HEADER:\n${lines[0]}\n\n`);
    fs.appendFileSync('csv_debug.txt', `FIRST 20 ROWS:\n`);
    for (let i = 1; i < Math.min(21, lines.length); i++) {
        fs.appendFileSync('csv_debug.txt', `  ${i}: ${lines[i]}\n`);
    }
    fs.appendFileSync('csv_debug.txt', `\nLAST 5 ROWS:\n`);
    for (let i = Math.max(1, lines.length - 5); i < lines.length; i++) {
        fs.appendFileSync('csv_debug.txt', `  ${i}: ${lines[i]}\n`);
    }
    console.log('Done! Check csv_debug.txt');
} else {
    fs.appendFileSync('csv_debug.txt', 'No CSV files found in directory!\n');
    console.log('No CSV found. Check csv_debug.txt for all files listed.');
}
