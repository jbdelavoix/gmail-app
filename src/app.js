const {
  app,
  ipcMain,
  session,
  BrowserWindow,
  Menu
} = require("electron")

const path = require("path")
const fs = require("fs")


let mainWindow = null

app.on("window-all-closed", function () {
  if (process.platform != "darwin")
    app.quit()
  app.quit()
})

let template = [{
    label: "Home",
    submenu: [{
        role: "about"
      },
      {
        type: "separator"
      },
      {
        label: "Services",
        submenu: []
      },
      {
        type: "separator"
      },
      {
        role: "hide"
      },
      {
        role: "hideOthers"
      },
      {
        role: "unhide"
      },
      {
        type: "separator"
      },
      {
        role: "quit"
      },
    ]
  },
  {
    label: "Edit",
    submenu: [{
        role: "undo"
      },
      {
        role: "redo"
      },
      {
        type: "separator"
      },
      {
        role: "cut"
      },
      {
        role: "copy"
      },
      {
        role: "paste"
      }
    ]
  }, {
    label: "View",
    submenu: [{
        role: "reload"
      },
      {
        role: "toggledevtools"
      },
      {
        type: "separator"
      },
      {
        role: "resetzoom"
      },
      {
        role: "zoomin"
      },
      {
        role: "zoomout"
      },
      {
        type: "separator"
      },
      {
        role: "togglefullscreen"
      }
    ]
  }, {
    role: "window",
    submenu: [{
        role: "minimize"
      },
      {
        role: "close"
      }
    ]
  }, {
    role: "help",
    submenu: [{
      label: "Learn More"
    }]
  }
]

menu = Menu.buildFromTemplate(template)

function createWindow() {

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const url = new URL(details.url)
    // Google login : Will throw a "Your browser is unsecured" and will not permit authentification,
    // even using a valid Chrome User-Agent
    // See https://github.com/timche/gmail-desktop/issues/174
    // Using a Firefox User-Agent works
    if (url.hostname == "accounts.google.com") {
      details.requestHeaders["User-Agent"] = "Mozilla/5.0 (X11; Linux i586; rv:31.0) Gecko/20100101 Firefox/73.0"
    }
    callback({
      cancel: false,
      requestHeaders: details.requestHeaders
    })
  })

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  })

  mainWindow.loadURL("https://accounts.google.com/signin/v2/identifier?service=mail")

  mainWindow.webContents.on("dom-ready", () => {
    mainWindow.webContents.insertCSS(
      fs.readFileSync(path.join(__dirname, "style.css"), "utf8")
    )
  })

  ipcMain.on("unread-count", function (event, unreadMails) {
    if (unreadMails != 0) {
      app.dock.setBadge(unreadMails.toString())
    } else {
      app.dock.setBadge("")
    }
  })

  if (process.platform == "darwin")
    app.on("activate-with-no-open-windows", function () {
      mainWindow.show()
    })

  Menu.setApplicationMenu(menu)

  mainWindow.on("close", function () {
    if (process.platform != "darwin") {
      mainWindow = null
    } else {
      mainWindow = null
    }
  })
}

app.on("ready", createWindow)