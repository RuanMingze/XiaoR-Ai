const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  sendAIRequest: (requestData) => ipcRenderer.invoke('send-ai-request', requestData),
  saveConversationHistory: (history) => ipcRenderer.invoke('save-conversation-history', history),
  loadConversationHistory: () => ipcRenderer.invoke('load-conversation-history'),
  saveAllConversations: (conversations) => ipcRenderer.invoke('save-all-conversations', conversations),
  loadAllConversations: () => ipcRenderer.invoke('load-all-conversations'),
  clearAllConversations: () => ipcRenderer.invoke('clear-all-conversations'),
  clearConversationHistory: () => ipcRenderer.invoke('clear-conversation-history'),
  startVoiceRecognition: () => ipcRenderer.invoke('start-voice-recognition'),
  moveFloatingBall: (x, y) => ipcRenderer.send('move-floating-ball', x, y),
  updateFloatingBallVisibility: (visible) => ipcRenderer.invoke('update-floating-ball-visibility', visible),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  setAutoLaunch: (enable) => ipcRenderer.invoke('set-auto-launch', enable),
  updateShortcut: (newShortcut) => ipcRenderer.invoke('update-shortcut', newShortcut),
  launchMainWithParams: (params) => ipcRenderer.invoke('launch-main-with-params', params),
  onMiniInputMessage: (callback) => ipcRenderer.on('mini-input-message', (event, ...args) => callback(...args)),
});