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

    // Load the Next.js app
    mainWindow.loadURL(`http://localhost:${port}`);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', async () => {
    setupDatabase();

    const isDev = !app.isPackaged;

    if (isDev) {
        createWindow(3000);
    } else {
        // PRODUCTION: Run the standalone server.js directly
        const serverPath = path.join(process.resourcesPath, 'standalone', 'server.js');

        // Ensure the standalone server doesn't crash from port conflicts
        let portToUse = 3000;
        try {
            portToUse = await getAvailablePort();
        } catch (err) {
            console.error("Could not find dynamic port. Falling back to 3000.");
        }

        // Start server on a specific port
        nextApp = fork(serverPath, [], {
            env: { ...process.env, PORT: portToUse, HOSTNAME: '127.0.0.1', NODE_ENV: 'production' }
        });

        // Give the server 3 seconds to warm up before opening the window
        setTimeout(() => {
            createWindow(portToUse);
        }, 3000);
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
