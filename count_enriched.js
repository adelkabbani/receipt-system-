const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/website@Antigravity/car oil/data/enriched_products_full.json', 'utf8'));
let result = `Total Root Products: ${data.length}\n`;
let count = 0;
data.forEach(p => {
    if (p.containerSizes) count += p.containerSizes.length;
    else count += 1;
});
result += `Total Variations: ${count}\n`;
fs.writeFileSync('d:/website@Antigravity/receipt/count_result.txt', result);
console.log('Results written to count_result.txt');
