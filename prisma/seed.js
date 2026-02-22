/**
 * prisma/seed.ts — Official seed script
 * Run with: npx prisma db seed
 * 
 * Reads "Export Prices .10.2025 .csv" from the project root
 * and populates the Product table.
 * 
 * Add to package.json:
 *   "prisma": { "seed": "node prisma/seed.js" }
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function fixEncoding(str) {
    if (!str) return '';
    return str
        .replace(/M\u00d6LLER/g, 'MÖLLER')
        .replace(/\u00c3\u009c/g, 'Ü').replace(/\u00c3\u00bc/g, 'ü')
        .replace(/\u00c3\u00b6/g, 'ö').replace(/\u00c3\u00a4/g, 'ä')
        .replace(/\u00c3\u0084/g, 'Ä').replace(/\u00c3\u0096/g, 'Ö')
        .replace(/\u00c2\u00b0/g, '°').replace(/\u00e2\u00a2/g, '•')
        .replace(/\u00ef\u00bb\u00bf/g, '').replace(/\uFEFF/g, '')
        .trim();
}

function parsePrice(str) {
    if (!str || !str.trim()) return 0;
    return parseFloat(str.replace(/[€\s]/g, '').replace(',', '.')) || 0;
}

function isSpecLine(desc) {
    if (!desc) return true;
    const specStarts = [
        /^ACEA\b/i, /^API\s/i, /^ISO[\s-]/i, /^MB\s/i, /^BMW\s/i,
        /^VW\s/i, /^MAN\s/i, /^MTU\s/i, /^JASO\b/i, /^\u2022/, /^•/,
        /^ASTM\b/i, /^DIN\s/i, /^Mack\b/i, /^ZF\s/i, /^Ford\b/i,
        /^Volvo\b/i, /^Renault\b/i, /^Scania\b/i, /^ILSAC\b/i,
        /^DEXRON\b/i, /^PSA\s/i, /^Fiat\b/i, /^Porsche\b/i,
        /^Volkswagen\b/i, /^»\s/i, /^SAE\s[0-9]/i, /^GL-[0-9]/i, /^Â»/i,
    ];
    return specStarts.some(rx => rx.test(desc.trim()));
}

async function main() {
    const csvPath = path.join(__dirname, '..', 'Export Prices .10.2025 .csv');
    if (!fs.existsSync(csvPath)) {
        console.error('CSV file not found at:', csvPath);
        process.exit(1);
    }

    const buf = fs.readFileSync(csvPath);
    const raw = buf.toString('binary');
    const lines = raw.split(/\r?\n/);

    const products = [];
    let currentCategory = 'Motor Oils';
    let lastProductName = '';
    let lastBaseCode = '';

    for (const line of lines) {
        const cols = [];
        let cur = '', inQ = false;
        for (const ch of line) {
            if (ch === '"') inQ = !inQ;
            else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
            else cur += ch;
        }
        cols.push(cur);

        const itemNr = fixEncoding((cols[0] || '').trim());
        const rawDesc = fixEncoding((cols[1] || '').trim());
        const contentL = (cols[2] || '').trim();
        const rawPreis = (cols[3] || '').trim();
        const rawPerL = (cols[4] || '').trim();

        if (!itemNr && !rawDesc && !contentL) continue;
        if (itemNr === 'Item Nr.' || itemNr === '1') continue;
        if (itemNr.includes('\uFEFF')) continue;

        // Category header
        if (!itemNr && rawDesc && !isSpecLine(rawDesc)) {
            currentCategory = rawDesc;
            continue;
        }

        if (itemNr && /^\d+$/.test(itemNr)) {
            const baseCode = itemNr.length >= 6 ? itemNr.substring(0, 6) : itemNr;
            const isNewGroup = baseCode !== lastBaseCode;
            const amount = parseFloat(contentL) || 0;
            const packagePrice = parsePrice(rawPreis);
            const pricePerLiter = parsePrice(rawPerL);

            let productName = '';
            if (isNewGroup) {
                productName = (!isSpecLine(rawDesc) && rawDesc) ? rawDesc : (rawDesc || `Product ${itemNr}`);
                lastProductName = productName;
                lastBaseCode = baseCode;
            } else {
                productName = lastProductName;
            }

            products.push({
                itemCode: itemNr,
                name: productName,
                category: currentCategory,
                description: '',
                hsCode: '',
                amount,
                measureUnit: 'L',
                packagePrice,
                pricePerLiter,
            });
        }
    }

    // Clear and re-seed
    await prisma.product.deleteMany({});
    for (const p of products) {
        await prisma.product.create({ data: p });
    }

    const count = await prisma.product.count();
    console.log(`✅ Seeded ${count} products successfully.`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => await prisma.$disconnect());
