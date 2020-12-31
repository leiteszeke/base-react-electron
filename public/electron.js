const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const PDFWindow = require("electron-pdf-window");
const path = require("path");
const fs = require("fs");
const isDev = require("electron-is-dev");
const http = require("http");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    height: 720,
    webPreferences: {
      nodeIntegration: true,
    },
    icon: path.join(__dirname, "assets/icons/icon.png"),
    width: 1280,
  });
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
  if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("closed", () => (mainWindow = null));
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

function download_file(file, name, ext) {
  const options = {
    title: "Save",
    defaultPath: name,
    filters: [{ name: "File", extensions: [ext] }],
  };

  electron.dialog.showSaveDialog(options, function (filename) {
    if (filename !== null) {
      fs.writeFile(filename, name, function (err) {
        const data = fs.createWriteStream(filename);
        http
          .get(file, function (response) {
            response.pipe(data);
          })
          .on("error", function () {
            fs.unlink(filename);
          });
      });
    }
  });
}

electron.ipcMain.on("file_view", (event, file_url, file_ext, name) => {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Download",
          click: () => {
            download_file(file_url, name, file_ext);
          },
        },
        {
          label: "Close",
          role: "close",
        },
      ],
    },
  ];

  if (file_ext === "pdf") {
    const winpdf = new PDFWindow({ width: 1024, height: 600, frame: true });
    winpdf.loadURL(file_url);
    winpdf.setMenu(null);
  } else {
    let winimage = new BrowserWindow({ width: 1024, height: 600, frame: true });
    const menu = electron.Menu.buildFromTemplate(template);
    winimage.setMenu(menu);
    winimage.on("closed", () => {
      winimage = null;
    });
    winimage.loadURL(file_url);
  }
});
