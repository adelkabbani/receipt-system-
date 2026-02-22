const fs = require('fs');

const filePath = 'D:\\website@Antigravity\\receipt\\Export Prices .10.2025 .csv';

if (!fs.existsSync(filePath)) {
    console.error('FILE NOT FOUND at:', filePath);
    process.exit(1);
}

const raw = fs.readFileSync(filePath, 'latin1'); // try latin1 encoding for Excel CSVs
const lines = raw.split('\n').filter(l => l.trim());

console.log('=== TOTAL LINES (including header):', lines.length);
console.log('\n=== HEADER ROW:');
console.log(lines[0]);
console.log('\n=== FIRST 10 DATA ROWS:');
for (let i = 1; i <= Math.min(10, lines.length - 1); i++) {
    console.log(`Row ${i}: ${lines[i]}`);
}
console.log('\n=== LAST 3 ROWS:');
for (let i = Math.max(1, lines.length - 3); i < lines.length; i++) {
    console.log(`Row ${i}: ${lines[i]}`);
}
