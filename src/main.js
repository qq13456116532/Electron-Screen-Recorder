const { app, BrowserWindow ,ipcMain,desktopCapturer,Menu,dialog } = require('electron');
const path = require('node:path');
const { writeFile } = require('fs');
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,  // 禁用 Node.js 集成
      contextIsolation: true,  // 启用上下文隔离，确保安全
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

    // 监听渲染进程发送的 'get-video-sources' 消息
    ipcMain.handle('get-video-sources', async () => {
      const inputSources = await desktopCapturer.getSources({ types: ['screen'] });
      return inputSources;  // 将视频源返回给渲染进程
    });
    // 接收来自渲染进程的菜单模板，并显示菜单
    ipcMain.on('show-context-menu', (event, template) => {
      // 为每个菜单项动态添加 `click` 事件
      const menuTemplate = template.map(item => ({
        label: item.label,
        id: item.id,
        click: () => {
          // 发送选中的 label 到渲染进程
          event.sender.send('menu-item-selected', { id: item.id, label: item.label });
          }
        }));

        const menu = Menu.buildFromTemplate(menuTemplate);
        menu.popup();
    });
    // 处理渲染进程请求保存文件的对话框
    ipcMain.handle('dialog:save', async (event) => {
      const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`
      });
      return filePath; // 将文件路径返回给渲染进程
    });
    // 处理文件写入请求
    ipcMain.handle('file:save', (event, filePath, buffer) => {
      writeFile(filePath, buffer, () => {console.log('video saved successfully!'); return { success: true };});
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
