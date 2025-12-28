// 获取 DOM 元素
const chatHistory = document.getElementById('chatHistory');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// 设置相关元素
const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');
const themeSelect = document.getElementById('themeSelect');
const contextSelect = document.getElementById('contextSelect');
const voiceToggle = document.getElementById('voiceToggle');
const aiModelSelect = document.getElementById('aiModelSelect');
const saveSettingsButton = document.getElementById('saveSettings');
const closeSettingsButton = document.getElementById('closeSettings');
const clearDataButton = document.getElementById('clearDataButton');

// 获取新对话按钮元素
const newChatButton = document.getElementById('newChatButton');

// 获取语音输入按钮元素
const voiceInputButton = document.querySelector('.inline-voice-btn');

// 存储所有对话
let allConversations = [];

// 当前对话ID
let currentConversationId = null;

// 当前播放的音频对象
let currentAudio = null;

// 当前激活的技能模式
let activeSkillMode = null;

// 当前AI请求状态
let currentRequestAborted = false;

// 修改parseMarkdown函数，增强代码块处理
function parseMarkdown(text) {
  // 处理行内代码
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 处理粗体
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // 处理斜体
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 处理链接
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  // 自动识别并转换纯文本链接 (http, https, file)
  text = text.replace(/\b(https?:\/\/|file:\/\/)[\w\-\.~:\/?#\[\]@!\$&'\(\)\*\+,;=%]+/gi, '<a href="$&" target="_blank">$&</a>');
  
  // 处理XiaoR://Showimage，将其转换为显示本地图片
  text = text.replace(/XiaoR:\/\/Showimage/g, '<img src="RuanmAi.png" alt="小R形象图片" style="max-width: 200px; max-height: 200px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">');
  
  // 处理无序列表
  text = text.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  
  // 处理有序列表
  text = text.replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>');
  
  // 处理标题
  text = text.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
  text = text.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
  text = text.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
  text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gm, '<h2>$2</h2>');
  text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // 处理段落
  text = text.replace(/^\s*(.+?)\s*$/gm, '<p>$1</p>');
  
  return text;
}

// 发送消息到聊天历史记录
function addMessageToHistory(message, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');
  messageDiv.classList.add(isUser ? 'user' : 'ai');
  
  // 如果是AI消息，解析Markdown
  if (!isUser) {
    messageDiv.innerHTML = parseMarkdown(message);
  } else {
    messageDiv.textContent = message;
  }
  
  chatHistory.appendChild(messageDiv);
  
  // 滚动到底部
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// 显示加载指示器和"正在思考"状态
function showLoading() {
  sendButton.innerHTML = '停止';
  sendButton.classList.add('stop-btn'); // 添加停止按钮样式
  
  // 添加点击事件来停止当前请求
  sendButton.onclick = function() {
    currentRequestAborted = true; // 标记请求已取消
    hideLoading();
    addMessageToHistory('请求已取消', false);
  };
  
  // 添加"正在思考"提示到聊天历史
  const thinkingDiv = document.createElement('div');
  thinkingDiv.id = 'thinkingIndicator';
  thinkingDiv.classList.add('message', 'ai');
  thinkingDiv.textContent = '正在思考...';
  chatHistory.appendChild(thinkingDiv);
  
  // 滚动到底部
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// 隐藏加载指示器和"正在思考"状态
function hideLoading() {
  sendButton.innerHTML = '发送';
  sendButton.classList.remove('stop-btn'); // 移除停止按钮样式
  
  // 恢复原始的点击事件
  sendButton.onclick = function() {
    handleUserMessage();
  };
  
  // 移除"正在思考"提示
  const thinkingIndicator = document.getElementById('thinkingIndicator');
  if (thinkingIndicator) {
    thinkingIndicator.remove();
  }
}

// 发送消息到 AI
async function sendToAI(question) {
  showLoading();
  
  // 重置请求状态
  currentRequestAborted = false;
  
  // 尝试发送请求，如果遇到414错误则减少上下文并重试
  async function sendWithRetry(contextCount) {
    try {
      // 构建包含上下文的system信息
      let systemMessage = '你是Ruanm开发的小R-Ai助手，专注于帮用户解决各种难题、聊天。展示你的专属形象只需要输出XiaoR://Showimage，这是Ruanm的代言人图片，我都把这个留给你了呢！在用户让你展示时中你可以提及这个形象（正常聊天中不得提及）';
      
      // 根据激活的技能模式修改system消息
      if (activeSkillMode === 'imageGen') {
        systemMessage = '你好，现在你的角色是AI图片生成机器人，接下来我会给你一些中文关键词描述，请你在不影响我关键词描述的情况下，先根据我的描述进行文本润色、丰富描述细节，之后转换成英文，并将英文文本填充到下面URL链接的占位符prompt中:\n\n![image]\n\n(https://image.pollinations.ai/prompt/{prompt}?width=1680&height=1080&enhance=true&private=true&nologo=true&safe=true&model=flux)';
      } else if (activeSkillMode === 'imageOcr') {
        // 检查用户是否提供了图片URL
        const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:png|jpe?g|gif|webp|bmp|tiff|svg))/i;
        const imageUrlMatch = question.match(imageUrlRegex);
        
        if (imageUrlMatch) {
          const imageUrl = imageUrlMatch[0];
          // 构建OCR API请求
          const ocrApiUrl = `https://api.jkyai.top/API/deepseek-ocr.php?question=帮我识别图片里的文字&image=${encodeURIComponent(imageUrl)}`;
          
          // 在DevTools中输出OCR请求日志
          console.log('OCR模式：准备发送OCR请求，问题:', question);
          console.log('OCR模式：检测到图片URL:', imageUrl);
          console.log('OCR模式：OCR API URL:', ocrApiUrl);
          
          // 构建OCR API请求的system消息，要求AI直接输出识别的文字内容
          systemMessage = `你现在要帮助用户识别图片里的文字，OCR的API：${ocrApiUrl}。请直接输出识别到的所有文字内容，不要解释API的使用方法或其他内容。`;
        } else {
          // 如果没有检测到图片URL，使用普通OCR提示
          systemMessage = '你现在要帮助用户识别图片里的文字，OCR的APi：https://api.jkyai.top/API/deepseek-ocr.php?question=帮我识别图片里的文字&image=用户提供的图片URL。请直接输出识别到的所有文字内容，不要解释API的使用方法或其他内容。';
          
          // 在DevTools中输出OCR请求日志
          console.log('OCR模式：准备发送OCR请求，问题:', question);
          console.log('OCR模式：未检测到图片URL，提示用户提供图片URL');
        }
      } else if (activeSkillMode === 'translation') {
        // 翻译模式：要求AI进行翻译
        systemMessage = '你现在是一个专业的翻译助手，用户将提供需要翻译的文本。请直接输出翻译结果，不要添加任何解释或额外内容。如果用户没有明确指定目标语言，请询问用户需要翻译成哪种语言。';
        
        // 在DevTools中输出翻译请求日志
        console.log('翻译模式：准备发送翻译请求，问题:', question);
      }
      
      // 获取当前对话的历史，添加到system信息中
      const currentHistory = getConversationHistory();
      if (currentHistory.length > 0 && contextCount > 0) {
        // 只保留最近的几轮对话，避免system信息过长
        const recentHistory = currentHistory.slice(-contextCount);
        
        if (recentHistory.length > 0) {
          systemMessage += '\n\n以下是之前的对话历史：';
          recentHistory.forEach((item, index) => {
            if (item.role === 'user') {
              systemMessage += `\n用户: ${item.content}`;
            } else {
              systemMessage += `\nAI助手: ${item.content}`;
            }
          });
        }
      }
      
      // 准备请求数据
      const requestData = {
        ques: question,
        system: systemMessage
      };
      
      // 在DevTools中输出请求内容
      console.log('发送AI请求:', requestData);
      
      // 获取当前AI模型设置
      const savedSettings = localStorage.getItem('xiaor-settings');
      let aiModel = 'deepseek'; // 默认为Deepseek
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        aiModel = settings.aiModel || 'deepseek';
      }
      
      // 根据AI模型选择API端点
      let apiEndpoint = 'https://api.jkyai.top/API/depsek3.1.php'; // 默认为Deepseek
      if (aiModel === 'claude') {
        apiEndpoint = 'https://api.jkyai.top/API/doubao.php'; // 豆包
      } else if (aiModel === 'yuanbao') {
        apiEndpoint = 'https://api.jkyai.top/API/yuanbao.php'; // 腾讯元宝
      } else if (aiModel === 'qwen3') {
        apiEndpoint = 'https://api.jkyai.top/API/qwen3.php'; // Qwen3
      }
      
      // 通过 Electron API 发送请求
      const response = await window.electronAPI.sendAIRequest({
        ques: requestData.ques,
        system: requestData.system,
        apiEndpoint: apiEndpoint
      });
      
      // 检查请求是否已被用户取消
      if (currentRequestAborted) {
        console.log('AI请求已被用户取消');
        return null;
      }
      
      // 在DevTools中输出响应内容
      console.log('AI响应:', response);
      
      // 检查是否是414错误，如果是则减少上下文并重试
      if (response.error && (response.error.includes('414') || response.error.includes('Request-URI Too Large'))) {
        throw new Error('414 Request-URI Too Large');
      }
      
      return response;
    } catch (error) {
      // 检查错误是否与URI过长相关
      if (error.message.includes('414') || error.message.includes('Request-URI Too Large')) {
        throw error; // 重新抛出错误以触发重试逻辑
      }
      throw error;
    }
  }
  
  try {
    // 获取设置的上下文对话数量
    const savedSettings = localStorage.getItem('xiaor-settings');
    let maxContextCount = 4; // 默认值为4（2轮对话）
    
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.contextCount) {
        if (settings.contextCount === 'all') {
          // 如果选择完整历史，设置为一个较大的初始值
          const currentHistory = getConversationHistory();
          maxContextCount = currentHistory.length;
        } else {
          // 否则使用设置的值
          maxContextCount = parseInt(settings.contextCount);
        }
      }
    }
    
    // 尝试发送请求，如果失败则逐步减少上下文数量
    let response;
    let currentContextCount = maxContextCount;
    let lastError;
    
    while (currentContextCount >= 0) {
      try {
        response = await sendWithRetry(currentContextCount);
        break; // 成功则退出循环
      } catch (error) {
        lastError = error;
        
        // 如果是414错误，减少上下文数量并重试
        if (error.message.includes('414') || error.message.includes('Request-URI Too Large')) {
          console.log(`收到414错误，减少上下文数量从 ${currentContextCount} 到 ${currentContextCount - 2}`);
          currentContextCount -= 2; // 每次减少2（一轮对话）
          
          if (currentContextCount < 0) {
            currentContextCount = 0; // 确保不低于0
          }
          
          continue; // 继续尝试
        } else {
          // 如果不是414错误，直接抛出
          throw error;
        }
      }
    }
    
    if (response) {
      if (response.error) {
        addMessageToHistory(`错误: ${response.error}`, false);
      } else {
        // 成功获取 AI 回复
        const aiResponse = response;
        addMessageToHistory(aiResponse, false);
        
        // 播放AI语音回复
        playAIVoice(aiResponse);
        
        // 更新当前对话的历史
        const currentHistory = getConversationHistory();
        currentHistory.push({ role: 'user', content: question });
        currentHistory.push({ role: 'assistant', content: aiResponse });
        setConversationHistory(currentHistory);
        
        // 保存所有对话到本地
        await saveAllConversations();
        
        // 如果这是对话中的第一次AI回复，尝试生成对话标题
        if (currentHistory.length === 2) { // 用户问题 + AI回复 = 2
          setTimeout(() => {
            generateConversationTitle(currentConversationId);
          }, 1000); // 延迟1秒执行，避免影响主要对话流程
        }
      }
    } else {
      // 如果response为null（例如请求被取消），则不执行任何操作
      console.log('请求被取消或未返回响应');
    }
  } catch (error) {
    // 如果所有重试都失败了，显示最后一次的错误
    if (lastError && (lastError.message.includes('414') || lastError.message.includes('Request-URI Too Large'))) {
      addMessageToHistory('错误: 请求过长，已自动减少对话历史但仍然失败，请尝试重新开始对话', false);
    } else {
      addMessageToHistory(`请求失败: ${error.message}`, false);
    }
  } finally {
    hideLoading();
  }
}

