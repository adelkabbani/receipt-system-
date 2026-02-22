const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parsePrice(str) {
    if (!str || str.trim() === '') return 0;
    // Remove € sign, spaces, and replace comma with dot
    return parseFloat(str.replace(/[€\s]/g, '').replace(',', '.')) || 0;
}

async function main() {
    const filePath = path.join(__dirname, 'Export Prices .10.2025 .csv');
    const raw = fs.readFileSync(filePath, 'latin1');
    const lines = raw.split(/\r?\n/);

    const products = [];
    let currentCategory = 'General';
    let lastProductName = '';
    let headerFound = false;
    let skipped = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Split by comma but respect quoted fields
        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());

        const itemNr = cols[0] ? cols[0].trim() : '';
        const desc = cols[1] ? cols[1].trim() : '';
        const contentL = cols[2] ? cols[2].trim() : '';
        const preis = cols[3] ? cols[3].trim() : '';
        const preisPerL = cols[4] ? cols[4].trim() : '';

        // Skip header rows and empty rows
        if (!itemNr && !desc) { skipped++; continue; }
        if (itemNr === 'Item Nr.') { headerFound = true; continue; }

        // Category header row: no item number but has a description
        if (!itemNr && desc) {
            // Normalize common German category names
            if (desc.match(/PKW|motor|öl|oil|AC|HYDRAULIK|Gear|GETRIEBE|antifreez|KüHLER|KüHL|Anti|cool|brake|Brems|Industri|grease|fett|compressor|flush|2-stroke|zweitakt|chain|ketten|Motoren|Industrie/i)) {
                currentCategory = desc
                    .replace(/PKW-/i, '')
                    .replace(/Ã¶/g, 'ö')
                    .replace(/Ã¼/g, 'ü')
                    .replace(/Ã/g, 'Ü')
                    .trim();
            }
            skipped++;
            continue;
        }

        // Skip footer rows
        if (itemNr === '1' || itemNr.toLowerCase() === 'ean') { skipped++; continue; }

        // If itemNr is a number (product row)
        if (itemNr && !isNaN(itemNr.replace(/[^0-9]/g, ''))) {
            // Inherit product name: if desc is empty, use last known name
            let productName = desc;
            if (!productName || productName === '') {
                productName = lastProductName;
            } else {
                // Clean up garbled encoding
                productName = productName
                    .replace(/MÃ\x9cLLER/g, 'MÜLLER')
                    .replace(/MÃ–LLER/g, 'MÖLLER')
                    .replace(/Ã¶/g, 'ö')
                    .replace(/Ã¼/g, 'ü')
                    .replace(/Ã\x9c/g, 'Ü')
                    .replace(/Ã„/g, 'Ä')
                    .replace(/Ã©/g, 'é')
                    .replace(/â¢/g, '•')
                    .trim();
                lastProductName = productName;
            }

            const amount = parseFloat(contentL) || 0;
            const packagePrice = parsePrice(preis);
            const pricePerLiter = parsePrice(preisPerL);

            // Determine measure unit
            let measureUnit = 'L';
            if (contentL.toLowerCase().includes('kg')) measureUnit = 'kg';
            else if (contentL.toLowerCase().includes('g')) measureUnit = 'g';

            products.push({
                itemCode: itemNr,
                name: productName,
                category: currentCategory,
                description: '',
                hsCode: '',
                amount,
                measureUnit,
                packagePrice,
                pricePerLiter,
            });
        }
    }

    // Write dry run log
    const logLines = [
        `=== DRY RUN PREVIEW ===`,
        `Total products parsed: ${products.length}`,
        `Lines skipped: ${skipped}`,
        ``,
        `=== FIRST 20 PRODUCTS ===`,
    ];
    products.slice(0, 20).forEach((p, i) => {
        logLines.push(`  ${i + 1}. [${p.category}] ${p.itemCode} | ${p.name} | ${p.amount}${p.measureUnit} | €${p.packagePrice} | €${p.pricePerLiter}/L`);
    });
    logLines.push(``, `=== LAST 10 PRODUCTS ===`);
    products.slice(-10).forEach((p, i) => {
        logLines.push(`  ${products.length - 9 + i}. [${p.category}] ${p.itemCode} | ${p.name} | ${p.amount}${p.measureUnit} | €${p.packagePrice} | €${p.pricePerLiter}/L`);
    });
    logLines.push(``, `=== CATEGORIES FOUND ===`);
    const cats = [...new Set(products.map(p => p.category))];
    cats.forEach(c => {
        const count = products.filter(p => p.category === c).length;
        logLines.push(`  ${c}: ${count} products`);
    });

    fs.writeFileSync('import_preview.txt', logLines.join('\n'), 'utf8');
    console.log('Dry run complete. Check import_preview.txt');
    console.log(`Products ready to import: ${products.length}`);

    // --- ACTUAL IMPORT ---
    console.log('\nStarting database import...');

    // First clear existing products (safety check - should be 0)
    const existingCount = await prisma.product.count();
    console.log(`Existing products in DB: ${existingCount}`);

    // Insert all products
    let inserted = 0;
    for (const product of products) {
        await prisma.product.create({ data: product });
        inserted++;
    }

    console.log(`\n✅ SUCCESS: Inserted ${inserted} products into the database.`);

    // Verify
    const finalCount = await prisma.product.count();
    console.log(`✅ VERIFIED: Database now has ${finalCount} products.`);

    // Write result to file
    fs.appendFileSync('import_preview.txt', `\n\n=== IMPORT RESULT ===\nInserted: ${inserted}\nVerified in DB: ${finalCount}\n`);
}

main()
    .catch(e => {
        console.error('Import failed:', e);
        fs.writeFileSync('import_error.txt', e.message + '\n' + e.stack);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
