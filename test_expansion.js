const fs = require('fs');

const moller = JSON.parse(fs.readFileSync('d:/website@Antigravity/car oil/data/moller-products.json', 'utf8'));
const gpc = JSON.parse(fs.readFileSync('d:/website@Antigravity/car oil/data/gpc-products.json', 'utf8'));

function expand(products, brand) {
    const list = [];
    products.forEach(p => {
        if (p.containerSizes && p.containerSizes.length > 0) {
            p.containerSizes.forEach(size => {
                list.push({
                    name: `${p.name} (${size})`,
                    originalName: p.name,
                    size: size,
                    brand: brand
                });
            });
        } else {
            list.push({
                name: p.name,
                originalName: p.name,
                size: null,
                brand: brand
            });
        }
    });
    return list;
}

const mollerExpanded = expand(moller, 'Moller');
const gpcExpanded = expand(gpc, 'GPC');

const total = mollerExpanded.length + gpcExpanded.length;
let res = `Moller Expanded: ${mollerExpanded.length}\n`;
res += `GPC Expanded: ${gpcExpanded.length}\n`;
res += `Total Expanded: ${total}\n`;

fs.writeFileSync('d:/website@Antigravity/receipt/expansion_check.txt', res);
console.log('Results written to expansion_check.txt');
