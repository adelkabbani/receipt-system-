const fs = require('fs');
const path = require('path');

const gpcPath = 'd:/website@Antigravity/car oil/data/gpc-products.json';
const mollerPath = 'd:/website@Antigravity/car oil/data/moller-products.json';

console.log('--- Product Analysis Starting ---');

function analyze(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`File NOT found: ${filePath}`);
        return;
    }
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        console.log(`File: ${path.basename(filePath)}`);
        console.log(`  Total Root Products: ${data.length}`);

        let totalVariations = 0;
        data.forEach(p => {
            if (p.containerSizes && Array.isArray(p.containerSizes)) {
                totalVariations += p.containerSizes.length;
            } else {
                totalVariations += 1;
            }
        });
        console.log(`  Total Product Variations (Name + Size): ${totalVariations}`);

        // Print first product as example
        if (data.length > 0) {
            console.log(`  Example Product: ${data[0].name} (Category: ${data[0].category})`);
        }
    } catch (err) {
        console.error(`Error processing ${filePath}: ${err.message}`);
    }
}

analyze(gpcPath);
analyze(mollerPath);
console.log('--- Product Analysis Finished ---');