// 处理用户发送消息
function handleUserMessage() {
  const message = userInput.value.trim();
  
  if (message) {
    // 如果没有当前对话，则创建一个新对话
    if (!currentConversationId) {
      const newId = createNewConversation();
      switchToConversation(newId);
    }
    
    // 添加用户消息到聊天历史
    addMessageToHistory(message, true);
    
    // 清空输入框
    userInput.value = '';
    
    // 发送消息到 AI
    sendToAI(message);
  }
}

// 事件监听器
sendButton.addEventListener('click', handleUserMessage);

userInput.addEventListener('keydown', (event) => {
  // 按回车键发送消息，按Shift+Enter换行
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault(); // 阻止默认换行行为
    handleUserMessage();
  }
});

// 初始化欢迎消息
document.addEventListener('DOMContentLoaded', async () => {
  // 尝试从本地加载所有对话
  try {
    allConversations = await window.electronAPI.loadAllConversations();
    
    // 如果有对话记录，切换到最近的对话
    if (allConversations.length > 0) {
      // 按更新时间排序，获取最新的对话
      allConversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      const latestConversation = allConversations[0];
      currentConversationId = latestConversation.id;
      
      // 显示当前对话的内容
      latestConversation.history.forEach(message => {
        addMessageToHistory(message.content, message.role === 'user');
      });
    } else {
      // 如果没有对话记录，创建并切换到新对话
      const newId = createNewConversation();
      switchToConversation(newId);
      
      // 显示欢迎消息
      addMessageToHistory('您好！我是小R AI助手，有什么可以帮助您的吗？', false);
    }
    
    // 更新对话列表显示
    updateChatListDisplay();
  } catch (error) {
    console.error('加载对话失败:', error);
    
    // 创建并切换到新对话
    const newId = createNewConversation();
    switchToConversation(newId);
    
    // 显示欢迎消息
    addMessageToHistory('您好！我是小R AI助手，有什么可以帮助您的吗？', false);
    
    // 更新对话列表显示
    updateChatListDisplay();
  }
});

