const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

let mainWindow;

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
log.info("App starting...");

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.whenReady().then(() => {
        mainWindow = new BrowserWindow({
            width: 800, // Size of the clock window
            height: 600,
            icon: "icons/favicon.ico", // Path to your clock icon
            webPreferences: {
                nodeIntegration: true, // Allow access to Node.js modules in renderer
                contextIsolation: false, // Enable this for better security later
            },
        });

        // Load the HTML file that displays the clock
        mainWindow.loadFile("clock.html");

        // Check for updates automatically
        autoUpdater.autoDownload = false;
        autoUpdater.checkForUpdatesAndNotify();

        // Handle window close event properly
        app.on("window-all-closed", () => {
            if (process.platform !== "darwin") app.quit();
        });

        // Auto-update event handlers
        autoUpdater.on("checking-for-update", () => {
            log.info("Checking for update...");
        });

        autoUpdater.on("update-available", (info) => {
            log.info(`Update available: Version ${info.version}`);
            dialog.showMessageBox({
                type: "info",
                title: "Update Available",
                message: "A new update is available. Downloading now...",
            });
        });

        autoUpdater.on("update-not-available", () => {
            log.info("No update available.");
        });

        autoUpdater.on("error", (err) => {
            log.error(`Update error: ${err.message}`);
        });

        autoUpdater.on("update-downloaded", () => {
            log.info("Update downloaded. Restarting...");
            dialog
                .showMessageBox({
                    type: "info",
                    title: "Update Ready",
                    message: "Update downloaded. The app will restart now to apply updates.",
                })
                .then(() => {
                    autoUpdater.quitAndInstall();
                });
        });

        // ✅ Handle manual update checking from Renderer Process
        ipcMain.on("check-for-updates", () => {
            log.info("Manual update check triggered.");
            autoUpdater.checkForUpdatesAndNotify();
        });

        // Handle window close event properly
        mainWindow.on("closed", () => {
            mainWindow = null;
        });
    });
}
