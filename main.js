const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

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

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    // 在 macOS 上，当单击 dock 图标并且没有其他窗口打开时，通常会在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      // 如果窗口存在但被隐藏（最小化到托盘），则显示它
      if (mainWindow && !mainWindow.isVisible()) {
        mainWindow.show();
      }
    }
  });
});

// 监听应用退出事件
app.on('before-quit', () => {
  app.quitting = true; // 设置退出标志
});

// 全局变量用于保存托盘图标引用
let tray = null;

// 悬浮球窗口引用
let floatingBallWindow = null;

// 聊天窗口引用
let chatWindow = null;

// 创建系统托盘图标
function createTray() {
  if (tray) return; // 避免重复创建
  
  // 创建托盘图标
  const iconPath = path.join(__dirname, 'RuanmAi.png');
  const iconImage = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(iconImage);
  
  // 设置托盘图标提示文本
  tray.setToolTip('小R助手');
  
  // 创建托盘右键菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          // 同时隐藏悬浮球
          if (floatingBallWindow) {
            floatingBallWindow.hide();
          }
        }
      }
    },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  // 设置托盘菜单
  tray.setContextMenu(contextMenu);
  
  // 设置托盘图标点击事件
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      // 同时隐藏悬浮球
      if (floatingBallWindow) {
        floatingBallWindow.hide();
      }
    }
  });
}

// 创建悬浮球窗口
function createFloatingBall() {
  if (floatingBallWindow) {
    floatingBallWindow.show();
    return;
  }
  
  floatingBallWindow = new BrowserWindow({
    width: 60,
    height: 60,
    transparent: true,  // 透明背景
    frame: false,       // 无边框
    resizable: false,   // 不可调整大小
    alwaysOnTop: true,  // 始终置顶
    skipTaskbar: true,  // 不在任务栏显示
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'RuanmAi.png')
  });
  
  // 设置窗口为点击穿透，这样用户可以点击悬浮球后面的元素
  floatingBallWindow.setIgnoreMouseEvents(false);
  
  floatingBallWindow.loadFile(path.join(__dirname, 'floating-ball.html'));
  
  // 设置窗口位置到屏幕右下角
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workArea;
  
  floatingBallWindow.setPosition(width - 80, height - 80);
  
  // 注释掉旧的悬浮球点击事件监听器
  // ipcMain.on('floating-ball-clicked', () => {
  //   createChatWindow();
  // });
  
  // 当悬浮球窗口关闭时清理引用
  floatingBallWindow.on('closed', () => {
    floatingBallWindow = null;
  });
}

// 创建聊天窗口
function createChatWindow() {
  if (chatWindow) {
    chatWindow.show();
    chatWindow.focus();
    return;
  }
  
  chatWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    icon: path.join(__dirname, 'RuanmAi.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  chatWindow.loadFile(path.join(__dirname, 'chat-window.html'));
  
  // 监听窗口关闭事件
  chatWindow.on('closed', () => {
    chatWindow = null;
  });
}

// 主窗口引用
let mainWindow = null;

// 修改createWindow函数，将mainWindow设为全局变量
function createWindow() {
  mainWindow = new BrowserWindow({
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

  // 拦截新窗口创建事件，将链接在外部浏览器中打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // 使用系统默认浏览器打开链接
    require('electron').shell.openExternal(url);
    return { action: 'deny' }; // 阻止在新窗口中打开
  });

  // 开发环境下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
  
  // 当窗口关闭时，最小化到托盘而不是退出
  mainWindow.on('close', (event) => {
    if (app.quitting) {
      // 如果是正在退出应用，则正常关闭
      return;
    }
    event.preventDefault(); // 阻止默认关闭行为
    mainWindow.hide(); // 隐藏窗口
    
    // 创建托盘图标（如果不存在）
    createTray();

    // 显示悬浮球
    createFloatingBall();
  });
}

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 不直接退出，而是最小化到托盘
    // app.quit(); // 注释掉直接退出
  }
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
    let apiEndpoint = requestData.apiEndpoint || 'https://api.jkyai.top/API/depsek3.2.php';
    
    // 根据API端点构建不同的参数格式
    let requestUrl;
    if (apiEndpoint.includes('yuanbao.php') || apiEndpoint.includes('hiku-4.5') || apiEndpoint.includes('doubao.php') || apiEndpoint.includes('depsek3.2.php') || apiEndpoint.includes('depsek3.2.php') || apiEndpoint.includes('qwen3.php')) {
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

// 监听悬浮球点击事件
ipcMain.on('floating-ball-clicked', () => {
  if (mainWindow) {
    mainWindow.show(); // 显示主窗口
    mainWindow.focus(); // 聚焦到主窗口
  }
  
  // TODO: 未来版本可能会改成打开类似豆包的迷你聊天界面，提供更轻量化的交互体验
});

// 监听悬浮球移动事件
ipcMain.on('move-floating-ball', (event, x, y) => {
  if (floatingBallWindow) {
    floatingBallWindow.setPosition(x, y);
  }
});

// 监听打开主窗口事件
ipcMain.on('open-main-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// 监听关闭应用事件
ipcMain.on('close-app', () => {
  app.quit();
});

// 监听禁用悬浮球事件
ipcMain.on('disable-floating-ball', () => {
  if (floatingBallWindow) {
    floatingBallWindow.close();
    floatingBallWindow = null;
  }
});

// 处理语音识别的 IPC 通道
ipcMain.handle('start-voice-recognition', async (event) => {
  return new Promise((resolve, reject) => {
    // 检测操作系统类型
    const platform = process.platform;
    
    if (platform === 'win32') {
      // Windows系统使用PowerShell调用系统语音识别
      try {
        // 这里使用Windows Speech Recognition API的PowerShell命令
        const powershell = spawn('powershell.exe', [
          '-Command',
          `Add-Type -AssemblyName System.Speech;`
          + ` $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine;`
          + ` $dictationGrammar = New-Object System.Speech.Recognition.DictationGrammar;`
          + ` $recognizer.LoadGrammar($dictationGrammar);`
          + ` $result = $recognizer.Recognize();`
          + ` if ($result) { Write-Output $result.Text } else { Write-Output "" }`
        ]);
        
        let output = '';
        powershell.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        powershell.stderr.on('data', (data) => {
          console.error(`语音识别错误: ${data}`);
        });
        
        powershell.on('close', (code) => {
          if (code === 0) {
            resolve(output.trim());
          } else {
            resolve(''); // 如果出错，返回空字符串
          }
        });
        
      } catch (error) {
        console.error('启动语音识别失败:', error);
        resolve('');
      }
    } else {
      // 对于其他系统，返回不支持的提示
      resolve('语音识别功能仅支持Windows系统');
    }
  });
});