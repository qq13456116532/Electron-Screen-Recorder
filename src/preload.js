// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// preload.js
const { contextBridge, ipcRenderer} = require('electron');

// 暴露 API 供渲染进程使用
contextBridge.exposeInMainWorld('electronAPI', {
  getVideoSources: () => ipcRenderer.invoke('get-video-sources'),  // 请求主进程获取视频源
  createMenuItems: (inputSources) => createMenuItems(inputSources),
  showMenu: (template) => ipcRenderer.send('show-context-menu', template) , // 发送菜单模板到主进程，主进程负责显示菜单
  onMenuItemSelected: (callback) => ipcRenderer.on('menu-item-selected', (event,data) => callback(data)),
  bufferFromArrayBuffer: (arrayBuffer) => Buffer.from(arrayBuffer),
  showSaveDialog: () => ipcRenderer.invoke('dialog:save'),
  saveFile: (filePath, data) => ipcRenderer.invoke('file:save', filePath, data),
});



