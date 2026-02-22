const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');
const net = require('net');

let mainWindow;
let nextApp;

function getAvailablePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
        server.on('error', reject);
    });
}

function setupDatabase() {
    // 1. Get the safe, persistent user directory (%APPDATA% on Windows)
    const userDataPath = app.getPath('userData');
    const dbFileName = 'dev.db';
    const writableDbPath = path.join(userDataPath, dbFileName);

    // 2. Locate the bundled database inside the .exe
    const bundledDbPath = app.isPackaged
        ? path.join(process.resourcesPath, 'prisma', dbFileName)
        : path.join(__dirname, 'prisma', dbFileName);

    // 3. THE UPDATE SAFEGUARD: Check if the user already has data
    if (!fs.existsSync(writableDbPath)) {
        // NEW INSTALL: Copy our bundled 226 products to their machine
        console.log("First install detected. Copying database...");

        // Make sure the directory exists just in case
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, { recursive: true });
        }

        // Ensure the source database exists before copying
        if (fs.existsSync(bundledDbPath)) {
            fs.copyFileSync(bundledDbPath, writableDbPath);
        } else {
            console.error("Bundled database not found at:", bundledDbPath);
        }
    } else {
        // UPDATE DETECTED: Do nothing! Leave their data exactly as it is.
        console.log("Existing installation detected. Preserving user's database.");
    }

    // 4. Force Prisma to use this persistent database
    process.env.DATABASE_URL = `file:${writableDbPath}`;
}

function createWindow(port = 3000) {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true,
    });

    const loadApp = () => {
        mainWindow.loadURL(`http://localhost:${port}`).catch((err) => {
            console.log("Next.js not fully ready yet, retrying in 1 second...");
            setTimeout(loadApp, 1000); // Retry until it succeeds
        });
    };

    loadApp();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', () => {
    setupDatabase();

    const isDev = !app.isPackaged;

    if (isDev) {
        createWindow();
    } else {
        if (app.isPackaged) {
            const serverPath = path.join(process.resourcesPath, 'standalone', 'server.js');
            // Start the standalone server directly without needing NPM
            nextApp = fork(serverPath, [], {
                env: { ...process.env, PORT: 3000, NODE_ENV: 'production' },
                stdio: 'ignore'
            });

            // Ensure mainWindow gets initialized
            createWindow(3000);

            // Adaptive Retry Logic: Try to load the page every 1s until the server is up
            const loadWindow = () => {
                mainWindow.loadURL('http://localhost:3000').catch(() => {
                    setTimeout(loadWindow, 1000);
                });
            };
            loadWindow();
        }
    }
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        if (nextApp) nextApp.kill();
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow(3000);
    }
});
