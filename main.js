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

function createWindow(port) {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true,
    });

    // Load the Next.js app on the dynamic port
    mainWindow.loadURL(`http://localhost:${port}`);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', async () => {
    setupDatabase();

    // Check if we are in development or production
    const isDev = !app.isPackaged;

    if (isDev) {
        // In dev, assume the user is manually running 'npm run dev' on port 3000
        createWindow(3000);
    } else {
        // In production, start the standalone server.js
        console.log("Starting Next.js standalone server...");

        try {
            const port = await getAvailablePort();
            console.log("Found available port:", port);

            const serverPath = path.join(__dirname, '.next', 'standalone', 'server.js');

            if (!fs.existsSync(serverPath)) {
                console.error("Standalone server not found at:", serverPath);
            }

            nextApp = fork(serverPath, [], {
                env: {
                    ...process.env,
                    PORT: port,
                    HOSTNAME: 'localhost',
                    NODE_ENV: 'production'
                },
                stdio: 'pipe'
            });

            nextApp.stdout.on('data', (data) => {
                console.log(`Next.js: ${data}`);
                if (data.toString().includes(`http://localhost:${port}`) || data.toString().includes('Ready')) {
                    if (!mainWindow) createWindow(port);
                }
            });

            nextApp.stderr.on('data', (data) => {
                console.error(`Next.js Error: ${data}`);
            });

            // Fallback: create window after a delay if "Ready" isn't caught
            setTimeout(() => {
                if (!mainWindow) createWindow(port);
            }, 3000);

        } catch (error) {
            console.error("Failed to start standalone server:", error);
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
        // If app is activated and no mainWindow, we assume port 3000 fallback or somehow track the running port
        // But typically this is only needed on macOS
        createWindow(3000);
    }
});
