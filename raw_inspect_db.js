const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('d:/website@Antigravity/receipt/prisma/dev.db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('Error listing tables:', err);
    } else {
        console.log('Tables:', tables.map(t => t.name).join(', '));
        tables.forEach(table => {
            db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row) => {
                if (err) {
                    console.error(`Error counting ${table.name}:`, err);
                } else {
                    console.log(`Table ${table.name}: ${row.count} records`);
                    if (row.count > 0 && table.name === 'Product') {
                        db.all(`SELECT * FROM ${table.name} LIMIT 3`, (err, rows) => {
                            console.log('Sample Product Data:', JSON.stringify(rows, null, 2));
                        });
                    }
                }
            });
        });
    }
});
