const { app, BrowserWindow, ipcMain, menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 创建数据目录和处理对话历史的函数
const userDataPath = path.join(os.homedir(), '.xiaor-ai');
const historyFilePath = path.join(userDataPath, 'conversation-history.json');
const allConversationsFilePath = path.join(userDataPath, 'all-conversations.json');

// 确保数据目录存在
function ensureDataDirectory() {
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
}

// 保存对话历史到文件
function saveConversationHistory(history) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('保存对话历史失败:', error);
  }
}

// 从文件读取对话历史
function loadConversationHistory() {
  try {
    if (fs.existsSync(historyFilePath)) {
      const data = fs.readFileSync(historyFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('读取对话历史失败:', error);
  }
  return []; // 如果文件不存在或读取失败，返回空数组
}

// 保存所有对话到文件
function saveAllConversations(conversations) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(allConversationsFilePath, JSON.stringify(conversations, null, 2));
  } catch (error) {
    console.error('保存所有对话失败:', error);
  }
}

// 从文件读取所有对话
function loadAllConversations() {
  try {
    if (fs.existsSync(allConversationsFilePath)) {
      const data = fs.readFileSync(allConversationsFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('读取所有对话失败:', error);
  }
  return []; // 如果文件不存在或读取失败，返回空数组
}

// 创建浏览器窗口
function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'RuanmAi.png'), // 设置应用图标
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    // 移除原生菜单栏
    autoHideMenuBar: true,
    // 隐藏原生菜单栏
    menuBarVisible: false,
    // 设置frame为true保留原生窗口框架
    frame: true
  });

  // 加载应用的主页面
  mainWindow.loadFile('index.html');

  // 开发环境下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    // 在 macOS 上，当单击 dock 图标并且没有其他窗口打开时，通常会在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 处理保存对话历史的 IPC 通道
ipcMain.handle('save-conversation-history', async (event, history) => {
  try {
    saveConversationHistory(history);
    return { success: true };
  } catch (error) {
    console.error('保存对话历史失败:', error);
    return { success: false, error: error.message };
  }
});

// 处理读取对话历史的 IPC 通道
ipcMain.handle('load-conversation-history', async (event) => {
  try {
    const history = loadConversationHistory();
    return history;
  } catch (error) {
    console.error('读取对话历史失败:', error);
    return [];
  }
});

// 处理保存所有对话的 IPC 通道
ipcMain.handle('save-all-conversations', async (event, conversations) => {
  try {
    saveAllConversations(conversations);
    return { success: true };
  } catch (error) {
    console.error('保存所有对话失败:', error);
    return { success: false, error: error.message };
  }
});

// 处理读取所有对话的 IPC 通道
ipcMain.handle('load-all-conversations', async (event) => {
  try {
    const conversations = loadAllConversations();
    return conversations;
  } catch (error) {
    console.error('读取所有对话失败:', error);
    return [];
  }
});

// 处理 AI 请求的 IPC 通道
ipcMain.handle('send-ai-request', async (event, requestData) => {
  try {
    // 获取API端点，默认为Deepseek
    let apiEndpoint = requestData.apiEndpoint || 'https://api.jkyai.top/API/depsek3.1.php';
    
    // 根据API端点构建不同的参数格式
    let requestUrl;
    if (apiEndpoint.includes('yuanbao.php') || apiEndpoint.includes('hiku-4.5') || apiEndpoint.includes('doubao.php') || apiEndpoint.includes('depsek3.1.php') || apiEndpoint.includes('qwen3.php')) {
      // 腾讯元宝、Claude(豆包)、Deepseek和Qwen3 API使用 question 参数
      const params = new URLSearchParams({
        question: requestData.ques,
        system: requestData.system
      });
      requestUrl = `${apiEndpoint}?${params.toString()}`;
    } else {
      // 其他API使用 ques 参数
      const params = new URLSearchParams({
        ques: requestData.ques,
        system: requestData.system
      });
      requestUrl = `${apiEndpoint}?${params.toString()}`;
    }
    
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const resultText = await response.text();
    return resultText;
  } catch (error) {
    console.error('AI 请求失败:', error);
    return { error: error.message };
  }
});