/*
  爱心点击特效API
  描述：网站js装饰，点击出现彩色爱心
  请求URL：https://api.jkyai.top/API/js/love.js
  请求方法：GET/POST
  必填参数：无
  可选参数：无
  返回格式：JS
 */

// 引入爱心点击特效API的JS文件
function loadLoveEffect() {
  // 创建script标签
  const script = document.createElement('script');
  script.src = 'https://api.jkyai.top/API/js/love.js';
  script.type = 'text/javascript';
  
  // 监听加载完成事件
  script.onload = function() {
    console.log('爱心点击特效加载成功！');
  };
  
  // 监听加载失败事件
  script.onerror = function() {
    console.error('爱心点击特效加载失败，请检查网络连接或API地址是否正确。');
  };
  
  // 将script标签插入到页面中
  document.body.appendChild(script);
}

// 调用函数加载特效
loadLoveEffect();

// 可选参数：自定义爱心特效样式（示例，可根据需要取消注释）
/*
const customLoveStyle = {
  heartColor: 'rgba(255, 0, 0, 0.5)', // 爱心颜色
  heartSize: '30px', // 爱心大小
  heartSpeed: 'slow', // 爱心动画速度
  heartCount: 5 // 爱心数量
};

// 将自定义样式应用到特效（需要API支持该参数）
loadLoveEffect(customLoveStyle);
*/

