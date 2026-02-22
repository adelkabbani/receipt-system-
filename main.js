const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let nextApp;

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

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true,
    });

    // Load the Next.js app
    mainWindow.loadURL('http://localhost:3000');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', () => {
    setupDatabase();
    // Start Next.js server
    const nextPath = path.join(__dirname, 'node_modules', '.bin', 'next');

    // Check if we are in development or production
    const isDev = !app.isPackaged;

    if (isDev) {
        // In dev, just connect to the already running server or start one
        createWindow();
    } else {
        // In production, spawn the next start command
        // Note: This assumes 'next' is available. 
        // For a self-contained exe, using 'next start' is tricky without bundling node.
        // A better approach for this specific request "load localhost:3000" might be 
        // to assume the user runs the server or we bundle the standalone server.

        // Let's try to spawn 'npm start' or 'next start'
        // For simplicity in this environment, we'll try to spawn the server.
        // But for a true .exe, we usually revert to static export OR 
        // use a custom server.js that is bundled.

        // Given the constraints and the user's "local" requirement:
        // We will try to start the server.

        console.log("Starting Next.js server...");
        nextApp = spawn('npm', ['start'], {
            cwd: __dirname,
            shell: true,
            env: { ...process.env, PORT: 3000 }
        });

        nextApp.stdout.on('data', (data) => {
            console.log(`Next.js: ${data}`);
            // When server is ready, create window. 
            // Simple check for "ready" or just wait a bit.
            if (data.toString().includes('Ready')) {
                if (!mainWindow) createWindow();
            }
        });

        nextApp.stderr.on('data', (data) => {
            console.error(`Next.js Error: ${data}`);
        });

        // Fallback: create window after a delay if "Ready" isn't caught
        setTimeout(() => {
            if (!mainWindow) createWindow();
        }, 5000);
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
        createWindow();
    }
});
