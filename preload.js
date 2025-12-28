const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  sendAIRequest: (requestData) => ipcRenderer.invoke('send-ai-request', requestData),
  saveConversationHistory: (history) => ipcRenderer.invoke('save-conversation-history', history),
  loadConversationHistory: () => ipcRenderer.invoke('load-conversation-history'),
  saveAllConversations: (conversations) => ipcRenderer.invoke('save-all-conversations', conversations),
  loadAllConversations: () => ipcRenderer.invoke('load-all-conversations'),
});