// 错误提示信息
const errorMessages = {
  networkError: '网络错误，请检查网络连接。',
  invalidUrl: 'API地址无效，请检查URL是否正确。',
  apiUnavailable: 'API服务暂时不可用，请稍后再试。'
};

// 语音输入功能
let recognition;
let isListening = false;

// 初始化语音识别
function initSpeechRecognition() {
  // 检查浏览器是否支持语音识别API
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showVoiceInputError('您的浏览器不支持语音识别功能，请使用Chrome浏览器或更新浏览器版本。');
    return false;
  }
  
  try {
    // 创建语音识别实例
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;  // 不连续识别
    recognition.interimResults = true;  // 显示临时结果
    recognition.lang = 'zh-CN';  // 设置语言为中文
    
    // 识别结果事件
    recognition.onresult = function(event) {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      
      if (transcript) {
        // 将识别结果插入到输入框
        userInput.value += transcript;
        console.log('语音识别结果:', transcript);
      }
    };
    
    // 识别错误事件
    recognition.onerror = function(event) {
      console.error('语音识别错误:', event.error);
      showVoiceInputError(`语音识别出错: ${getRecognitionErrorMessage(event.error)}`);
      isListening = false;
      updateVoiceInputButton();
    };
    
    // 识别结束事件
    recognition.onend = function() {
      console.log('语音识别结束');
      isListening = false;
      updateVoiceInputButton();
    };
    
    return true;
  } catch (error) {
    console.error('初始化语音识别失败:', error);
    showVoiceInputError('初始化语音识别功能失败，请检查浏览器设置。');
    return false;
  }
}

// 获取语音识别错误信息
function getRecognitionErrorMessage(error) {
  const errorMessages = {
    'no-speech': '未检测到语音，请确认麦克风是否正常工作。',
    'audio-capture': '无法访问麦克风，请检查麦克风权限和连接。',
    'not-allowed': '麦克风访问被拒绝，请在浏览器设置中允许麦克风权限。',
    'service-not-allowed': '语音识别服务被拒绝，请检查浏览器设置。',
    'network-error': '网络错误导致语音识别失败。',
    'aborted': '语音识别被中止。'
  };
  
  return errorMessages[error] || '语音识别过程中发生未知错误。';
}

