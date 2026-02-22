/**
 * import_products_v3.js — Final clean import
 * Fixes: encoding (latin1 byte-level decode), category detection, name inheritance
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fix Windows-1252/latin1 encoding artifacts
function fixEncoding(str) {
    if (!str) return '';
    // The file is latin1 but has Windows-1252 chars
    // Replace the specific byte patterns seen in the preview
    return str
        .replace(/\u00c3\u009c/g, 'Ü')   // Ü
        .replace(/\u00c3\u00bc/g, 'ü')   // ü
        .replace(/\u00c3\u00b6/g, 'ö')   // ö
        .replace(/\u00c3\u00a4/g, 'ä')   // ä
        .replace(/\u00c3\u0084/g, 'Ä')   // Ä
        .replace(/\u00c3\u00b3/g, 'ó')
        .replace(/\u00c3\u00a9/g, 'é')
        .replace(/\u00c2\u00b0/g, '°')   // °
        .replace(/\u00e2\u00a2/g, '•')   // bullet
        .replace(/\u00e2\u0080\u0093/g, '–')
        .replace(/\u00ef\u00bb\u00bf/g, '') // BOM
        // Also handle the specific pattern in data: Ã + control chars
        .replace(/\u00c3\u0096/g, 'Ö')
        .replace(/MÃ\x9cLLER/g, 'MÜLLER')
        .replace(/MÃ¼ller/gi, 'Müller')
        .replace(/Ã\x9c/g, 'Ü')
        .replace(/Ã\xbc/g, 'ü')
        .replace(/Ã\xb6/g, 'ö')
        .replace(/Ã\xa4/g, 'ä')
        .replace(/Ã¼/g, 'ü')
        .replace(/Ã¶/g, 'ö')
        .replace(/â¢/g, '•')
        .replace(/â°/g, '°')
        .replace(/Â°/g, '°')
        .replace(/Â»/g, '»')
        .replace(/\uFEFF/g, '')
        .trim();
}

// Detect real product names vs specs/standards
// Real names contain brand/grade info (e.g. "MÜLLER SAE 5W-30")
// Specs start with standards: ACEA, API, SAE (alone), ISO, MB, BMW, VW...
function isSpecLine(desc) {
    if (!desc) return true;
    const d = desc.trim();
    if (!d) return true;
    const specStarts = [
        /^ACEA\b/i, /^API\s/i, /^ISO[\s-]/i, /^MB\s/i, /^BMW\s/i,
        /^VW\s/i, /^VW\sTL/i, /^MAN\s/i, /^MTU\s/i, /^MTL\s/i,
        /^JASO\b/i, /^\u2022/, /^•/, /^ASTM\b/i, /^BS\s/i, /^DIN\s/i,
        /^Mack\b/i, /^Allison\b/i, /^ZF\s/i, /^Ford\b/i, /^GM\s/i,
        /^Volvo\b/i, /^Renault\b/i, /^Scania\b/i, /^DAF\s/i, /^Cat\b/i,
        /^ILSAC\b/i, /^Deutz\b/i, /^DEXRON\b/i, /^Chrysler\b/i,
        /^PSA\s/i, /^Fiat\b/i, /^Toyota\b/i, /^Porsche\b/i, /^Cummins\b/i,
        /^Volkswagen\b/i, /^»\s/i, /^SAE\s[0-9]/i,
        /^GL-[0-9]/i, /^Â»/i,
    ];
    return specStarts.some(rx => rx.test(d));
}

// Check if a row is a category header (no item number, has description, not a spec line)
function isCategoryRow(itemNr, desc) {
    if (itemNr) return false;
    if (!desc || !desc.trim()) return false;
    return !isSpecLine(desc);
}

function parsePrice(str) {
    if (!str || str.trim() === '') return 0;
    return parseFloat(str.replace(/[€\s]/g, '').replace(',', '.')) || 0;
}

function getBaseCode(itemNr) {
    // The first 6 digits identify the product group; last 3 are size variant
    return itemNr.length >= 6 ? itemNr.substring(0, 6) : itemNr;
}

async function main() {
    const filePath = path.join(__dirname, 'Export Prices .10.2025 .csv');

    // Read as buffer, then decode properly
    const buf = fs.readFileSync(filePath);
    // Convert buffer to string using latin1 so we get the raw bytes
    const raw = buf.toString('binary');
    const lines = raw.split(/\r?\n/);

    const products = [];
    let currentCategory = 'Motor Oils';
    let lastProductName = '';
    let lastBaseCode = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Parse CSV with quote-aware splitting
        const cols = [];
        let cur = '';
        let inQ = false;
        for (const ch of line) {
            if (ch === '"') { inQ = !inQ; }
            else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
            else cur += ch;
        }
        cols.push(cur);

        const rawItemNr = (cols[0] || '').trim();
        const rawDesc = fixEncoding((cols[1] || '').trim());
        const contentL = (cols[2] || '').trim();
        const rawPreis = (cols[3] || '').trim();
        const rawPerL = (cols[4] || '').trim();

        const itemNr = fixEncoding(rawItemNr);

        // Skip blank rows, BOM rows
        if (!itemNr && !rawDesc && !contentL) continue;
        if (itemNr === 'Item Nr.' || itemNr.includes('\uFEFF')) continue;
        if (itemNr === '1' || itemNr.toLowerCase() === 'ean') continue;

        // Category header row
        if (isCategoryRow(itemNr, rawDesc)) {
            currentCategory = rawDesc;
            continue;
        }

        // Product data row (item number is all digits)
        if (itemNr && /^\d+$/.test(itemNr)) {
            const baseCode = getBaseCode(itemNr);
            const isNewGroup = baseCode !== lastBaseCode;

            const amount = parseFloat(contentL) || 0;
            const packagePrice = parsePrice(rawPreis);
            const pricePerLiter = parsePrice(rawPerL);

            let productName = '';
            let description = '';

            if (isNewGroup) {
                if (!isSpecLine(rawDesc) && rawDesc) {
                    productName = rawDesc;
                } else {
                    // No clean name available, use last or itemNr
                    productName = rawDesc || `Product ${itemNr}`;
                }
                lastProductName = productName;
                lastBaseCode = baseCode;
            } else {
                // Variant — inherit the group's product name
                productName = lastProductName;
                description = isSpecLine(rawDesc) ? rawDesc : '';
            }

            // Skip rows with no price and no item number (trailing junk)
            if (!itemNr) continue;

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
        }
    }

    // Build preview output
    const uniqueNames = [...new Set(products.map(p => p.name))];
    const catMap = {};
    products.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + 1; });

    const preview = [
        `=== FINAL IMPORT PREVIEW ===`,
        `Total product rows: ${products.length}`,
        `Unique product names: ${uniqueNames.length}`,
        ``,
        `=== CATEGORIES ===`,
        ...Object.entries(catMap).map(([c, n]) => `  ${c}: ${n} rows`),
        ``,
        `=== SAMPLE PRODUCTS ===`,
        ...products.slice(0, 20).map((p, i) =>
            `  ${i + 1}. [${p.category}] ${p.itemCode} | "${p.name}" | ${p.amount}L | €${p.packagePrice}`
        ),
        ``,
        `=== UNIQUE PRODUCT NAMES ===`,
        ...uniqueNames.map((n, i) => `  ${i + 1}. ${n}`),
    ];

    fs.writeFileSync('import_preview_v3.txt', preview.join('\n'), 'utf8');

    // --- CLEAR EXISTING ---
    const existing = await prisma.product.count();
    if (existing > 0) {
        await prisma.product.deleteMany({});
        console.log(`Cleared ${existing} old products`);
    }

    // --- INSERT ---
    let inserted = 0;
    for (const p of products) {
        await prisma.product.create({ data: p });
        inserted++;
    }

    const finalCount = await prisma.product.count();
    console.log(`✅ Inserted ${inserted} | DB count: ${finalCount}`);

    fs.appendFileSync('import_preview_v3.txt', `\n\n=== RESULT ===\nInserted: ${inserted}\nDB verified: ${finalCount}\n`);
}

main()
    .catch(e => {
        console.error('FAILED:', e.message);
        fs.writeFileSync('import_error_v3.txt', e.message + '\n' + e.stack);
    })
    .finally(async () => await prisma.$disconnect());
