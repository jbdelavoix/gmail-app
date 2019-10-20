const {
  app,
  ipcMain,
  BrowserWindow,
  Menu
} = require("electron")

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


function pageProcess() {

  window.onbeforeunload = function (e) {
    // Unlike usual browsers, in which a string should be returned and the user is
    // prompted to confirm the page unload. Electron gives the power completely
    // to the developers, return empty string or false would prevent the unloading
    // now. You can also use the dialog API to let user confirm it.
    // return false
  }

  function isInt(value) {
    return !isNaN(value) && (function (x) {
      return (x | 0) === x
    })(parseFloat(value))
  }

  function getElementsByXPath(xpath, parent) {
    let results = [];
    let query = document.evaluate(xpath, parent || document,
      null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0, length = query.snapshotLength; i < length; ++i) {
      results.push(query.snapshotItem(i));
    }
    return results;
  }

  let ipcRenderer = window["require"]("electron").ipcRenderer

  function loopFunction() {
    header = document.getElementById("gb")
    header.setAttribute("style", "background: rgba(16, 16, 16, 0.30); padding-top: 20px; -webkit-user-select: none; -webkit-app-region: drag;")

    links = document.getElementsByTagName("a")
    for (let i = 0; i < links.length; i++) {
      link = links[i]
      link.removeAttribute("target")
    }

    let unreadMails = 0

    elements = getElementsByXPath("//div[contains(@class, 'n3')]/div[contains(@class, 'byl')][1]/div[contains(@class, 'TK')]/div[contains(@class, 'aim')]//div[contains(@class, 'bsU')]/text()")
    for (let i = 0; i < elements.length; i++) {
      element = elements[i]
      elementText = element.data
      if (isInt(elementText)) {
        unreadMails += parseInt(elementText)
      }
    }
    ipcRenderer.send("unread-mails", unreadMails)
  }

  function loop() {
    try {
      loopFunction()
    } catch (error) {
      console.error(error)
    }
    setTimeout(loop, 500)
  }
  loop()
}

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadURL("https://www.gmail.com")

  wc = mainWindow.webContents

  wc.on("did-finish-load", function () {
    wc.executeJavaScript(pageProcess.toString() + "; pageProcess()", true)
  })

  ipcMain.on("unread-mails", function (event, unreadMails) {
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