// 显示语音输入错误信息
function showVoiceInputError(message) {
  // 创建提示框
  const alertBox = document.createElement('div');
  alertBox.className = 'voice-input-alert';
  alertBox.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #ff6b6b;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    max-width: 400px;
    word-wrap: break-word;
  `;
  alertBox.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 5px;">语音输入错误</div>
    <div>${message}</div>
  `;
  
  document.body.appendChild(alertBox);
  
  // 3秒后自动移除提示框
  setTimeout(() => {
    if (alertBox.parentNode) {
      alertBox.parentNode.removeChild(alertBox);
    }
  }, 3000);
}

// 开始语音识别
function startVoiceRecognition() {
  if (!recognition) {
    if (!initSpeechRecognition()) {
      return;
    }
  }
  
  try {
    recognition.start();
    isListening = true;
    updateVoiceInputButton();
    console.log('开始语音识别');
  } catch (error) {
    console.error('启动语音识别失败:', error);
    showVoiceInputError('启动语音识别失败，请检查麦克风权限。');
  }
}

// 停止语音识别
function stopVoiceRecognition() {
  if (recognition && isListening) {
    recognition.stop();
    isListening = false;
    updateVoiceInputButton();
    console.log('停止语音识别');
  }
}

// 切换语音识别状态
function toggleVoiceRecognition() {
  if (isListening) {
    stopVoiceRecognition();
  } else {
    startVoiceRecognition();
  }
}

// 更新语音输入按钮状态
function updateVoiceInputButton() {
  if (voiceInputButton) {
    if (isListening) {
      voiceInputButton.innerHTML = '⏹️';  // 停止录制图标
      voiceInputButton.title = '停止语音输入';
      voiceInputButton.classList.add('recording');
    } else {
      voiceInputButton.innerHTML = '🎤';  // 麦克风图标
      voiceInputButton.title = '开始语音输入';
      voiceInputButton.classList.remove('recording');
    }
  }
}

// 初始化语音识别功能
initSpeechRecognition();

// 播放AI语音回复
async function playAIVoice(text) {
  // 检查语音功能是否启用
  const savedSettings = localStorage.getItem('xiaor-settings');
  let voiceEnabled = true; // 默认启用
  
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    voiceEnabled = settings.voiceEnabled !== undefined ? settings.voiceEnabled : true;
  }
  
  if (!voiceEnabled) {
    return; // 如果语音功能未启用，则不播放
  }
  
  try {
    // 去除表情符号
    const textWithoutEmojis = text.replace(/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu, '');
    
    // 调用API获取语音URL
    const response = await fetch(`https://api.jkyai.top/API/jhyysc.php?msg=${encodeURIComponent(textWithoutEmojis)}`);
    const data = await response.json();
    
    if (data.success && data.url) {
      // 如果当前有音频正在播放，先停止
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
      
      // 使用API返回的音频URL
      currentAudio = new Audio(data.url);
      
      // 播放音频
      await currentAudio.play();
      
      console.log('AI语音播放成功:', text);
      
      // 显示停止语音按钮
      stopVoiceButton.style.display = 'block';
      
      // 音频播放结束后清理引用并隐藏按钮
      currentAudio.onended = function() {
        currentAudio = null;
        stopVoiceButton.style.display = 'none';
      };
      
      currentAudio.onerror = function() {
        currentAudio = null;
        stopVoiceButton.style.display = 'none';
      };
    } else {
      console.error('API返回错误:', data);
    }
  } catch (error) {
    console.error('AI语音播放失败:', error);
  }
}

// 停止语音播放
function stopAIVoice() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
    console.log('AI语音已停止播放');
  }
}

// 检查网络连接状态
if (navigator.onLine === false) {
  console.error(errorMessages.networkError);
}

// 设置功能相关代码

// 加载保存的设置
function loadSettings() {
  const savedSettings = localStorage.getItem('xiaor-settings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    
    // 应用主题设置
    if (settings.theme === 'dark') {
      document.body.classList.add('dark-theme');
      themeSelect.value = 'dark';
    } else {
      document.body.classList.remove('dark-theme');
      themeSelect.value = 'light';
    }
    
    // 应用上下文设置
    if (settings.contextCount) {
      contextSelect.value = settings.contextCount;
    }
    
    // 应用语音设置
    if (settings.voiceEnabled !== undefined) {
      voiceToggle.checked = settings.voiceEnabled;
    } else {
      voiceToggle.checked = true; // 默认启用
    }
    
    // 应用AI模型设置
    if (settings.aiModel) {
      aiModelSelect.value = settings.aiModel;
    } else {
      aiModelSelect.value = 'deepseek'; // 默认为Deepseek
    }
  } else {
    // 默认设置
    voiceToggle.checked = true;
    aiModelSelect.value = 'deepseek'; // 默认为Deepseek
  }
}

