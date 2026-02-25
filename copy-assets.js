const fs = require('fs');
const path = require('path');

function copySync(src, dest) {
    if (!fs.existsSync(src)) return;
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        const files = fs.readdirSync(src);
        for (const file of files) {
            const srcFile = path.join(src, file);
            const destFile = path.join(dest, file);
            copySync(srcFile, destFile);
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

console.log('Copying public directory...');
copySync(path.join(__dirname, 'public'), path.join(__dirname, '.next/standalone/public'));

console.log('Copying .next/static directory...');
copySync(path.join(__dirname, '.next/static'), path.join(__dirname, '.next/standalone/.next/static'));

console.log('Assets copied successfully.');
