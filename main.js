const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

let mainWindow;
let nextApp;

// Create a log file so we can see what's happening inside the .exe
const logPath = path.join(app.getPath('userData'), 'error_log.txt');
const logStream = fs.createWriteStream(logPath, { flags: 'a' });

function setupDatabase() {
    const userDataPath = app.getPath('userData');
    const dbFileName = 'dev.db';
    const writableDbPath = path.join(userDataPath, dbFileName);
    const bundledDbPath = app.isPackaged
        ? path.join(process.resourcesPath, 'prisma', dbFileName)
        : path.join(__dirname, 'prisma', dbFileName);

    if (!fs.existsSync(writableDbPath)) {
        if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });
        if (fs.existsSync(bundledDbPath)) fs.copyFileSync(bundledDbPath, writableDbPath);
    }
    process.env.DATABASE_URL = `file:${writableDbPath}`;
    logStream.write(`Database Path: ${process.env.DATABASE_URL}\n`);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
        autoHideMenuBar: true,
    });

    // OPEN DEVTOOLS IN PRODUCTION so we can see frontend errors
    mainWindow.webContents.openDevTools();

    const loadApp = () => {
        mainWindow.loadURL(`http://localhost:3000`).catch(() => {
            logStream.write("Next.js not ready, retrying...\n");
            setTimeout(loadApp, 1000);
        });
    };
    loadApp();
}

app.on('ready', () => {
    setupDatabase();
    if (app.isPackaged) {
        const serverPath = path.join(process.resourcesPath, 'standalone', 'server.js');
        logStream.write(`Starting server from: ${serverPath}\n`);

        // Capture all server output to our log file
        nextApp = fork(serverPath, [], {
            env: { ...process.env, PORT: 3000, NODE_ENV: 'production' },
            stdio: ['ignore', 'pipe', 'pipe', 'ipc']
        });

        nextApp.stdout.on('data', (data) => logStream.write(`STDOUT: ${data}\n`));
        nextApp.stderr.on('data', (data) => logStream.write(`STDERR: ${data}\n`));

        nextApp.on('error', (err) => logStream.write(`SERVER ERROR: ${err.message}\n`));
        nextApp.on('exit', (code) => logStream.write(`SERVER EXITED with code: ${code}\n`));
    }
    createWindow();
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