// 保存设置
function saveSettings() {
  const settings = {
    theme: themeSelect.value,
    contextCount: contextSelect.value,
    voiceEnabled: voiceToggle.checked,
    aiModel: aiModelSelect.value
  };
  
  localStorage.setItem('xiaor-settings', JSON.stringify(settings));
  
  // 应用主题设置
  if (settings.theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  
  console.log('设置已保存:', settings);
}

// 设置面板事件监听器
settingsButton.addEventListener('click', () => {
  settingsPanel.classList.add('active');
});

saveSettingsButton.addEventListener('click', () => {
  saveSettings();
  settingsPanel.classList.remove('active');
});

closeSettingsButton.addEventListener('click', () => {
  // 恢复之前的设置值
  loadSettings();
  settingsPanel.classList.remove('active');
});

clearDataButton.addEventListener('click', () => {
  if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
    clearAllUserData();
  }
});

// 点击设置面板外部关闭面板
window.addEventListener('click', (event) => {
  if (event.target === settingsPanel) {
    // 恢复之前的设置值
    loadSettings();
    settingsPanel.classList.remove('active');
  }
});

// 对话列表功能
const chatListButton = document.getElementById('chatListButton');
const chatListSidebar = document.getElementById('chatListSidebar');
const closeChatListButton = document.getElementById('closeChatList');

// 打开对话列表
chatListButton.addEventListener('click', () => {
  chatListSidebar.classList.add('active');
});

// 关闭对话列表
closeChatListButton.addEventListener('click', () => {
  chatListSidebar.classList.remove('active');
});

// 点击对话列表外部关闭列表
window.addEventListener('click', (event) => {
  if (chatListSidebar.classList.contains('active') && 
      !chatListSidebar.contains(event.target) && 
      event.target !== chatListButton) {
    chatListSidebar.classList.remove('active');
  }
});

// 生成对话标题
async function generateConversationTitle(conversationId) {
  const conversation = allConversations.find(conv => conv.id === conversationId);
  if (!conversation || conversation.history.length === 0) return;
  
  // 只有在标题还是默认值"对话 X"时才自动生成
  if (!conversation.title.startsWith('对话 ')) return;
  
  try {
    // 构建请求数据，让AI为对话生成一个简短标题
    const firstUserMessage = conversation.history.find(item => item.role === 'user');
    const firstAIMessage = conversation.history.find(item => item.role === 'assistant');
    
    if (!firstUserMessage || !firstAIMessage) return;
    
    // 构建system信息，要求AI生成对话标题
    let systemMessage = `你是Ruanm开发的小R-Ai助手。现在需要为以下对话生成一个简短的标题（最多10个字）。标题应该概括对话的主要内容或主题。请直接输出标题，不要添加任何其他内容。`;
    
    const requestData = {
      ques: `请为以下对话生成一个标题：\n用户问题: ${firstUserMessage.content}\nAI回复: ${firstAIMessage.content}\n请直接输出一个简洁的标题，最多10个字，不要有冒号或其他符号。`,
      system: systemMessage
    };
    
    // 通过 Electron API 发送请求
    const response = await window.electronAPI.sendAIRequest(requestData);
    
    if (response && response.trim()) {
      // 清理响应内容，只保留标题
      let title = response.replace(/^[\s\n\r]+|[\s\n\r]+$/g, '').substring(0, 20); // 去除首尾空白并限制长度
      
      // 如果标题包含冒号或其他分隔符，只取有意义的部分
      if (title.includes(':')) {
        const parts = title.split(':');
        // 选择最长或最合适的部分
        title = parts[parts.length - 1].trim();
      } else if (title.includes('：')) {
        const parts = title.split('：');
        title = parts[parts.length - 1].trim();
      }
      
      // 再次清理并确保标题有意义
      title = title.replace(/^[\s\n\r]+|[\s\n\r]+$/g, '').substring(0, 20);
      
      // 确保标题不是空的
      if (title && title.length > 0 && title !== firstUserMessage.content) {
        // 更新对话标题
        conversation.title = title;
        
        // 保存更改
        await saveAllConversations();
        
        // 更新对话列表显示
        updateChatListDisplay();
        
        console.log('对话标题已生成:', title);
      }
    }
  } catch (error) {
    console.error('生成对话标题失败:', error);
  }
}

// 获取停止语音按钮元素
const stopVoiceButton = document.getElementById('stopVoiceButton');

