const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Script started...');
    try {
        const count = await prisma.product.count();
        console.log(`Total Products in DB: ${count}`);
        if (count > 0) {
            const products = await prisma.product.findMany({ take: 5 });
            console.log('--- Sample Products ---');
            console.log(JSON.stringify(products, null, 2));
        }
    } catch (err) {
        console.error('Error during query:', err);
    } finally {
        console.log('Script finished.');
    }
}

main()
    .catch(e => console.error('Unhandled error:', e))
    .finally(async () => await prisma.$disconnect());
