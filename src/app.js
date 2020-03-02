const {
  app,
  ipcMain,
  session,
  BrowserWindow,
  Menu,
} = require("electron")
const fs = require("fs")
const path = require("path")


function addMenu(platform) {
  let menu = Menu.buildFromTemplate([{
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
  ])

  if (platform == "darwin") {
    Menu.setApplicationMenu(menu)
  } else {
    Menu.setApplicationMenu(null)
  }
}


function createWindow() {
  // Change user-agent
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

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    titleBarStyle: "hiddenInset",
    icon: path.join(__dirname, "/build/icons/icon.png"),
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  })

  // Open the devtools
  // mainWindow.openDevTools()

  // Load the app
  mainWindow.loadURL("https://accounts.google.com/signin/v2/identifier?service=mail")

  // Load custom style
  mainWindow.webContents.on("dom-ready", () => {
    mainWindow.webContents.insertCSS(
      fs.readFileSync(path.join(__dirname, "style.css"), "utf8")
    )
  })

  // On ipcEvent...
  ipcMain.on("unread-mails:count", function (event, unreadMails) {
    if (unreadMails != 0) {
      app.dock.setBadge(unreadMails.toString())
    } else {
      app.dock.setBadge("")
    }
  })

  ipcMain.on("contextmenu:open", function (event, x, y) {
    let contextmenu = Menu.buildFromTemplate([{
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
      },
      {
        type: "separator"
      },
      {
        label: "Advanced",
        submenu: [{
            role: "reload"
          },
          {
            role: "toggledevtools"
          },
        ]
      }
    ])
    contextmenu.popup({
      window: mainWindow,
      x,
      y
    })
  })

  if (process.platform == "darwin") {
    app.on("activate-with-no-open-windows", function () {
      mainWindow.show()
    })
  }

  // Emitted when the window is closed.
  mainWindow.on("close", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    if (process.platform != "darwin") {
      mainWindow = null
    } else {
      mainWindow.hide()
    }
  })
}


// Keep a global reference of the window object, if you don"t, the window will
// be closed automatically when the javascript object is GCed.
let mainWindow = null

// Add menu
addMenu(process.platform)

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  if (process.platform != "darwin")
    app.quit()
})

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on("ready", createWindow)