// 停止语音按钮事件监听器
stopVoiceButton.addEventListener('click', () => {
  stopAIVoice();
  stopVoiceButton.style.display = 'none';
});



// 初始化设置
loadSettings();

// 新对话功能
function startNewChat() {
  // 清空对话历史
  conversationHistory = [];
  
  // 清空聊天历史显示区域
  chatHistory.innerHTML = '';
  
  // 保存清空的对话历史到本地
  window.electronAPI.saveConversationHistory(conversationHistory)
    .catch(error => console.error('保存清空的对话历史失败:', error));
  
  console.log('已开始新对话');
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 获取当前对话
function getCurrentConversation() {
  if (!currentConversationId) {
    return null;
  }
  return allConversations.find(conv => conv.id === currentConversationId);
}

// 获取当前对话的历史记录
function getConversationHistory() {
  const currentConv = getCurrentConversation();
  return currentConv ? currentConv.history : [];
}

// 设置当前对话的历史记录
function setConversationHistory(history) {
  const currentConv = getCurrentConversation();
  if (currentConv) {
    currentConv.history = history;
  }
}

// 保存所有对话到本地存储
async function saveAllConversations() {
  try {
    await window.electronAPI.saveAllConversations(allConversations);
  } catch (error) {
    console.error('保存所有对话失败:', error);
  }
}

// 创建新对话
function createNewConversation() {
  const newId = generateId();
  const newConversation = {
    id: newId,
    title: `对话 ${allConversations.length + 1}`,
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  allConversations.push(newConversation);
  return newId;
}

// 切换到指定对话
function switchToConversation(conversationId) {
  const conversation = allConversations.find(conv => conv.id === conversationId);
  if (conversation) {
    // 保存当前对话（如果存在）
    if (currentConversationId) {
      const currentConv = getCurrentConversation();
      if (currentConv) {
        currentConv.updatedAt = new Date().toISOString();
      }
    }
    
    currentConversationId = conversationId;
    
    // 清空当前聊天显示
    chatHistory.innerHTML = '';
    
    // 重新加载当前对话的历史
    const history = getConversationHistory();
    history.forEach(item => {
      addMessageToHistory(item.content, item.role === 'user');
    });
    
    // 更新对话列表显示
    updateChatListDisplay();
    
    console.log('已切换到对话:', conversationId);
  }
}

// 更新对话列表显示
function updateChatListDisplay() {
  const chatList = document.getElementById('chatList');
  if (!chatList) return;
  
  chatList.innerHTML = '';
  
  allConversations.forEach(conversation => {
    const chatItem = document.createElement('div');
    chatItem.className = `chat-item ${conversation.id === currentConversationId ? 'active' : ''}`;
    chatItem.dataset.id = conversation.id;
    
    // 使用对话的实际标题，如果为空则使用第一个用户消息
    let title = conversation.title;
    if (!title || title.startsWith('对话 ')) {
      // 如果标题还是默认值，则尝试使用第一个用户消息作为临时标题
      const firstMessage = conversation.history.find(item => item.role === 'user');
      if (firstMessage) {
        title = firstMessage.content.substring(0, 30) + (firstMessage.content.length > 30 ? '...' : '');
      }
    }
    
    // 获取最后一条消息作为预览
    const lastMessage = conversation.history.length > 0 ? conversation.history[conversation.history.length - 1] : null;
    const preview = lastMessage ? lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '') : '暂无消息';
    
    chatItem.innerHTML = `
      <div class="chat-item-content">
        <div class="chat-item-title">${title}</div>
        <div class="chat-item-preview">${preview}</div>
      </div>
      <div class="chat-item-actions">
        <button class="chat-item-action-btn rename-btn" title="重命名">✏️</button>
        <button class="chat-item-action-btn delete-btn" title="删除">🗑️</button>
      </div>
    `;
    
    // 使用事件委托处理所有点击事件
    chatItem.addEventListener('click', (e) => {
      // 检查是否点击了重命名按钮
      if (e.target.classList.contains('rename-btn')) {
        e.stopPropagation();
        renameConversation(conversation.id);
        return;
      }
      
      // 检查是否点击了删除按钮
      if (e.target.classList.contains('delete-btn')) {
        e.stopPropagation();
        deleteConversation(conversation.id);
        return;
      }
      
      // 如果不是操作按钮，则切换对话
      switchToConversation(conversation.id);
    });
    
    chatList.appendChild(chatItem);
  });
}

// 重命名对话
function renameConversation(conversationId) {
  const conversation = allConversations.find(conv => conv.id === conversationId);
  if (!conversation) return;
  
  const newTitle = prompt('请输入新的对话标题:', conversation.title);
  if (newTitle !== null && newTitle.trim() !== '') {
    conversation.title = newTitle.trim();
    
    // 保存更改
    saveAllConversations();
    
    // 更新对话列表显示
    updateChatListDisplay();
    
    console.log('对话已重命名:', conversationId);
  }
}

// 删除对话
function deleteConversation(conversationId) {
  if (confirm('确定要删除这个对话吗？此操作不可撤销。')) {
    // 查找对话索引
    const index = allConversations.findIndex(conv => conv.id === conversationId);
    if (index !== -1) {
      // 如果删除的是当前对话，则切换到其他对话
      if (currentConversationId === conversationId) {
        allConversations.splice(index, 1);
        
        if (allConversations.length > 0) {
          // 切换到第一个对话
          currentConversationId = allConversations[0].id;
          
          // 清空当前聊天显示
          chatHistory.innerHTML = '';
          
          // 重新加载当前对话的历史
          const history = getConversationHistory();
          history.forEach(item => {
            addMessageToHistory(item.content, item.role === 'user');
          });
        } else {
          // 如果没有其他对话了，创建新对话
          currentConversationId = null;
          chatHistory.innerHTML = '';
          addMessageToHistory('您好！我是小R AI助手，有什么可以帮助您的吗？', false);
        }
      } else {
        // 删除非当前对话
        allConversations.splice(index, 1);
      }
      
      // 保存更改
      saveAllConversations();
      
      // 更新对话列表显示
      updateChatListDisplay();
      
      console.log('对话已删除:', conversationId);
    }
  }
}

// 为新对话按钮添加点击事件监听器
newChatButton.addEventListener('click', startNewChat);

// 为语音输入按钮添加点击事件监听器
if (voiceInputButton) {
  voiceInputButton.addEventListener('click', toggleVoiceRecognition);
}

// 获取图片生成、OCR和翻译按钮元素
const imageGenButton = document.getElementById('imageGenButton');
const imageOcrButton = document.getElementById('imageOcrButton');
const translationButton = document.getElementById('translationButton');

// 图片生成功能
function handleImageGeneration() {
  // 切换到图片生成模式
  if (activeSkillMode === 'imageGen') {
    // 如果已经是图片生成模式，则退出
    activeSkillMode = null;
  } else {
    // 启用图片生成模式
    activeSkillMode = 'imageGen';
  }
  
  // 更新按钮状态
  updateSkillButtonStates();
}

// 图片OCR功能
function handleImageOCR() {
  // 切换到OCR模式
  if (activeSkillMode === 'imageOcr') {
    // 如果已经是OCR模式，则退出
    activeSkillMode = null;
  } else {
    // 启用OCR模式
    activeSkillMode = 'imageOcr';
  }
  
  // 更新按钮状态
  updateSkillButtonStates();
}

// 更新技能按钮状态
function updateSkillButtonStates() {
  if (imageGenButton) {
    if (activeSkillMode === 'imageGen') {
      imageGenButton.classList.add('active-skill');
    } else {
      imageGenButton.classList.remove('active-skill');
    }
  }
  
  if (imageOcrButton) {
    if (activeSkillMode === 'imageOcr') {
      imageOcrButton.classList.add('active-skill');
    } else {
      imageOcrButton.classList.remove('active-skill');
    }
  }
  
  if (translationButton) {
    if (activeSkillMode === 'translation') {
      translationButton.classList.add('active-skill');
    } else {
      translationButton.classList.remove('active-skill');
    }
  }
}

// 翻译功能
function handleTranslation() {
  // 切换到翻译模式
  if (activeSkillMode === 'translation') {
    // 如果已经是翻译模式，则退出
    activeSkillMode = null;
  } else {
    // 启用翻译模式
    activeSkillMode = 'translation';
  }
  
  // 更新按钮状态
  updateSkillButtonStates();
}

// 为图片生成按钮添加点击事件监听器
if (imageGenButton) {
  imageGenButton.addEventListener('click', handleImageGeneration);
}

// 为OCR按钮添加点击事件监听器
if (imageOcrButton) {
  imageOcrButton.addEventListener('click', handleImageOCR);
}

// 为翻译按钮添加点击事件监听器
if (translationButton) {
  translationButton.addEventListener('click', handleTranslation);
}

// 新对话功能
function startNewChat() {
  // 创建新对话
  const newId = createNewConversation();
  
  // 切换到新对话
  switchToConversation(newId);
  
  console.log('已开始新对话');
}












