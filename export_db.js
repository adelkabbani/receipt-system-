const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    console.log('--- Full Database Export ---');
    try {
        const products = await prisma.product.findMany();
        const invoices = await prisma.invoice.findMany({ include: { lineItems: true } });
        const settings = await prisma.settings.findMany();

        const dump = {
            products,
            invoices,
            settings
        };

        fs.writeFileSync('d:/website@Antigravity/receipt/db_dump.json', JSON.stringify(dump, null, 2));
        console.log(`Exported ${products.length} products to db_dump.json`);
    } catch (err) {
        console.error('Export Error:', err);
    } finally {
        await prisma.$disconnect();
        console.log('--- Export Finished ---');
    }
}

main();
