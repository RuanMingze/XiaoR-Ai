const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

// 处理 Squirrel.Windows 事件（如果存在）
if (require('electron-squirrel-startup')) {
  app.quit();
  return;
}

// 检查是否已经有一个实例在运行
console.log('正在检查是否有其他实例在运行...');
const gotTheLock = app.requestSingleInstanceLock();
console.log('单实例锁检查结果：', gotTheLock);

if (!gotTheLock) {
  app.whenReady().then(() => {
    console.log('向已有实例发送焦点切换信号');
    // 发送second-instance事件，让已有实例处理
    app.quit();
  });
  
  return;
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
  console.log('检测到第二个实例启动，正在将焦点切换到主窗口');
  // 当运行第二个实例时，如果主窗口存在则将其聚焦
  if (mainWindow) {
    console.log('主窗口存在，正在恢复和聚焦');
    if (mainWindow.isMinimized()) {
      console.log('主窗口已最小化，正在恢复');
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
    console.log('主窗口已聚焦');
    
    // 向渲染进程发送消息，通知窗口需要聚焦
    mainWindow.webContents.send('bring-to-front');
  } else {
    console.log('主窗口不存在');
  }
});

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
  console.log('应用已就绪，开始创建窗口');
  createWindow();
  
  // 注册全局快捷键 Ctrl+Alt+R 来显示主窗口
  const { globalShortcut } = require('electron');
  
    // 从本地存储读取设置，检查是否需要显示悬浮球
  const fs = require('fs');
  const path = require('path');
  const settingsPath = path.join(app.getPath('userData'), 'xiaor-settings.json');
  
  let showFloatingBall = true; // 默认显示悬浮球
  
  try {
  } catch (error) {
    console.log('读取设置失败，使用默认值:', error.message);
  }
  
  // 初始时创建悬浮球，然后根据设置更新其可见性
  createFloatingBall();
  
  // 注册全局快捷键
  // 默认快捷键为 Ctrl+Alt+R，可以从设置中更改
  globalShortcut.register(currentShortcut, () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  
  app.on('activate', () => {
    console.log('应用激活事件触发');
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

// 当前快捷键
let currentShortcut = 'Ctrl+Alt+R';

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
  
  // 监听悬浮球点击事件，打开主程序窗口
  floatingBallWindow.webContents.on('did-finish-load', () => {
    // 向悬浮球窗口注入JavaScript代码来处理点击事件
    floatingBallWindow.webContents.executeJavaScript(`
      document.addEventListener('click', () => {
        // 向主进程发送消息，表示悬浮球被点击
        require('electron').ipcRenderer.send('floating-ball-clicked');
      });
      
      // 防止拖拽行为
      document.addEventListener('dragstart', (e) => {
        e.preventDefault();
      });
    `);
  });
  
  // 监听悬浮球点击事件
  ipcMain.on('floating-ball-clicked', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  
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
    // 设置frame为true以显示原生窗口框架
    frame: true,
    // 设置可调整大小
    resizable: true,
    // 设置最小尺寸
    minWidth: 600,
    minHeight: 400
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
  });
}

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序
app.on('window-all-closed', (event) => {
  if (process.platform !== 'darwin') {
    event.preventDefault(); // 阻止默认的退出行为
    // 保持应用运行，只隐藏主窗口
    if (mainWindow) {
      mainWindow.hide();
    }
    
    // 确保悬浮球仍然可见
    if (!floatingBallWindow) {
      createFloatingBall();
    } else {
      floatingBallWindow.show();
    }
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

// 处理清除所有对话的 IPC 通道
ipcMain.handle('clear-all-conversations', async (event) => {
  try {
    // 删除所有对话文件
    if (fs.existsSync(allConversationsFilePath)) {
      fs.unlinkSync(allConversationsFilePath);
      console.log('✅ 已清除所有对话数据文件');
    }
    return { success: true };
  } catch (error) {
    console.error('清除所有对话失败:', error);
    return { success: false, error: error.message };
  }
});

// 处理清除对话历史的 IPC 通道
ipcMain.handle('clear-conversation-history', async (event) => {
  try {
    // 删除对话历史文件
    if (fs.existsSync(historyFilePath)) {
      fs.unlinkSync(historyFilePath);
      console.log('✅ 已清除对话历史数据文件');
    }
    return { success: true };
  } catch (error) {
    console.error('清除对话历史失败:', error);
    return { success: false, error: error.message };
  }
});

// 处理 AI 请求的 IPC 通道
ipcMain.handle('send-ai-request', async (event, requestData) => {
  try {
    // 获取API端点，默认为Deepseek
    let apiEndpoint = requestData.apiEndpoint || 'https://api.jkyai.top/API/depsek3.2.php';
    
    // 根据API端点构建不同的参数格式
    let requestUrl;
    if (apiEndpoint.includes('yuanbao.php') || apiEndpoint.includes('hiku-4.5') || apiEndpoint.includes('doubao.php') || apiEndpoint.includes('depsek3.2.php') || apiEndpoint.includes('depsek3.2.php') || apiEndpoint.includes('qwen3.php') || apiEndpoint.includes('ling-1t.php') || apiEndpoint.includes('gemini2.5')) {
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
  // 悬浮球点击事件现在在floating-ball.html中处理
  // 这里不再打开主程序窗口
  console.log('悬浮球点击事件，但不打开主程序窗口');
});

// 监听悬浮球移动事件
ipcMain.on('move-floating-ball', (event, x, y) => {
  if (floatingBallWindow) {
    floatingBallWindow.setPosition(x, y);
  }
});

// 创建迷你输入框窗口
let miniInputWindow = null;

function createMiniInputWindow() {
  if (miniInputWindow) {
    // 如果窗口已存在，聚焦到它
    miniInputWindow.show();
    miniInputWindow.focus();
    return miniInputWindow;
  }
  
  // 获取悬浮球窗口的位置
  let x = 0, y = 0;
  if (floatingBallWindow) {
    const [currentX, currentY] = floatingBallWindow.getPosition();
    x = currentX - 320; // 在悬浮球左侧显示
    y = currentY;
  }
  
  miniInputWindow = new BrowserWindow({
    width: 320,
    height: 80,
    x: x,
    y: y,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: false,
      devTools: true
    },
    frame: false,
    transparent: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: true,
    backgroundColor: '#f0f0f0'
  });
  
  miniInputWindow.loadFile('mini-input.html');
  
  // 窗口关闭时清理引用
  miniInputWindow.on('closed', () => {
    miniInputWindow = null;
  });
  
  return miniInputWindow;
}

// 监听切换迷你输入框窗口的请求
ipcMain.on('toggle-mini-input-window', () => {
  toggleMiniInputWindow();
});

// 切换迷你输入框窗口
function toggleMiniInputWindow() {
  if (miniInputWindow) {
    // 如果窗口存在，则关闭它
    miniInputWindow.close();
    miniInputWindow = null;
  } else {
    // 如果窗口不存在，则创建它
    createMiniInputWindow();
  }
}

// 监听从迷你输入框启动主程序的请求
ipcMain.handle('launch-main-with-params', async (event, params) => {
  console.log('收到从迷你输入框启动主程序的请求:', params);
  
  // 这里我们直接在当前主窗口中处理消息，而不是启动新进程
  // 因为应用已经在运行中，我们向渲染进程发送消息来处理
  if (mainWindow && mainWindow.webContents) {
    try {
      // 发送消息到渲染进程，让它处理新消息
      mainWindow.webContents.send('mini-input-message', params);
      // 如果迷你输入框窗口存在，关闭它
      if (miniInputWindow) {
        miniInputWindow.close();
      }
      // 确保主窗口获得焦点
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
      return { success: true };
    } catch (error) {
      console.error('发送消息到渲染进程失败:', error);
      return { success: false, error: error.message };
    }
  } else {
    return { success: false, error: '主窗口不存在' };
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

// 处理窗口聚焦请求的 IPC 通道
ipcMain.handle('focus-window', async (event) => {
  try {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
      return { success: true };
    } else {
      return { success: false, error: '主窗口不存在' };
    }
  } catch (error) {
    console.error('窗口聚焦失败:', error);
    return { success: false, error: error.message };
  }
});

// 监听禁用悬浮球事件
ipcMain.on('disable-floating-ball', () => {
  if (floatingBallWindow) {
    floatingBallWindow.close();
    floatingBallWindow = null;
  }
});

// 处理更新悬浮球可见性的 IPC 通道
ipcMain.handle('update-floating-ball-visibility', async (event, visible) => {
  try {
    if (visible) {
      // 如果需要显示悬浮球，但悬浮球窗口不存在，则创建它
      if (!floatingBallWindow) {
        createFloatingBall();
      } else {
        // 如果悬浮球窗口已存在，确保它是显示状态
        floatingBallWindow.show();
      }
    } else {
      // 如果需要隐藏悬浮球，关闭并清理悬浮球窗口
      if (floatingBallWindow) {
        floatingBallWindow.close();
        floatingBallWindow = null;
      }
    }
    
    console.log(`悬浮球可见性已设置为: ${visible}`);
    return { success: true };
  } catch (error) {
    console.error('更新悬浮球可见性失败:', error);
    return { success: false, error: error.message };
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

// 处理窗口最小化的 IPC 通道
ipcMain.handle('minimize-window', async (event) => {
  try {
    if (mainWindow) {
      mainWindow.minimize();
      return { success: true };
    } else {
      return { success: false, error: '主窗口不存在' };
    }
  } catch (error) {
    console.error('窗口最小化失败:', error);
    return { success: false, error: error.message };
  }
});

// 处理窗口最大化/还原的 IPC 通道
ipcMain.handle('maximize-window', async (event) => {
  try {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      return { success: true };
    } else {
      return { success: false, error: '主窗口不存在' };
    }
  } catch (error) {
    console.error('窗口最大化/还原失败:', error);
    return { success: false, error: error.message };
  }
});

// 处理窗口关闭的 IPC 通道
ipcMain.handle('close-window', async (event) => {
  try {
    if (mainWindow) {
      mainWindow.close();
      return { success: true };
    } else {
      return { success: false, error: '主窗口不存在' };
    }
  } catch (error) {
    console.error('窗口关闭失败:', error);
    return { success: false, error: error.message };
  }
});

// 处理更新快捷键的 IPC 通道
ipcMain.handle('update-shortcut', async (event, newShortcut) => {
  const { globalShortcut } = require('electron');
  try {
    // 注销当前快捷键
    if (currentShortcut) {
      globalShortcut.unregister(currentShortcut);
    }
    
    // 注册新快捷键
    const success = globalShortcut.register(newShortcut, () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    
    if (success) {
      currentShortcut = newShortcut;
      console.log(`快捷键已更新为: ${newShortcut}`);
      return { success: true };
    } else {
      // 如果注册失败，重新注册默认快捷键
      globalShortcut.register('Ctrl+Alt+R', () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      });
      currentShortcut = 'Ctrl+Alt+R';
      console.log('快捷键注册失败，已恢复默认快捷键');
      return { success: false, error: '快捷键注册失败' };
    }
  } catch (error) {
    console.error('更新快捷键失败:', error);
    return { success: false, error: error.message };
  }
});

// 处理设置开机自启动的 IPC 通道
ipcMain.handle('set-auto-launch', async (event, enable) => {
  try {
    // 检测操作系统
    const platform = process.platform;
    
    if (platform === 'win32') {
      // Windows系统使用app.setLoginItemSettings
      // 在构建后的环境中，需要考虑Squirrel.Windows安装程序
      const options = {
        openAtLogin: enable
      };
      
      // 如果应用是通过安装程序安装的，需要指定启动路径
      if (app.isPackaged) {
        // 在打包应用中，使用app.getPath('exe')获取正确的可执行文件路径
        options.path = app.getPath('exe');
      }
      
      app.setLoginItemSettings(options);
    } else if (platform === 'darwin') {
      // macOS系统
      app.setLoginItemSettings({
        openAtLogin: enable
      });
    } else if (platform === 'linux') {
      // Linux系统，需要使用不同方法
      const { spawn } = require('child_process');
      
      if (enable) {
        // 添加到自动启动
        // 这里可以使用桌面环境的自动启动功能
        console.log('Linux自动启动设置待实现');
      } else {
        // 移除自动启动
        console.log('Linux自动启动移除待实现');
      }
    }
    
    console.log(`开机自启动设置为: ${enable} (应用打包状态: ${app.isPackaged})`);
    return { success: true };
  } catch (error) {
    console.error('设置开机自启动失败:', error);
    return { success: false, error: error.message };
  }
});