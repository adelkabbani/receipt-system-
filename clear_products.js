/**
 * STEP 1: Just clear the database products table (safe - no invoices yet)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.product.count();
    console.log(`Products before delete: ${count}`);
    await prisma.product.deleteMany({});
    const after = await prisma.product.count();
    console.log(`Products after delete: ${after}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
