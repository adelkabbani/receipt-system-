/**
 * import_products_v2.js — Clean import with correct parsing
 * 
 * CSV structure:
 * - Rows 1-5: blank/header rows → skip
 * - Row 6: column header → skip
 * - Category rows: itemNr is blank, desc is a category name
 * - Product group rows: itemNr is a number, first in group has product name in desc
 * - Variant rows: itemNr is a number, desc is blank OR a spec string (not the product name)
 * 
 * Key rule: The product NAME is ONLY on the first row of a product group.
 *           Subsequent rows with the same product base code but different sizes
 *           inherit the last seen product name.
 *           Spec descriptions (e.g. "ACEA C5, API SN") are stored in the description field.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function fixEncoding(str) {
    if (!str) return '';
    return str
        .replace(/MÃ\x9cLLER/g, 'MÜLLER')
        .replace(/MÃ–LLER/g, 'MÖLLER')
        .replace(/MÃ\x9cLLER/g, 'MÜLLER')
        .replace(/Ã\x9c/g, 'Ü')
        .replace(/Ã¼/g, 'ü')
        .replace(/Ã¶/g, 'ö')
        .replace(/Ã„/g, 'Ä')
        .replace(/Ã¤/g, 'ä')
        .replace(/Ã©/g, 'é')
        .replace(/Â°/g, '°')
        .replace(/â¢/g, '•')
        .replace(/â\x80\x93/g, '–')
        .replace(/ï»¿/g, '')
        .trim();
}

function parsePrice(str) {
    if (!str || str.trim() === '') return 0;
    // Remove € sign and non-numeric except dot/comma
    const cleaned = str.replace(/[€\s]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

// Determine if a desc looks like a product model name (starts the group)
// vs a spec/standard description (belongs to a variant)
function isProductName(desc) {
    if (!desc || desc.trim() === '') return false;
    const d = desc.trim();
    // Product names typically start with the brand or an SAE grade
    // Spec lines start with known standard identifiers or bullet chars
    const specPatterns = [
        /^ACEA/i, /^API\s/i, /^SAE\s/i, /^ISO/i, /^MB\s/i,
        /^BMW/i, /^VW\s/i, /^MAN\s/i, /^MTU/i, /^JASO/i,
        /^â¢/, /^•/, /^ASTM/i, /^BS\s/i, /^DIN/i, /^GL-/i,
        /^Mack/i, /^Allison/i, /^ZF\s/i, /^Ford/i, /^GM\s/i,
        /^Volvo/i, /^Renault/i, /^Scania/i, /^DAF\s/i, /^Caterpillar/i,
        /^ILSAC/i, /^ATIEL/i, /^Deutz/i, /^MTL/i, /^DEXRON/i,
        /^Chrysler/i, /^PSA\s/i, /^Fiat/i, /^Toyota/i,
    ];
    return !specPatterns.some(rx => rx.test(d));
}

function getBaseProductCode(itemNr) {
    // e.g. 210010200 → 210010 (last 3 digits are size variant)
    if (!itemNr || itemNr.length < 6) return itemNr;
    return itemNr.substring(0, 6);
}

async function main() {
    const filePath = path.join(__dirname, 'Export Prices .10.2025 .csv');
    const raw = fs.readFileSync(filePath, 'latin1');
    const lines = raw.split(/\r?\n/);

    const products = [];
    let currentCategory = 'General';
    let lastProductName = '';
    let lastBaseCode = '';
    const logLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Parse CSV columns (handle quoted fields)
        const cols = [];
        let current = '';
        let inQuote = false;
        for (const ch of line) {
            if (ch === '"') { inQuote = !inQuote; }
            else if (ch === ',' && !inQuote) { cols.push(current); current = ''; }
            else { current += ch; }
        }
        cols.push(current);

        const itemNr = (cols[0] || '').trim();
        const rawDesc = (cols[1] || '').trim();
        const contentL = (cols[2] || '').trim();
        const preis = (cols[3] || '').trim();
        const preisPerL = (cols[4] || '').trim();

        // Skip completely blank rows
        if (!itemNr && !rawDesc && !contentL) continue;

        // Skip the column header row
        if (itemNr === 'Item Nr.') continue;

        // Skip BOM/junk rows
        if (itemNr.includes('ï»¿') || itemNr === '1') continue;

        // --- CATEGORY HEADER ROW ---
        // No item number, but has a description
        if (!itemNr && rawDesc) {
            const catName = fixEncoding(rawDesc);
            currentCategory = catName;
            logLines.push(`[CATEGORY] ${catName}`);
            continue;
        }

        // --- PRODUCT DATA ROW ---
        if (itemNr && /^\d+$/.test(itemNr)) {
            const baseCode = getBaseProductCode(itemNr);
            const desc = fixEncoding(rawDesc);
            const amount = parseFloat(contentL) || 0;
            const packagePrice = parsePrice(preis);
            const pricePerLiter = parsePrice(preisPerL);

            // Determine if this starts a new product group (new base code)
            const isNewGroup = baseCode !== lastBaseCode;

            let productName = '';
            let description = '';

            if (isNewGroup) {
                // First row of a new product group
                if (isProductName(desc)) {
                    productName = desc;
                    description = '';
                } else {
                    // Desc is a spec line — product name might be embedded or unknown
                    // Use item code as fallback
                    productName = desc || itemNr;
                    description = '';
                }
                lastProductName = productName;
                lastBaseCode = baseCode;
            } else {
                // Variant of existing product group — inherit product name
                productName = lastProductName;
                // Store spec description from variant rows
                description = isProductName(desc) ? '' : desc;
            }

            products.push({
                itemCode: itemNr,
                name: productName,
                category: currentCategory,
                description: description,
                hsCode: '',
                amount,
                measureUnit: 'L',
                packagePrice,
                pricePerLiter,
            });

            logLines.push(`  [${currentCategory}] ${itemNr} | "${productName}" | ${amount}L | €${packagePrice} | ${isNewGroup ? 'NEW GROUP' : 'variant'}`);
        }
    }

    // Write preview
    const preview = [
        `=== IMPORT PREVIEW v2 ===`,
        `Total products: ${products.length}`,
        ``,
        `=== CATEGORIES ===`,
    ];
    const catMap = {};
    products.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + 1; });
    Object.entries(catMap).forEach(([cat, cnt]) => preview.push(`  ${cat}: ${cnt}`));
    preview.push(``, `=== FIRST 30 PRODUCTS ===`);
    products.slice(0, 30).forEach((p, i) => {
        preview.push(`  ${i + 1}. [${p.category}] ${p.itemCode} | ${p.name} | ${p.amount}L | €${p.packagePrice}`);
    });
    preview.push(``, `=== PRODUCT GROUPS (unique names) ===`);
    const uniqueNames = [...new Set(products.map(p => p.name))];
    preview.push(`  Unique product names: ${uniqueNames.length}`);
    uniqueNames.slice(0, 30).forEach((n, i) => preview.push(`  ${i + 1}. ${n}`));

    fs.writeFileSync('import_preview_v2.txt', preview.join('\n'), 'utf8');
    console.log('Preview written to import_preview_v2.txt');
    console.log(`Total products to import: ${products.length}`);
    console.log(`Unique product names: ${uniqueNames.length}`);

    // --- CLEAR ---
    const existing = await prisma.product.count();
    console.log(`\nClearing ${existing} existing products...`);
    if (existing > 0) await prisma.product.deleteMany({});

    // --- INSERT ---
    console.log('Inserting products...');
    for (const p of products) {
        await prisma.product.create({ data: p });
    }

    const finalCount = await prisma.product.count();
    console.log(`\n✅ Done! Database now has ${finalCount} products.`);
    fs.appendFileSync('import_preview_v2.txt', `\n\n=== RESULT ===\nInserted: ${products.length}\nVerified in DB: ${finalCount}\n`);
}

main()
    .catch(e => {
        console.error('FAILED:', e.message);
        fs.writeFileSync('import_error_v2.txt', e.message + '\n' + e.stack);
    })
    .finally(async () => await prisma.$disconnect());
