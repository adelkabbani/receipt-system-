const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Audit ---');
    try {
        const products = await prisma.product.count();
        const invoices = await prisma.invoice.count();
        const lineItems = await prisma.lineItem.count();
        const settings = await prisma.settings.count();

        console.log(`Product Count: ${products}`);
        console.log(`Invoice Count: ${invoices}`);
        console.log(`LineItem Count: ${lineItems}`);
        console.log(`Settings Count: ${settings}`);

        if (products > 0) {
            const sample = await prisma.product.findMany({ take: 3 });
            console.log('Sample Products:', JSON.stringify(sample, null, 2));
        }
    } catch (err) {
        console.error('Audit Error:', err);
    } finally {
        await prisma.$disconnect();
        console.log('--- Audit Finished ---');
    }
}

main();
