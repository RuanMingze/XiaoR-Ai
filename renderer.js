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
const voiceTypeSelect = document.getElementById('voiceTypeSelect');
const voiceTypeSetting = document.getElementById('voiceTypeSetting');
const aiModelSelect = document.getElementById('aiModelSelect');
const saveSettingsButton = document.getElementById('saveSettings');
const closeSettingsButton = document.getElementById('closeSettings');
const clearDataButton = document.getElementById('clearDataButton');
const customModelSettings = document.getElementById('customModelSettings');
const customModelUrl = document.getElementById('customModelUrl');
const autoLaunchToggle = document.getElementById('autoLaunchToggle');
const floatingBallToggle = document.getElementById('floatingBallToggle');
const closeToExitToggle = document.getElementById('closeToExitToggle');
const shortcutKeyInput = document.getElementById('shortcutKeyInput');
const shortcutPrefix = document.getElementById('shortcutPrefix');
const setShortcutButton = document.getElementById('setShortcutButton');

// 获取新对话按钮元素
const newChatButton = document.getElementById('newChatButton');

// 获取语音输入按钮元素
const voiceInputButton = document.querySelector('.inline-voice-btn');

// 获取技能按钮和菜单元素
const skillButton = document.getElementById('skillButton');
const skillMenu = document.getElementById('skillMenu');

// 存储所有对话
let allConversations = [];

// 当前对话ID
let currentConversationId = null;

// 当前播放的音频对象
let currentAudio = null;

// 当前激活的技能模式
let activeSkillMode = null;

// 引入天气测试功能
// 检查weather-test.js是否已加载
if (typeof openWeatherTest === 'undefined') {
    console.log('天气测试功能未加载，需要确保weather-test.js已引入');
}

// 当前AI请求状态
let currentRequestAborted = false;

// 引入天气测试功能
// 检查weather-test.js是否已加载
if (typeof openWeatherTest === 'undefined') {
    console.log('天气测试功能未加载，需要确保weather-test.js已引入');
}

// 保存技能状态到本地存储
function saveSkillState() {
  try {
    localStorage.setItem('xiaor-skill-state', JSON.stringify({
      activeSkillMode: activeSkillMode
    }));
  } catch (error) {
    console.error('保存技能状态失败:', error);
  }
}

// 从本地存储加载技能状态
function loadSkillState() {
  try {
    const skillState = localStorage.getItem('xiaor-skill-state');
    if (skillState) {
      const parsedState = JSON.parse(skillState);
      activeSkillMode = parsedState.activeSkillMode || null;
      
      // 更新按钮状态以反映加载的状态
      updateSkillButtonStates();
    }
  } catch (error) {
    console.error('加载技能状态失败:', error);
    activeSkillMode = null;
  }
}

// 显示图片放大模态框
function showImageModal(imageSrc) {
  // 创建或获取模态框元素
  let modal = document.getElementById('imageModal');
  
  if (!modal) {
    // 创建模态框元素
    modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    // 创建图片元素
    const modalImg = document.createElement('img');
    modalImg.id = 'modalImage';
    modalImg.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border-radius: 4px;
      cursor: zoom-in;
      transition: transform 0.3s ease;
    `;
    
    // 点击图片进行放大/缩小
    modalImg.addEventListener('click', function(e) {
      e.stopPropagation(); // 阻止事件冒泡到模态框
      
      // 检查当前是否已经放大
      const isCurrentlyZoomed = this.style.transform === 'scale(1.5)';
      
      if (isCurrentlyZoomed) {
        // 如果当前是放大状态，缩小回原尺寸
        this.style.transform = 'scale(1)';
        this.style.cursor = 'zoom-in';
      } else {
        // 如果当前是正常状态，放大图片
        this.style.transform = 'scale(1.5)';
        this.style.cursor = 'zoom-out';
      }
    });
    
    modal.appendChild(modalImg);
    document.body.appendChild(modal);
    
    // 点击模态框的背景区域关闭
    modal.addEventListener('click', function() {
      // 重置图片状态
      modalImg.style.transform = 'scale(1)';
      modalImg.style.cursor = 'zoom-in';
      this.style.display = 'none';
    });
  }
  
  // 设置图片源并显示模态框
  const modalImg = document.getElementById('modalImage');
  modalImg.src = imageSrc;
  // 重置图片状态
  modalImg.style.transform = 'scale(1)';
  modalImg.style.cursor = 'zoom-in';
  modal.style.display = 'flex';
}

// 修改parseMarkdown函数，增强代码块处理
function parseMarkdown(text) {
  // 处理多行代码块（包含语言标识）
  text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
    if (lang) {
      return `<pre class="code-block"><code class="language-${lang}">${code}</code></pre>`;
    } else {
      return `<pre class="code-block"><code>${code}</code></pre>`;
    }
  });
  
  // 处理行内代码
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 处理粗体
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // 处理斜体
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 处理链接
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  // 自动识别并转换纯文本链接 (http, https, file)
  text = text.replace(/\b(https?:\/\/|file:\/\/)[\w\-\.~:/?#\[\]@!\$&'\(\)\*\+,;=%]+/gi, '<a href="$&" target="_blank">$&</a>');
  
  // 处理XiaoR://Showimage，将其转换为显示本地图片
  console.log('处理XiaoR://Showimage前:', text);
  text = text.replace(/XiaoR:\/\/Showimage/g, '<img src="RuanmAi.png" alt="小R形象图片" style="max-width: 200px; max-height: 200px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">');
  console.log('处理XiaoR://Showimage后:', text);
  
  // 处理XiaoR://ShowCode协议，将其转换为可复制代码框
  text = text.replace(/XiaoR:\/\/ShowCode\?Type=([\w\-\+]+)&Code=([\s\S]*?)(?=XiaoR:\/\/CodeEnd|(?=\n\n|\n$|$))/g, function(match, lang, code) {
    // 解码URL编码的代码内容
    code = decodeURIComponent(code);
    
    // 创建代码块HTML
    return `<pre class="code-block"><code class="language-${lang}">${code}</code></pre>`;
  });
  
  // 移除XiaoR://CodeEnd标记
  text = text.replace(/XiaoR:\/\/CodeEnd/g, '');
  
  // 处理无序列表
  text = text.replace(/^\s*\-\s+(.*)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  
  // 处理有序列表
  text = text.replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>');
  
  // 处理标题
  text = text.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
  text = text.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
  text = text.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
  text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // 处理段落
  text = text.replace(/^\s*(.+?)\s*$/gm, '<p>$1</p>');
  
  return text;
}

// 为代码块添加复制按钮
function addCopyButtonToCodeBlock(codeElement) {
  // 创建一个容器来包装代码块和复制按钮
  const container = document.createElement('div');
  container.style.cssText = `
    position: relative;
    margin: 10px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  `;
  
  // 克隆代码元素
  const clonedCode = codeElement.cloneNode(true);
  
  // 创建复制按钮
  const copyButton = document.createElement('button');
  copyButton.textContent = '复制';
  copyButton.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    padding: 3px 8px;
    background: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    z-index: 10;
  `;
  
  // 添加复制功能
  copyButton.addEventListener('click', function() {
    const codeText = clonedCode.textContent || clonedCode.innerText;
    navigator.clipboard.writeText(codeText).then(function() {
      // 临时更改按钮文本以提供反馈
      const originalText = copyButton.textContent;
      copyButton.textContent = '已复制';
      setTimeout(() => {
        copyButton.textContent = originalText;
      }, 2000);
    }).catch(function(err) {
      console.error('复制失败: ', err);
    });
  });
  
  // 将代码元素和复制按钮添加到容器中
  container.appendChild(clonedCode);
  container.appendChild(copyButton);
  
  // 替换原始代码元素
  if (codeElement.parentNode) {
    codeElement.parentNode.replaceChild(container, codeElement);
  }
}

// 发送消息到聊天历史记录
function addMessageToHistory(message, isUser = false, messageId = null) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');
  messageDiv.classList.add(isUser ? 'user' : 'ai');
  
  // 如果提供了messageId，则设置为该元素的ID
  if (messageId) {
    messageDiv.id = messageId;
  }
  
  // 如果是AI消息，解析Markdown
  if (!isUser) {
    console.log('处理AI消息前:', message);
    // 检查消息是否包含HTML标记或XiaoR协议，如果是，则直接使用innerHTML
    // 这是为了处理图片生成结果、XiaoR://Showimage等包含HTML内容的消息
    if (message.includes('<img') || message.includes('<br>') || message.includes('<small>') || message.includes('href=') || message.includes('XiaoR://')) {
      console.log('消息包含HTML或XiaoR协议，直接使用innerHTML:', message);
      messageDiv.innerHTML = message;
    } else {
      console.log('消息不包含HTML或XiaoR协议，使用parseMarkdown:', message);
      messageDiv.innerHTML = parseMarkdown(message);
    }
    console.log('消息处理完成，innerHTML:', messageDiv.innerHTML);
  } else {
    messageDiv.textContent = message;
  }
  
  chatHistory.appendChild(messageDiv);
  
  // 滚动到底部
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// 添加消息到历史记录（支持动画输出）
function addMessageToHistory(message, isUser = false, messageId = null, animate = false) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');
  messageDiv.classList.add(isUser ? 'user' : 'ai');
  
  // 如果提供了messageId，则设置为该元素的ID
  if (messageId) {
    messageDiv.id = messageId;
  }
  
  if (!isUser && animate) {
    console.log('处理AI消息前（动画模式）:', message);
    
    // 如果启用了动画输出，逐字显示
    messageDiv.textContent = '';
    chatHistory.appendChild(messageDiv);
    
    // 滚动到底部
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    // 逐字添加内容
    let i = 0;
    const timer = setInterval(() => {
      if (i < message.length) {
        messageDiv.textContent += message.charAt(i);
        i++;
        
        // 滚动到底部
        chatHistory.scrollTop = chatHistory.scrollHeight;
      } else {
        clearInterval(timer);
        
        // 动画完成后，检查消息是否包含HTML标记或XiaoR协议，然后应用Markdown解析
        if (message.includes('<img') || message.includes('<br>') || message.includes('<small>') || message.includes('href=') || message.includes('XiaoR://')) {
          console.log('动画完成后，消息包含HTML或XiaoR协议，使用parseMarkdown:', message);
          // 如果包含特殊标记，重新设置innerHTML以确保协议被正确解析
          messageDiv.innerHTML = parseMarkdown(message);
        }
        console.log('动画消息处理完成，innerHTML:', messageDiv.innerHTML);
      }
    }, 30); // 每30毫秒显示一个字符
  } else {
    // 如果是AI消息，解析Markdown
    if (!isUser) {
      // 检查消息是否包含HTML标记，如果是，则直接使用innerHTML
      // 这是为了处理图片生成结果等包含HTML内容的消息
      if (message.includes('<img') || message.includes('<br>') || message.includes('<small>') || message.includes('href=')) {
        messageDiv.innerHTML = message;
      } else {
        messageDiv.innerHTML = parseMarkdown(message);
      }
    } else {
      messageDiv.textContent = message;
    }
    chatHistory.appendChild(messageDiv);
    
    // 滚动到底部
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
}

// 更新现有消息内容
function updateMessageContent(messageId, newContent) {
  const messageElement = document.getElementById(messageId);
  if (messageElement) {
    // 更新内容
    // 检查新内容是否包含HTML标记，如果是，则直接使用innerHTML
    if (newContent.includes('<img') || newContent.includes('<br>') || newContent.includes('<small>') || newContent.includes('href=')) {
      messageElement.innerHTML = newContent;
    } else {
      messageElement.innerHTML = parseMarkdown(newContent);
    }
    
    // 滚动到底部
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
}

// 更新对话历史中的消息
function updateMessageInHistory(messageId, newContent) {
  // 更新当前对话历史中对应的消息
  const currentHistory = getConversationHistory();
  
  // 直接更新特定索引的消息，而不是通过内容匹配
  // 我们将消息ID与历史记录中的特定位置关联
  
  // 为了解决消息ID与历史记录条目的关联问题，我们需要一种更好的方法
  // 通过消息ID来查找和更新对应的历史记录
  
  // 在当前实现中，我们仍然需要通过内容匹配来定位动态消息
  // 但我们可以改进这个过程
  for (let i = currentHistory.length - 1; i >= 0; i--) {
    if (currentHistory[i].role === 'assistant' && 
        (currentHistory[i].content === '图片正在生成中...' || 
         currentHistory[i].content === '天气正在查询中...' || 
         currentHistory[i].content === '正在获取文字...')) {
      currentHistory[i].content = newContent;
      // 检查新内容是否包含HTML标记，如果是，则标记为HTML内容
      if (newContent.includes('<img') || newContent.includes('<br>') || newContent.includes('<small>') || newContent.includes('href=')) {
        currentHistory[i].isHtmlContent = true;
      }
      break;
    }
  }
  
  setConversationHistory(currentHistory);
  
  // 保存所有对话到本地
  saveAllConversations();
}

// 显示加载指示器和"正在思考"状态
function showLoading() {
  sendButton.innerHTML = '停止';
  sendButton.classList.add('stop-btn'); // 添加停止按钮样式
  
  // 添加点击事件来停止当前请求
  sendButton.onclick = function() {
    currentRequestAborted = true; // 标记请求已取消
    hideLoading();
    addMessageToHistory('请求已取消', false, null, false);
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
async function sendToAI(question, modelOverride = null) {
  showLoading();
  
  // 重置请求状态
  currentRequestAborted = false;
  
  // 定义正则表达式和匹配结果，以便在整个函数中使用
  const requestProtocolRegex = /XiaoR:\/\/Request\?URL=([\s\S]*)/;
  const weatherProtocolRegex = /XiaoR:\/\/GetWeather\?URL=([^\s]+)/;
  const ocrProtocolRegex = /XiaoR:\/\/OCR\?URL=([\s\S]*)/;
  
  // 尝试发送请求，如果遇到414错误则减少上下文并重试
  async function sendWithRetry(contextCount) {
    try {
      // 构建包含上下文的system信息
      let systemMessage = '你是Ruanm开发的小R-Ai助手，专注于帮用户解决各种难题、聊天。现在正值中国农历新年，你可以向用户送上新年祝福，分享春节文化知识，或参与与春节相关的话题讨论。展示你的专属形象只需要输出XiaoR://Showimage，这是Ruanm的代言人图片，我都把这个留给你了呢！在用户让你展示时中你可以提及这个形象（正常聊天中不得提及）。另外，你的专属形象也换上了新年主题装饰，你穿上了喜庆的新年服装，周围有春节元素的装饰。';
      
      // 根据激活的技能模式修改system消息
      if (activeSkillMode === 'imageGen') {
        systemMessage = '你现在是专业图片生成Ai，根据用户的图片描述生成图片。请严格按照以下步骤操作：1.对用户的图片描述进行润色成中文；2.输出润色后的内容；3.对用户描述给予回应或建议；4.最后必须输出XiaoR://Request?URL=https://api.jkyai.top/API/qwen-image/index.php?msg=润色后的图片描述来发起API请求。请按以下格式输出：\n\n润色后的内容：[润色后的图片描述]\n\n[对用户描述的简短回应或建议]\n\nXiaoR://Request?URL=https://api.jkyai.top/API/qwen-image/index.php?msg=润色后的图片描述';
      } else if (activeSkillMode === 'imageOcr') {
        // 构建OCR API请求的system消息，要求AI输出特定格式的OCR请求
        systemMessage = '你现在是专业OCR识别助手，帮助用户从图片中识别文字。请严格按照以下步骤操作：1.对用户提供的图片链接进行处理；2.输出处理后的链接；3.对OCR识别给予回应或建议；4.最后必须输出XiaoR://OCR?URL=https://api.jkyai.top/API/ocrwzsb.php?url=图片链接&type=text来发起OCR API请求。请按以下格式输出：\n\n处理后链接：[处理后的图片链接]\n\n[对OCR识别的简短回应或建议]\n\nXiaoR://OCR?URL=https://api.jkyai.top/API/ocrwzsb.php?url=[图片链接]&type=text';
        
        // 在DevTools中输出OCR请求日志
        console.log('OCR模式：准备发送OCR请求，问题:', question);
      } else if (activeSkillMode === 'translation') {
        // 翻译模式：要求AI进行翻译
        systemMessage = '你现在是一个专业的翻译助手，用户将提供需要翻译的文本。请直接输出翻译结果，不要添加任何解释或额外内容。如果用户没有明确指定目标语言，请询问用户需要翻译成哪种语言。';
        
        // 在DevTools中输出翻译请求日志
        console.log('翻译模式：准备发送翻译请求，问题:', question);
      } else if (activeSkillMode === 'codeAssistant') {
        // 编程助手模式：要求AI进行代码解释和生成
        systemMessage = '你现在是一个专业的编程助手，专门帮助用户解释和生成代码。请遵循以下规则：\n1. 如果用户请求解释代码，请详细解释代码的功能、逻辑和关键部分；\n2. 如果用户请求生成代码，请生成清晰、高效的代码，并提供必要的注释；\n3. 如果用户询问编程问题，请提供详细的解答和最佳实践建议；\n4. 输出代码时请使用XiaoR://ShowCode协议格式：XiaoR://ShowCode?Type=编程语言&Code=具体代码，代码结束后输出XiaoR://CodeEnd标记；\n5. 对于复杂问题，提供多个解决方案并解释其优缺点。';
        
        // 在DevTools中输出编程助手请求日志
        console.log('编程助手模式：准备发送编程助手请求，问题:', question);
      } else if (activeSkillMode === 'weather') {
        // 天气查询模式：要求AI输出特定格式的天气查询请求
        systemMessage = '你现在是专业天气查询AI助手，根据用户提供的地名查询天气信息。请严格按照以下步骤操作：1.对用户提供的地名进行处理（中国地名转换为拼音）；2.输出处理后的地名；3.对天气查询给予回应或建议；4.最后必须输出XiaoR://GetWeather?URL=http://api.openweathermap.org/data/2.5/weather?q=地名&appid=YOUR_API_KEY来发起天气API请求，其中YOUR_API_KEY需要用户自行替换。请按以下格式输出：\n\n处理后地名：[处理后的地名]\n\n[对天气查询的简短回应或建议]\n\nXiaoR://GetWeather?URL=http://api.openweathermap.org/data/2.5/weather?q=[地名]&appid=YOUR_API_KEY';
        
        // 在DevTools中输出天气查询请求日志
        console.log('天气查询模式：准备发送天气查询请求，问题:', question);
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
      let settings = null; // 定义settings变量
      
      if (savedSettings) {
        settings = JSON.parse(savedSettings);
        aiModel = settings.aiModel || 'deepseek';
      }
      
      // 如果提供了模型覆盖参数，则使用它
      if (modelOverride) {
        aiModel = modelOverride;
      }
      
      // 根据AI模型选择API端点
      let apiEndpoint = 'https://api.jkyai.top/API/depsek3.2.php'; // 默认为Deepseek
      if (aiModel === 'claude') {
        apiEndpoint = 'https://api.jkyai.top/API/doubao.php'; // 豆包
      } else if (aiModel === 'yuanbao') {
        apiEndpoint = 'https://api.jkyai.top/API/yuanbao.php'; // 腾讯元宝
      } else if (aiModel === 'qwen3') {
        apiEndpoint = 'https://api.jkyai.top/API/qwen3.php'; // Qwen3
      } else if (aiModel === 'ling') {
        apiEndpoint = 'https://api.jkyai.top/API/ling-1t.php'; // 蚂蚁Ling2.0
      } else if (aiModel === 'gemini') {
        apiEndpoint = 'https://api.jkyai.top/API/gemini2.5/index.php'; // Gemini-2.5
      } else if (aiModel === 'glm') {
        // GLM模型: 使用提供的API端点，将问题和系统提示词按特定格式拼接在msg参数中，并添加type=text参数
        apiEndpoint = `https://api.52vmy.cn/api/chat/glm?msg=${encodeURIComponent(question + '。提示词是：' + systemMessage)}&type=text`;
      } else if (aiModel === 'ollama') {
        // Ollama模型：直接处理请求并返回结果
        const ollamaServerUrl = settings.ollamaServerUrl || 'http://localhost:11434';
        const ollamaModel = settings.ollamaModel || 'llama2'; // 默认模型
        
        // 构建Ollama请求数据
        const ollamaData = {
          model: ollamaModel,
          prompt: question,
          system: systemMessage,
          stream: false // 非流式响应
        };
        
        // 发送请求到Ollama API
        try {
          const ollamaResponse = await fetch(`${ollamaServerUrl}/api/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(ollamaData)
          });
          
          if (!ollamaResponse.ok) {
            throw new Error(`Ollama API请求失败: ${ollamaResponse.status} ${ollamaResponse.statusText}`);
          }
          
          const ollamaResult = await ollamaResponse.json();
          return ollamaResult.response || 'Ollama未返回有效响应';
        } catch (ollamaError) {
          console.error('Ollama请求失败:', ollamaError);
          throw new Error(`Ollama请求失败: ${ollamaError.message}`);
        }
      } else if (aiModel === 'custom') {
        // 自定义模型：从设置中获取API URL并替换占位符
        if (settings && settings.customModelUrl) {
          const customUrl = settings.customModelUrl || '';
          if (customUrl) {
            // 替换占位符
            apiEndpoint = customUrl.replace('%提问内容%', encodeURIComponent(question)).replace('%联想词%', encodeURIComponent(systemMessage));
          } else {
            throw new Error('自定义模型URL未设置');
          }
        } else {
          throw new Error('自定义模型URL未设置');
        }
      }
      
      // 通过 Electron API 发送请求（非Ollama模型）
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
  
  // 将lastError变量提升到函数作用域顶部
  let lastError;
  
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
        addMessageToHistory(`错误: ${response.error}`, false, null, false);
      } else if (response.type === 'ollama_request') {
        // 处理Ollama请求
        const savedSettings = localStorage.getItem('xiaor-settings');
        let settings = {};
        if (savedSettings) {
          settings = JSON.parse(savedSettings);
        }
        
        const ollamaServerUrl = settings.ollamaServerUrl || 'http://localhost:11434';
        const ollamaModel = settings.ollamaModel || 'llama2'; // 默认模型
        
        // 检查是否启用动画输出
        const animationEnabled = settings.animationOutput || false;
        
        // 构建Ollama请求数据
        const ollamaData = {
          model: ollamaModel,
          prompt: response.question,
          system: response.system,
          stream: animationEnabled // 如果启用动画输出，则使用流式响应
        };
        
        // 发送请求到Ollama API
        try {
          if (animationEnabled) {
            // 使用流式响应以支持动画输出
            fetch(`${ollamaServerUrl}/api/generate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({...ollamaData, stream: true})
            })
            .then(ollamaResponse => {
              if (!ollamaResponse.ok) {
                throw new Error(`Ollama API请求失败: ${ollamaResponse.status} ${ollamaResponse.statusText}`);
              }
              
              // 读取流式响应
              const reader = ollamaResponse.body.getReader();
              const decoder = new TextDecoder();
              let fullResponse = '';
              
              // 创建消息元素用于动画显示
              const messageDiv = document.createElement('div');
              messageDiv.classList.add('message', 'ai');
              const messageId = 'ollama-response-' + Date.now();
              messageDiv.id = messageId;
              chatHistory.appendChild(messageDiv);
              
              // 滚动到底部
              chatHistory.scrollTop = chatHistory.scrollHeight;
              
              function readStream() {
                reader.read().then(({ done, value }) => {
                  if (done) {
                    reader.releaseLock();
                    
                    // 将最终响应添加到对话历史
                    const currentHistory = getConversationHistory();
                    currentHistory.push({ role: 'assistant', content: fullResponse });
                    setConversationHistory(currentHistory);
                    
                    // 保存所有对话到本地
                    saveAllConversations();
                    
                    // 将当前对话移到列表顶部
                    moveConversationToTop(currentConversationId);
                    
                    return;
                  }
                  
                  const chunk = decoder.decode(value, { stream: true });
                  const lines = chunk.split('\n');
                  
                  for (const line of lines) {
                    if (line.trim() === '') continue;
                    
                    try {
                      const json = JSON.parse(line);
                      if (json.response) {
                        fullResponse += json.response;
                        
                        // 逐字更新消息显示
                        messageDiv.innerHTML = parseMarkdown(fullResponse);
                        
                        // 滚动到底部
                        chatHistory.scrollTop = chatHistory.scrollHeight;
                      }
                      
                      if (json.done) {
                        reader.releaseLock();
                        
                        // 将最终响应添加到对话历史
                        const currentHistory = getConversationHistory();
                        currentHistory.push({ role: 'assistant', content: fullResponse });
                        setConversationHistory(currentHistory);
                        
                        // 保存所有对话到本地
                        saveAllConversations();
                        
                        // 将当前对话移到列表顶部
                        moveConversationToTop(currentConversationId);
                        
                        return;
                      }
                    } catch (e) {
                      // 忽略非JSON行
                      continue;
                    }
                  }
                  
                  readStream(); // 继续读取下一块数据
                }).catch(error => {
                  console.error('读取Ollama流式响应时出错:', error);
                  
                  // 显示错误消息
                  const errorMessage = `Ollama响应读取失败: ${error.message}`;
                  messageDiv.textContent = errorMessage;
                  
                  // 添加到对话历史
                  const currentHistory = getConversationHistory();
                  currentHistory.push({ role: 'assistant', content: errorMessage });
                  setConversationHistory(currentHistory);
                  
                  // 保存所有对话到本地
                  saveAllConversations();
                  
                  // 将当前对话移到列表顶部
                  moveConversationToTop(currentConversationId);
                });
              }
              
              readStream(); // 开始读取流
            })
            .catch(error => {
              console.error('Ollama请求失败:', error);
              
              // 显示错误消息
              addMessageToHistory(`Ollama请求失败: ${error.message}`, false, null, false);
              
              // 将错误添加到对话历史
              const currentHistory = getConversationHistory();
              currentHistory.push({ role: 'assistant', content: `Ollama请求失败: ${error.message}` });
              setConversationHistory(currentHistory);
              
              // 保存所有对话到本地
              saveAllConversations();
              
              // 将当前对话移到列表顶部
              moveConversationToTop(currentConversationId);
            });
          } else {
            // 使用非流式响应
            fetch(`${ollamaServerUrl}/api/generate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({...ollamaData, stream: false})
            })
            .then(ollamaResponse => {
              if (!ollamaResponse.ok) {
                throw new Error(`Ollama API请求失败: ${ollamaResponse.status} ${ollamaResponse.statusText}`);
              }
              return ollamaResponse.json();
            })
            .then(ollamaResult => {
              // 正常处理AI响应
              const aiResponse = ollamaResult.response || 'Ollama未返回有效响应';
              
              // 检查是否启用动画输出
              const savedSettings = localStorage.getItem('xiaor-settings');
              let animationEnabled = false;
              if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                animationEnabled = settings.animationOutput || false;
              }
              
              // 正常处理AI响应
              addMessageToHistory(aiResponse, false, null, animationEnabled);
              
              // 播放AI语音回复
              playAIVoice(aiResponse);
              
              // 更新当前对话的历史
              const currentHistory = getConversationHistory();
              currentHistory.push({ role: 'user', content: question });
              currentHistory.push({ role: 'assistant', content: aiResponse });
              setConversationHistory(currentHistory);
              
              // 保存所有对话到本地
              saveAllConversations();
              
              // 将当前对话移到列表顶部
              moveConversationToTop(currentConversationId);
            })
            .catch(error => {
              console.error('Ollama请求失败:', error);
              
              // 显示错误消息
              addMessageToHistory(`Ollama请求失败: ${error.message}`, false, null, false);
              
              // 将错误添加到对话历史
              const currentHistory = getConversationHistory();
              currentHistory.push({ role: 'assistant', content: `Ollama请求失败: ${error.message}` });
              setConversationHistory(currentHistory);
              
              // 保存所有对话到本地
              saveAllConversations();
              
              // 将当前对话移到列表顶部
              moveConversationToTop(currentConversationId);
            });
          }
        } catch (ollamaError) {
          console.error('Ollama请求失败:', ollamaError);
          
          // 显示错误消息
          addMessageToHistory(`Ollama请求失败: ${ollamaError.message}`, false, null, false);
          
          // 将错误添加到对话历史
          const currentHistory = getConversationHistory();
          currentHistory.push({ role: 'assistant', content: `Ollama请求失败: ${ollamaError.message}` });
          setConversationHistory(currentHistory);
          
          // 保存所有对话到本地
          saveAllConversations();
          
          // 将当前对话移到列表顶部
          moveConversationToTop(currentConversationId);
        }
        
        // 返回，避免继续处理
        return;
      } else {
        // 成功获取 AI 回复
        const aiResponse = response;
        
        // 检查AI响应是否包含各种协议
        const requestMatch = aiResponse.match(requestProtocolRegex);
        const weatherMatch = aiResponse.match(weatherProtocolRegex);
        const ocrMatch = aiResponse.match(ocrProtocolRegex);
        
        if (requestMatch) {
          // 提取请求URL
          const requestUrl = requestMatch[1].trim();
          
          // 显示AI的原始响应，但隐藏XiaoR://Request?URL=部分
          const aiResponseWithoutProtocol = aiResponse.replace(requestProtocolRegex, '').trim();
          addMessageToHistory(aiResponseWithoutProtocol, false, null, false);
          
          // 创建一个唯一的ID用于标识正在生成的消息
          const messageId = 'api-request-' + Date.now();
          
          // 在AI输出下方显示"图片正在生成中..."
          const loadingMessage = '图片正在生成中...';
          addMessageToHistory(loadingMessage, false, messageId, false);
          
          // 同时将此消息添加到对话历史中
          const currentHistory = getConversationHistory();
          currentHistory.push({ role: 'assistant', content: loadingMessage });
          setConversationHistory(currentHistory);
          
          // 发起API请求
          try {
            fetch(requestUrl)
              .then(apiResponse => apiResponse.text())
              .then(apiResult => {
                // 检查API结果是否为图片链接
                const isImageUrl = apiResult.trim().endsWith('.jpg') || apiResult.trim().endsWith('.jpeg') || apiResult.trim().endsWith('.png') || apiResult.trim().endsWith('.gif') || apiResult.trim().endsWith('.webp');
                
                if (isImageUrl) {
                  // 如果是图片链接，直接显示图片和链接
                  const imgHtml = `<img src="${apiResult}" alt="生成的图片" style="max-width: 100%; height: auto; border-radius: 8px; margin-top: 10px; cursor: pointer;" onclick="showImageModal('${apiResult}')" onload="console.log('图片加载成功:', this.src);" onerror="console.error('图片加载失败:', this.src);">`;
                  
                  // 创建一个段落来包含文本、图片和链接
                  const resultElement = document.createElement('div');
                  resultElement.innerHTML = `图片生成成功！<br>${imgHtml}<br><small>图片链接：<a href="${apiResult}" target="_blank">${apiResult}</a></small>`;
                  
                  // 直接更新元素内容，绕过parseMarkdown
                  const messageElement = document.getElementById(messageId);
                  if (messageElement) {
                    messageElement.innerHTML = '';
                    messageElement.appendChild(resultElement);
                  }
                  
                  // 更新对话历史中的这条消息
                  updateMessageInHistory(messageId, `图片生成成功！<br>${imgHtml}<br><small>图片链接：<a href="${apiResult}" target="_blank">${apiResult}</a></small>`);
                  
                  // 播放语音
                  playAIVoice('图片生成成功！');
                } else {
                  // 如果不是图片链接，按原格式显示
                  const formattedResult = `图片生成成功！图片链接：${apiResult}`;
                  
                  // 更新消息内容为格式化后的结果
                  updateMessageContent(messageId, formattedResult);
                  
                  // 更新对话历史中的这条消息
                  updateMessageInHistory(messageId, formattedResult);
                  
                  // 播放API结果的语音
                  playAIVoice(formattedResult);
                }
              })
              .catch(error => {
                console.error('API请求失败:', error);
                const errorMessage = `API请求失败: ${error.message}`;
                updateMessageContent(messageId, errorMessage);
                
                // 更新对话历史中的这条消息
                updateMessageInHistory(messageId, errorMessage);
              });
          } catch (error) {
            console.error('处理API请求时出错:', error);
            const errorMessage = `处理API请求时出错: ${error.message}`;
            updateMessageContent(messageId, errorMessage);
            
            // 更新对话历史中的这条消息
            updateMessageInHistory(messageId, errorMessage);
          }
        } else {
          // 检查AI响应是否包含XiaoR://GetWeather协议
          const weatherMatch = aiResponse.match(weatherProtocolRegex);
          
          if (weatherMatch) {
            // 获取用户保存的API密钥（如果有的话）
            const savedSettings = localStorage.getItem('xiaor-settings');
            let userApiKey = '';
            if (savedSettings) {
              const settings = JSON.parse(savedSettings);
              userApiKey = settings.weatherApiKey || '';
            }
            
            // 提取天气请求URL
            let weatherUrl = weatherMatch[1].trim();
            
            // 如果URL包含默认密钥占位符且用户有自定义密钥，则替换它
            if (weatherUrl.includes('YOUR_API_KEY') && userApiKey) {
              weatherUrl = weatherUrl.replace('YOUR_API_KEY', userApiKey);
            }
            
            // 显示AI的原始响应，但隐藏XiaoR://GetWeather?URL=部分
            const aiResponseWithoutProtocol = aiResponse.replace(weatherProtocolRegex, '').trim();
            addMessageToHistory(aiResponseWithoutProtocol, false, null, false);
            
            // 创建一个唯一的ID用于标识正在查询的消息
            const messageId = 'weather-request-' + Date.now();
            
            // 在AI输出下方显示"天气正在查询中..."
            const loadingMessage = '天气正在查询中...';
            addMessageToHistory(loadingMessage, false, messageId, false);
            
            // 同时将此消息添加到对话历史中
            const currentHistory = getConversationHistory();
            currentHistory.push({ role: 'assistant', content: loadingMessage });
            setConversationHistory(currentHistory);
            
            // 检查URL中是否包含默认的API密钥占位符
            if (weatherUrl.includes('YOUR_API_KEY')) {
              const errorMessage = `请提供您自己的OpenWeatherMap API密钥。您可以在 https://openweathermap.org/api 注册获取免费的API密钥，然后在设置中配置。`;
              updateMessageContent(messageId, errorMessage);
              
              // 更新对话历史中的这条消息
              updateMessageInHistory(messageId, errorMessage);
              
              // 更新当前对话的历史
              const currentHistory = getConversationHistory();
              currentHistory.push({ role: 'user', content: question });
              
              // 保存AI响应但去除天气协议部分
              const aiResponseWithoutProtocol = aiResponse.replace(weatherProtocolRegex, '').trim();
              currentHistory.push({ role: 'assistant', content: aiResponseWithoutProtocol });
              
              setConversationHistory(currentHistory);
              
              // 保存所有对话到本地
              await saveAllConversations();
              
              // 将当前对话移到列表顶部
              moveConversationToTop(currentConversationId);
              
              // 如果这是对话中的第一次AI回复，尝试生成对话标题
              if (currentHistory.length === 2) { // 用户问题 + AI回复 = 2
                setTimeout(() => {
                  generateConversationTitle(currentConversationId);
                }, 1000); // 延迟1秒执行，避免影响主要对话流程
              }
              return; // 结束处理
            }
            
            // 发起天气API请求
            try {
              fetch(weatherUrl)
                .then(weatherResponse => weatherResponse.json())
                .then(weatherData => {
                  // 解析天气数据并格式化显示
                  if (weatherData && weatherData.main) {
                    const cityName = weatherData.name || '未知城市';
                    const country = weatherData.sys ? weatherData.sys.country : '';
                    const temperature = Math.round(weatherData.main.temp - 273.15); // 开尔文转摄氏度
                    const feelsLike = Math.round(weatherData.main.feels_like - 273.15);
                    const humidity = weatherData.main.humidity;
                    const description = weatherData.weather && weatherData.weather[0] ? weatherData.weather[0].description : '未知';
                    const windSpeed = weatherData.wind ? weatherData.wind.speed : '未知';
                    
                    // 格式化天气信息
                    const weatherInfo = `
🏙️ 城市: ${cityName}${country ? ` (${country})` : ''}
🌡️ 温度: ${temperature}°C (体感 ${feelsLike}°C)
☁️ 天气: ${description}
💧 湿度: ${humidity}%
💨 风速: ${windSpeed} m/s`;
                    
                    // 更新消息内容为天气信息
                    const formattedWeather = `🌤️ 天气查询成功！\n${weatherInfo}`;
                    updateMessageContent(messageId, formattedWeather);
                    
                    // 更新对话历史中的这条消息
                    updateMessageInHistory(messageId, formattedWeather);
                    
                    // 播放天气信息语音
                    playAIVoice(`当前${cityName}的天气是${description}，温度${temperature}摄氏度，湿度${humidity}%。`);
                  } else {
                    const errorMessage = `天气查询失败：未获取到有效数据`;
                    updateMessageContent(messageId, errorMessage);
                    
                    // 更新对话历史中的这条消息
                    updateMessageInHistory(messageId, errorMessage);
                  }
                })
                .catch(error => {
                  console.error('天气API请求失败:', error);
                  const errorMessage = `天气查询失败: ${error.message}`;
                  updateMessageContent(messageId, errorMessage);
                  
                  // 更新对话历史中的这条消息
                  updateMessageInHistory(messageId, errorMessage);
                });
            } catch (error) {
              console.error('处理天气API请求时出错:', error);
              const errorMessage = `处理天气查询请求时出错: ${error.message}`;
              updateMessageContent(messageId, errorMessage);
              
              // 更新对话历史中的这条消息
              updateMessageInHistory(messageId, errorMessage);
            }
          } else {
            // 检查AI响应是否包含XiaoR://OCR协议
            const ocrMatch = aiResponse.match(ocrProtocolRegex);
            
            if (ocrMatch) {
              // 提取OCR请求URL
              const ocrUrl = ocrMatch[1].trim();
              
              // 显示AI的原始响应，但隐藏XiaoR://OCR?URL=部分
              const aiResponseWithoutProtocol = aiResponse.replace(ocrProtocolRegex, '').trim();
              addMessageToHistory(aiResponseWithoutProtocol, false, null, false);
              
              // 创建一个唯一的ID用于标识正在识别的消息
              const messageId = 'ocr-request-' + Date.now();
              
              // 在AI输出下方显示"正在获取文字..."
              const loadingMessage = '正在获取文字...';
              addMessageToHistory(loadingMessage, false, messageId, false);
              
              // 同时将此消息添加到对话历史中
              const currentHistory = getConversationHistory();
              currentHistory.push({ role: 'assistant', content: loadingMessage });
              setConversationHistory(currentHistory);
              
              // 发起OCR API请求
              try {
                fetch(ocrUrl)
                  .then(ocrResponse => ocrResponse.text())
                  .then(ocrResult => {
                    // 更新消息内容为OCR结果
                    const formattedResult = `OCR识别成功！\n\n${ocrResult}`;
                    updateMessageContent(messageId, formattedResult);
                    
                    // 更新对话历史中的这条消息
                    updateMessageInHistory(messageId, formattedResult);
                    
                    // 播放OCR结果的语音
                    playAIVoice(`OCR识别成功，识别到的文字是：${ocrResult}`);
                  })
                  .catch(error => {
                    console.error('OCR API请求失败:', error);
                    const errorMessage = `OCR识别失败: ${error.message}`;
                    updateMessageContent(messageId, errorMessage);
                    
                    // 更新对话历史中的这条消息
                    updateMessageInHistory(messageId, errorMessage);
                  });
              } catch (error) {
                console.error('处理OCR API请求时出错:', error);
                const errorMessage = `处理OCR请求时出错: ${error.message}`;
                updateMessageContent(messageId, errorMessage);
                
                // 更新对话历史中的这条消息
                updateMessageInHistory(messageId, errorMessage);
              }
            } else {
              // 检查是否启用动画输出
              const savedSettings = localStorage.getItem('xiaor-settings');
              let animationEnabled = false;
              if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                animationEnabled = settings.animationOutput || false;
              }
              
              // 正常处理AI响应
              addMessageToHistory(aiResponse, false, null, animationEnabled);
              
              // 播放AI语音回复
              playAIVoice(aiResponse);
            }
          }
        }
        
        // 更新当前对话的历史
        const currentHistory = getConversationHistory();
        currentHistory.push({ role: 'user', content: question });
        
        // 对于图片生成、天气查询和OCR请求，保存处理后的AI响应（去除协议部分）
        if (requestMatch) {
          // 保存AI响应但去除协议部分
          const aiResponseWithoutProtocol = aiResponse.replace(requestProtocolRegex, '').trim();
          currentHistory.push({ role: 'assistant', content: aiResponseWithoutProtocol });
          // 注意："图片正在生成中..."消息已经在此前添加
        } else if (weatherMatch) {
          // 保存AI响应但去除天气协议部分
          const aiResponseWithoutProtocol = aiResponse.replace(weatherProtocolRegex, '').trim();
          currentHistory.push({ role: 'assistant', content: aiResponseWithoutProtocol });
          // 注意："天气正在查询中..."消息已经在此前添加
        } else if (ocrMatch) {
          // 保存AI响应但去除OCR协议部分
          const aiResponseWithoutProtocol = aiResponse.replace(ocrProtocolRegex, '').trim();
          currentHistory.push({ role: 'assistant', content: aiResponseWithoutProtocol });
          // 注意："正在获取文字..."消息已经在此前添加
        } else {
          // 对于非特殊请求，保存完整的AI响应
          currentHistory.push({ role: 'assistant', content: aiResponse });
        }
        setConversationHistory(currentHistory);
        
        // 保存所有对话到本地
        await saveAllConversations();
        
        // 将当前对话移到列表顶部
        moveConversationToTop(currentConversationId);
        
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
      addMessageToHistory('错误: 请求过长，已自动减少对话历史但仍然失败，请尝试重新开始对话', false, null, false);
    } else {
      addMessageToHistory(`请求失败: ${error.message}`, false, null, false);
    }
    
    // 即使出现错误，也将当前对话移到列表顶部
    if (currentConversationId) {
      moveConversationToTop(currentConversationId);
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
    addMessageToHistory(message, true, null, false);
    
    // 更新当前对话的更新时间
    const currentConv = getCurrentConversation();
    if (currentConv) {
      currentConv.updatedAt = new Date().toISOString();
    }
    
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

// 语音输入按钮事件监听器
if (voiceInputButton) {
  voiceInputButton.addEventListener('click', () => {
    toggleVoiceRecognition();
  });
}

// 技能按钮事件监听器
if (skillButton) {
  skillButton.addEventListener('click', (event) => {
    event.stopPropagation(); // 阻止事件冒泡
    // 切换技能菜单显示状态
    if (skillMenu.style.display === 'none' || !skillMenu.style.display) {
      skillMenu.style.display = 'flex';
      // 添加点击外部区域隐藏菜单的事件
      document.addEventListener('click', hideSkillMenu);
    } else {
      skillMenu.style.display = 'none';
      // 移除点击外部区域隐藏菜单的事件
      document.removeEventListener('click', hideSkillMenu);
    }
  });
}

// 隐藏技能菜单的函数
function hideSkillMenu(event) {
  if (!skillMenu.contains(event.target) && event.target !== skillButton) {
    skillMenu.style.display = 'none';
    document.removeEventListener('click', hideSkillMenu);
  }
}

// 为技能菜单按钮添加点击事件
// 使用正确的ID来获取技能菜单中的按钮
const imageGenMenuButton = document.getElementById('imageGenMenuButton');
const imageOcrMenuButton = document.getElementById('imageOcrMenuButton');
const translationMenuButton = document.getElementById('translationMenuButton');
const codeAssistantMenuButton = document.getElementById('codeAssistantMenuButton');
const weatherMenuButton = document.getElementById('weatherMenuButton');

if (imageGenMenuButton && imageGenMenuButton.closest('#skillMenu')) {
  imageGenMenuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    // 切换到图片生成模式或取消
    if (activeSkillMode === 'imageGen') {
      activeSkillMode = null;
      showNotification('已取消图片生成模式');
    } else {
      activeSkillMode = 'imageGen';
      showNotification('已切换到图片生成模式');
    }
    skillMenu.style.display = 'none';
    document.removeEventListener('click', hideSkillMenu);
    // 更新按钮状态
    updateSkillButtonStates();
    
    // 保存技能状态
    saveSkillState();
  });
}

if (imageOcrMenuButton && imageOcrMenuButton.closest('#skillMenu')) {
  imageOcrMenuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    // 切换到OCR识别模式或取消
    if (activeSkillMode === 'imageOcr') {
      activeSkillMode = null;
      showNotification('已取消OCR识别模式');
    } else {
      activeSkillMode = 'imageOcr';
      showNotification('已切换到OCR识别模式');
    }
    skillMenu.style.display = 'none';
    document.removeEventListener('click', hideSkillMenu);
    // 更新按钮状态
    updateSkillButtonStates();
    
    // 保存技能状态
    saveSkillState();
  });
}

if (translationMenuButton && translationMenuButton.closest('#skillMenu')) {
  translationMenuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    // 切换到翻译模式或取消
    if (activeSkillMode === 'translation') {
      activeSkillMode = null;
      showNotification('已取消翻译模式');
    } else {
      activeSkillMode = 'translation';
      showNotification('已切换到翻译模式');
    }
    skillMenu.style.display = 'none';
    document.removeEventListener('click', hideSkillMenu);
    // 更新按钮状态
    updateSkillButtonStates();
    
    // 保存技能状态
    saveSkillState();
  });
}

if (codeAssistantMenuButton && codeAssistantMenuButton.closest('#skillMenu')) {
  codeAssistantMenuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    // 切换到编程助手模式或取消
    if (activeSkillMode === 'codeAssistant') {
      activeSkillMode = null;
      showNotification('已取消编程助手模式');
    } else {
      activeSkillMode = 'codeAssistant';
      showNotification('已切换到编程助手模式');
    }
    skillMenu.style.display = 'none';
    document.removeEventListener('click', hideSkillMenu);
    // 更新按钮状态
    updateSkillButtonStates();
    
    // 保存技能状态
    saveSkillState();
  });
}

if (weatherMenuButton && weatherMenuButton.closest('#skillMenu')) {
  weatherMenuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    // 切换到天气查询模式或取消
    if (activeSkillMode === 'weather') {
      activeSkillMode = null;
      showNotification('已取消天气查询模式');
    } else {
      activeSkillMode = 'weather';
      showNotification('已切换到天气查询模式');
    }
    skillMenu.style.display = 'none';
    document.removeEventListener('click', hideSkillMenu);
    // 更新按钮状态
    updateSkillButtonStates();
    
    // 保存技能状态
    saveSkillState();
  });
}

// 显示通知的函数
function showNotification(message) {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = 'voice-input-alert';
  notification.textContent = message;
  
  // 添加样式
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = '#28a745';
  notification.style.color = 'white';
  notification.style.padding = '15px 20px';
  notification.style.borderRadius = '8px';
  notification.style.zIndex = '10000';
  notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  notification.style.maxWidth = '400px';
  notification.style.wordWrap = 'break-word';
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 3秒后自动移除
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// 显示新年祝福
function showNewYearGreeting() {
  // 新年祝福消息
  const newYearMessage = '🎉 新年快乐！祝您在新的一年里万事如意，AI助手将一如既往地为您服务！';
  
  // 添加到聊天历史
  addMessageToHistory(newYearMessage, false, null, false);
}

// 检查是否应该显示新年祝福
function shouldShowNewYearGreeting() {
  // 对于新年版本，总是显示祝福
  return true;
}

// 获取雪花特效设置
function getSnowSetting() {
  // 从本地存储获取设置，如果不存在则默认为true（启用）
  const settings = localStorage.getItem('xiaor-settings');
  if (settings) {
    const parsedSettings = JSON.parse(settings);
    return parsedSettings.snowEnabled !== undefined ? parsedSettings.snowEnabled : true;
  }
  return true; // 默认启用
}

// 保存雪花特效设置
function saveSnowSetting(enabled) {
  // 获取现有设置
  let settings = {};
  const existingSettings = localStorage.getItem('xiaor-settings');
  if (existingSettings) {
    settings = JSON.parse(existingSettings);
  }
  
  // 更新雪花设置
  settings.snowEnabled = enabled;
  
  // 保存设置
  localStorage.setItem('xiaor-settings', JSON.stringify(settings));
}

// 添加新年特效
function addNewYearEffects() {
  // 检查是否启用雪花特效
  const snowEnabled = getSnowSetting();
  
  // 创建爆竹元素
  const firecrackerContainer = document.createElement('div');
  firecrackerContainer.id = 'firecracker-container';
  firecrackerContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    pointer-events: none;
    user-select: none;
  `;
  
  // 添加爆竹图标
  const firecracker = document.createElement('div');
  firecracker.innerHTML = '🧨';
  firecracker.style.cssText = `
    font-size: 30px;
    animation: firecracker-dance 2s ease-in-out infinite alternate;
    cursor: pointer;
    user-select: none;
  `;
  
  // 添加爆竹动画
  const firecrackerStyle = document.createElement('style');
  firecrackerStyle.textContent = `
    @keyframes firecracker-dance {
      0% { transform: translateY(0) rotate(-5deg); }
      100% { transform: translateY(-10px) rotate(5deg); }
    }
  `;
  document.head.appendChild(firecrackerStyle);
  
  // 点击爆竹产生烟花效果
  firecracker.addEventListener('click', function(event) {
    createFireworkEffect(event.clientX, event.clientY);
  });  
  
  firecrackerContainer.appendChild(firecracker);
  document.body.appendChild(firecrackerContainer);
  
  // 只有在启用雪花特效时才创建雪花
  if (snowEnabled) {
    // 创建雪花容器
    const snowContainer = document.createElement('div');
    snowContainer.id = 'snow-container';
    snowContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
      user-select: none;
    `;
    document.body.appendChild(snowContainer);
    
    // 创建雪花
    function createSnow() {
      const snow = document.createElement('div');
      // 使用雪花符号
      snow.innerHTML = '❄';
      snow.style.cssText = `
        position: absolute;
        color: #e0f7fa;
        font-size: ${Math.random() * 10 + 10}px;
        left: ${Math.random() * 100}vw;
        top: -20px;
        opacity: ${Math.random() * 0.5 + 0.5};
        animation: fall ${Math.random() * 5 + 5}s linear infinite;
        pointer-events: none;
        user-select: none;
      `;
      
      snowContainer.appendChild(snow);
      
      // 雪花移除
      setTimeout(() => {
        if (snow.parentNode) {
          snow.parentNode.removeChild(snow);
        }
      }, 10000);
    }
    
    // 定期创建雪花
    setInterval(createSnow, 300);
    
    // 添加雪花动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fall {
        to {
          transform: translateY(105vh) rotate(${Math.random() * 360}deg);
        }
      }
    `;
    document.head.appendChild(style);
  }
}
  
  // 创建烟花效果
  function createFireworkEffect(x, y) {
    // 创建烟花容器
    const fireworkContainer = document.createElement('div');
    fireworkContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10001;
      overflow: hidden;
      user-select: none;
    `;
    document.body.appendChild(fireworkContainer);
    
    // 创建多个烟花粒子
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 100 + 50;
      const size = Math.random() * 6 + 2;
      const colors = ['#ff5722', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0', '#e91e63'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: 50%;
        left: ${x}px;
        top: ${y}px;
        opacity: 1;
        box-shadow: 0 0 10px ${color};
        user-select: none;
        pointer-events: none;
      `;
      
      fireworkContainer.appendChild(particle);
      
      // 使用CSS动画实现烟花爆炸效果
      const animation = particle.animate([
        { 
          transform: `translate(0, 0)`,
          opacity: 1
        },
        { 
          transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
          opacity: 0
        }
      ], {
        duration: Math.random() * 1000 + 1500,
        easing: 'cubic-bezier(0, .9, .57, 1)'
      });
      
      // 动画结束后移除粒子
      animation.onfinish = () => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      };
    }
    
    // 烟花容器在一段时间后移除
    setTimeout(() => {
      if (fireworkContainer.parentNode) {
        fireworkContainer.parentNode.removeChild(fireworkContainer);
      }
    }, 2000);
  }


// 添加新年按钮装饰
function addNewYearButtonEffects() {
  // 获取所有按钮元素
  const buttons = document.querySelectorAll('button');
  
  // 为每个按钮添加新年装饰
  buttons.forEach(button => {
    // 添加新年边框光效
    button.style.transition = 'all 0.3s ease';
    
    // 添加新年装饰图标
    if (!button.querySelector('.new-year-deco')) {
      const deco = document.createElement('span');
      deco.className = 'new-year-deco';
      deco.innerHTML = '🎉';
      deco.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        font-size: 16px;
        opacity: 0;
        transition: all 0.3s ease;
        pointer-events: none;
        z-index: 10000;
      `;
      
      // 确保按钮有相对定位以便装饰图标正确定位，但不影响现有布局
      const computedStyle = window.getComputedStyle(button);
      if (computedStyle.position !== 'relative' && computedStyle.position !== 'absolute') {
        button.style.position = 'relative';
      }
      
      button.appendChild(deco);
    }
    
    // 鼠标悬停效果
    button.addEventListener('mouseenter', () => {
      // 仅对非语音输入按钮应用阴影效果，避免影响布局
      if (button.id !== 'voiceInputButton' && button.id !== 'inline-voice-btn') {
        button.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.5), inset 0 0 15px rgba(255, 215, 0, 0.2)';
      }
      
      // 显示装饰图标
      const deco = button.querySelector('.new-year-deco');
      if (deco) {
        deco.style.opacity = '1';
        deco.style.transform = 'scale(1.2)';
      }
    });
    
    button.addEventListener('mouseleave', () => {
      // 移除阴影效果
      button.style.boxShadow = '';
      
      // 隐藏装饰图标
      const deco = button.querySelector('.new-year-deco');
      if (deco) {
        deco.style.opacity = '0';
        deco.style.transform = 'scale(1)';
      }
    });
    
    // 添加点击波纹效果（但不影响语音输入按钮）
    button.addEventListener('mousedown', () => {
      if (button.id !== 'voiceInputButton' && button.id !== 'inline-voice-btn') {
        button.style.transform = 'scale(0.95)';
      }
    });
    
    button.addEventListener('mouseup', () => {
      button.style.transform = 'scale(1)';
    });
  });
}

// 初始化欢迎消息
document.addEventListener('DOMContentLoaded', async () => {
  // 显示新年祝福
  if (shouldShowNewYearGreeting()) {
    showNewYearGreeting();
  }
  
  // 添加新年特效
  addNewYearEffects();
  
  // 添加新年按钮装饰
  addNewYearButtonEffects();
  
  // 尝试从本地加载技能状态
  loadSkillState();
  
  // 设置雪花特效切换监听器
  const snowToggle = document.getElementById('snowToggle');
  if (snowToggle) {
    // 初始化时设置复选框状态
    snowToggle.checked = getSnowSetting();
    
    // 添加事件监听器
    snowToggle.addEventListener('change', function() {
      saveSnowSetting(this.checked);
      
      // 重新加载新年特效以应用更改
      const snowContainer = document.getElementById('snow-container');
      if (snowContainer) {
        snowContainer.remove();
      }
      
      // 重新添加新年特效
      addNewYearEffects();
    });
  }
  
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
        addMessageToHistory(message.content, message.role === 'user', null, false);
      });
    } else {
      // 如果没有对话记录，创建并切换到新对话
      const newId = createNewConversation();
      switchToConversation(newId);
      
      // 显示欢迎消息
      addMessageToHistory('您好！我是小R AI助手，有什么可以帮助您的吗？', false, null, false);
    }
    
    // 更新对话列表显示
    updateChatListDisplay();
    
    // 确保技能按钮状态正确显示
    updateSkillButtonStates();
  } catch (error) {
    console.error('加载对话失败:', error);
    
    // 创建并切换到新对话
    const newId = createNewConversation();
    switchToConversation(newId);
    
    // 显示欢迎消息
    addMessageToHistory('您好！我是小R AI助手，有什么可以帮助您的吗？', false, null, false);
    
    // 更新对话列表显示
    updateChatListDisplay();
    
    // 确保技能按钮状态正确显示
    updateSkillButtonStates();
  }
});


// 错误提示信息
const errorMessages = {
  networkError: '网络错误，请检查网络连接。',
  invalidUrl: 'API地址无效，请检查URL是否正确。',
  apiUnavailable: 'API服务暂时不可用，请稍后再试。'
};

// 语音输入功能
let isListening = false;

// 初始化语音识别
function initSpeechRecognition() {
  // 在桌面版Electron应用中，我们使用原生语音识别，不需要初始化Web Speech API
  console.log('桌面版语音识别已准备，使用原生功能');
  return true;
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

// 开始语音识别 - 此函数保留用于未来网页版兼容
function startVoiceRecognition() {
  console.log('网页版语音识别功能');
}

// 停止语音识别 - 此函数保留用于未来网页版兼容
function stopVoiceRecognition() {
  console.log('停止网页版语音识别');
}

// 切换语音识别状态
function toggleVoiceRecognition() {
  // 在桌面版中，始终使用Electron原生语音识别
  startElectronVoiceRecognition();
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

// Electron环境下的语音识别函数
async function startElectronVoiceRecognition() {
  try {
    // 显示正在识别的提示
    console.log('正在启动语音识别...');
    showVoiceInputError('正在识别语音...');
    
    // 调用Electron主进程的语音识别功能
    const result = await window.electronAPI.startVoiceRecognition();
    
    if (result && result !== '语音识别功能仅支持Windows系统') {
      // 将识别结果插入到输入框
      userInput.value += result;
      console.log('语音识别结果:', result);
      
      // 隐藏错误提示
      const alertBoxes = document.querySelectorAll('.voice-input-alert');
      alertBoxes.forEach(box => box.remove());
    } else {
      // 显示错误信息
      showVoiceInputError(result || '语音识别失败或未检测到语音');
    }
  } catch (error) {
    console.error('语音识别错误:', error);
    showVoiceInputError('语音识别过程中发生错误');
  }
}

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
    
    // 获取音色设置
    let voiceType = '';
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      voiceType = settings.voiceType || '';
    }
    
    // 构建API URL，如果设置了音色则添加voice参数
    let apiUrl = `https://api.jkyai.top/API/jhyysc.php?msg=${encodeURIComponent(textWithoutEmojis)}`;
    if (voiceType) {
      apiUrl += `&voice=${voiceType}`;
    }
    
    // 调用API获取语音URL
    const response = await fetch(apiUrl);
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
    } else if (settings.theme === 'system') {
      // 检测系统主题偏好
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      console.log('系统主题偏好:', isDarkMode ? '深色' : '浅色');
      if (isDarkMode) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
      
      // 监听系统主题变化
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
          const currentSettings = JSON.parse(localStorage.getItem('xiaor-settings') || '{}');
          console.log('系统主题变化:', e.matches ? '深色' : '浅色');
          if (currentSettings.theme === 'system') {
            if (e.matches) {
              document.body.classList.add('dark-theme');
            } else {
              document.body.classList.remove('dark-theme');
            }
          }
        });
      }
      themeSelect.value = 'system';
    } else if (settings.theme === 'newyear') {
      document.body.classList.add('newyear-theme');
      themeSelect.value = 'newyear';
    } else {
      document.body.classList.remove('dark-theme');
      document.body.classList.remove('newyear-theme');
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
      // 检查并应用模型可用性状态
      const availability = JSON.parse(localStorage.getItem('aiModelAvailability') || '{}');
      updateModelSelectDisplay(availability, settings.aiModel);
      
      aiModelSelect.value = settings.aiModel;
      
      // 显示或隐藏Ollama设置
      if (settings.aiModel === 'ollama') {
        const ollamaSettings = document.getElementById('ollamaSettings');
        if (ollamaSettings) {
          ollamaSettings.style.display = 'block';
          // 设置Ollama服务器地址
          if (settings.ollamaServerUrl) {
            document.getElementById('ollamaServerUrl').value = settings.ollamaServerUrl;
          }
          // 设置Ollama模型
          if (settings.ollamaModel) {
            document.getElementById('ollamaModelSelect').value = settings.ollamaModel;
          }
        }
      } else {
        const ollamaSettings = document.getElementById('ollamaSettings');
        if (ollamaSettings) {
          ollamaSettings.style.display = 'none';
        }
      }
      
      // 显示或隐藏自定义模型设置
      if (settings.aiModel === 'custom' && settings.customModelUrl) {
        customModelSettings.style.display = 'block';
        customModelUrl.value = settings.customModelUrl;
      } else {
        customModelSettings.style.display = 'none';
      }
    } else {
      // 检查并应用模型可用性状态
      const availability = JSON.parse(localStorage.getItem('aiModelAvailability') || '{}');
      updateModelSelectDisplay(availability, 'deepseek');
      
      aiModelSelect.value = 'deepseek'; // 默认为Deepseek
      customModelSettings.style.display = 'none';
      
      // 确保Ollama设置区域隐藏
      const ollamaSettings = document.getElementById('ollamaSettings');
      if (ollamaSettings) {
        ollamaSettings.style.display = 'none';
      }
    }
    
    // 应用音色设置
    if (settings.voiceType) {
      voiceTypeSelect && (voiceTypeSelect.value = settings.voiceType);
    }
    
    // 根据语音开关状态显示或隐藏音色设置
    if (voiceToggle.checked) {
      voiceTypeSetting.style.display = 'block';
    } else {
      voiceTypeSetting.style.display = 'none';
    }
    
    // 应用开机自启动设置
    if (settings.autoLaunch !== undefined) {
      autoLaunchToggle.checked = settings.autoLaunch;
      // 尝试更新主进程中的自启动设置
      if (window.electronAPI && window.electronAPI.setAutoLaunch) {
        window.electronAPI.setAutoLaunch(settings.autoLaunch);
      }
    }
    
    // 应用悬浮球显示设置
    if (settings.showFloatingBall !== undefined) {
      floatingBallToggle.checked = settings.showFloatingBall;
    } else {
      floatingBallToggle.checked = true; // 默认显示悬浮球
    }
    
    // 应用关闭时直接退出设置
    if (settings.closeToExit !== undefined) {
      closeToExitToggle.checked = settings.closeToExit;
    } else {
      closeToExitToggle.checked = false; // 默认不启用关闭时直接退出
    }
    
    // 应用天气API密钥设置
    if (settings.weatherApiKey !== undefined) {
      const weatherApiKeyInput = document.getElementById('weatherApiKeyInput');
      if (weatherApiKeyInput) {
        weatherApiKeyInput.value = settings.weatherApiKey;
      }
    }
    
    // 应用动画输出设置
    if (settings.animationOutput !== undefined) {
      const animationOutputToggle = document.getElementById('animationOutputToggle');
      if (animationOutputToggle) {
        animationOutputToggle.checked = settings.animationOutput;
      }
    }
    
    // 应用快捷键设置
    if (settings.shortcutKey) {
      // 从设置的快捷键中提取按键部分
      const shortcutParts = settings.shortcutKey.split('+');
      const key = shortcutParts[shortcutParts.length - 1];
      shortcutKeyInput.value = key;
    } else {
      shortcutKeyInput.value = 'R';
    }
  } else {
    // 默认设置
    voiceToggle.checked = true;
    aiModelSelect.value = 'deepseek'; // 默认为Deepseek
    customModelSettings.style.display = 'none';
    
    // 默认显示音色设置（因为语音默认启用）
    voiceTypeSetting.style.display = 'block';
    
    // 默认不启用开机自启动
    autoLaunchToggle.checked = false;
    
    // 默认显示悬浮球
    floatingBallToggle.checked = true;
    
    // 默认不启用关闭时直接退出
    closeToExitToggle.checked = false;
    
    // 默认启用动画输出
    const animationOutputToggle = document.getElementById('animationOutputToggle');
    if (animationOutputToggle) {
      animationOutputToggle.checked = true; // 默认启用动画输出
    }
    
    // 默认快捷键为R
    shortcutKeyInput.value = 'R';
    
    // 确保天气API密钥输入框存在且清空
    const weatherApiKeyInput = document.getElementById('weatherApiKeyInput');
    if (weatherApiKeyInput) {
      weatherApiKeyInput.value = '';
    }
    
    // 默认应用深色主题
    document.body.classList.add('dark-theme');
    themeSelect.value = 'dark';
  }
}

// 保存设置
function saveSettings() {
  const settings = {
    theme: themeSelect.value,
    contextCount: contextSelect.value,
    voiceEnabled: voiceToggle.checked,
    aiModel: aiModelSelect.value,
    voiceType: voiceTypeSelect ? voiceTypeSelect.value : '',
    autoLaunch: autoLaunchToggle.checked,
    showFloatingBall: floatingBallToggle.checked,
    closeToExit: closeToExitToggle.checked,
    animationOutput: animationOutputToggle ? animationOutputToggle.checked : false,
    weatherApiKey: document.getElementById('weatherApiKeyInput') ? document.getElementById('weatherApiKeyInput').value : '',
    ollamaServerUrl: document.getElementById('ollamaServerUrl') ? document.getElementById('ollamaServerUrl').value : 'http://localhost:11434',
    ollamaModel: document.getElementById('ollamaModelSelect') ? document.getElementById('ollamaModelSelect').value : ''
  };
  
  // 如果是自定义模型，保存自定义模型URL
  if (aiModelSelect.value === 'custom') {
    settings.customModelUrl = customModelUrl.value;
  }
  
  // 保存快捷键设置
  if (shortcutKeyInput && shortcutPrefix) {
    const shortcutKey = shortcutKeyInput.value.trim();
    if (shortcutKey) {
      settings.shortcutKey = shortcutPrefix.textContent + shortcutKey.toUpperCase();
    }
  }
  
  localStorage.setItem('xiaor-settings', JSON.stringify(settings));
  
  // 应用主题设置
  if (settings.theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else if (settings.theme === 'system') {
    // 检测系统主题偏好
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.log('系统主题偏好:', isDarkMode ? '深色' : '浅色');
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  } else if (settings.theme === 'newyear') {
    document.body.classList.add('newyear-theme');
  } else {
    document.body.classList.remove('dark-theme');
    document.body.classList.remove('newyear-theme');
  }
  
  // 更新主进程中的自启动设置
  if (window.electronAPI && window.electronAPI.setAutoLaunch) {
    window.electronAPI.setAutoLaunch(autoLaunchToggle.checked);
  }
  
  // 通知主进程关闭时直接退出设置已更改
  if (window.electronAPI && window.electronAPI.updateCloseToExitSetting) {
    window.electronAPI.updateCloseToExitSetting(closeToExitToggle.checked);
  }
  
  console.log('设置已保存:', settings);
}

// 设置面板标签页切换功能
function initializeSettingsTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 移除所有按钮的active类
      tabButtons.forEach(btn => btn.classList.remove('active'));
      
      // 添加active类到当前按钮
      button.classList.add('active');
      
      // 隐藏所有标签内容
      document.querySelectorAll('.settings-tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // 显示对应的内容
      const tabId = button.getAttribute('data-tab');
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.add('active');
      }
    });
  });
}

// 初始化设置面板标签页
initializeSettingsTabs();

// 设置面板事件监听器
settingsButton.addEventListener('click', () => {
  settingsPanel.classList.add('active');
});

// AI模型选择变化事件监听器
aiModelSelect.addEventListener('change', () => {
  if (aiModelSelect.value === 'custom') {
    customModelSettings.style.display = 'block';
  } else {
    customModelSettings.style.display = 'none';
  }
  
  // 只有在选择Ollama模型时才显示Ollama设置
  const ollamaSettings = document.getElementById('ollamaSettings');
  if (ollamaSettings) {
    if (aiModelSelect.value === 'ollama') {
      ollamaSettings.style.display = 'block';
    } else {
      ollamaSettings.style.display = 'none';
    }
  }
});

// 语音开关变化事件监听器
voiceToggle.addEventListener('change', () => {
  if (voiceToggle.checked) {
    voiceTypeSetting.style.display = 'block';
  } else {
    voiceTypeSetting.style.display = 'none';
  }
});

// 悬浮球开关事件监听器
floatingBallToggle.addEventListener('change', () => {
  // 通知主进程更新悬浮球显示状态
  if (window.electronAPI && window.electronAPI.updateFloatingBallVisibility) {
    window.electronAPI.updateFloatingBallVisibility(floatingBallToggle.checked);
  }
});

saveSettingsButton.addEventListener('click', () => {
  saveSettings();
  settingsPanel.classList.remove('active');
});

// 快捷键设置按钮事件监听器
setShortcutButton.addEventListener('click', () => {
  const newShortcutKey = shortcutKeyInput.value.trim();
  if (newShortcutKey) {
    const newShortcut = shortcutPrefix.textContent + newShortcutKey.toUpperCase();
    
    // 通知主进程更新快捷键
    if (window.electronAPI && window.electronAPI.updateShortcut) {
      window.electronAPI.updateShortcut(newShortcut);
      showNotification('快捷键已更新: ' + newShortcut);
    }
    
    // 更新本地存储中的快捷键设置
    const savedSettings = localStorage.getItem('xiaor-settings');
    let settings = {};
    if (savedSettings) {
      settings = JSON.parse(savedSettings);
    }
    settings.shortcutKey = newShortcut;
    localStorage.setItem('xiaor-settings', JSON.stringify(settings));
  } else {
    showNotification('请输入有效的快捷键');
  }
});

closeSettingsButton.addEventListener('click', () => {
  // 恢复之前的设置值
  loadSettings();
  settingsPanel.classList.remove('active');
});

clearDataButton.addEventListener('click', async () => {
  await clearAllUserData();
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
    // 过滤掉包含 XiaoR://Showimage 和 * 的消息
    const firstUserMessage = conversation.history.find(item => 
      item.role === 'user' && 
      !item.content.includes('XiaoR://Showimage') && 
      !item.content.includes('*')
    );
    
    const firstAIMessage = conversation.history.find(item => 
      item.role === 'assistant' && 
      !item.content.includes('XiaoR://Showimage') && 
      !item.content.includes('*')
    );
    
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

// 应用悬浮球设置 - 通知主进程更新悬浮球可见性
setTimeout(() => {
  if (window.electronAPI && window.electronAPI.updateFloatingBallVisibility) {
    window.electronAPI.updateFloatingBallVisibility(floatingBallToggle.checked);
  }
}, 1000); // 延迟1秒执行，确保主进程已准备好接收消息

// 检查AI模型可用性
setTimeout(() => {
  checkAIModelAvailability();
}, 1000); // 延迟1秒执行，确保页面元素已加载

// 新对话功能
function startNewChat() {
  // 创建新对话
  const newId = createNewConversation();
  switchToConversation(newId);
  
  // 显示新年祝福
  if (shouldShowNewYearGreeting()) {
    showNewYearGreeting();
  }
  
  // 显示欢迎消息
  addMessageToHistory('您好！我是小R AI助手，有什么可以帮助您的吗？', false, null, false);
  
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

// 检查AI模型可用性
async function checkAIModelAvailability() {
  const modelEndpoints = {
    'deepseek': 'https://api.jkyai.top/API/depsek3.2.php',
    'claude': 'https://api.jkyai.top/API/doubao.php',
    'yuanbao': 'https://api.jkyai.top/API/yuanbao.php',
    'qwen3': 'https://api.jkyai.top/API/qwen3.php',
    'ling': 'https://api.jkyai.top/API/ling-1t.php',
    'gemini': 'https://api.jkyai.top/API/gemini2.5/index.php',
    'glm': 'https://api.52vmy.cn/api/chat/glm?msg=测试连接。提示词是：系统测试&type=text'
  };
  
  const modelNames = {
    'deepseek': 'DeepseekV3.2',
    'claude': '豆包',
    'yuanbao': '腾讯元宝',
    'qwen3': 'Qwen3',
    'ling': '蚂蚁Ling2.0',
    'gemini': 'Gemini-2.5',
    'glm': 'GLM'
  };
  
  // 获取当前选择的AI模型
  const savedSettings = localStorage.getItem('xiaor-settings');
  let currentModel = 'deepseek'; // 默认为Deepseek
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    currentModel = settings.aiModel || 'deepseek';
  }
  
  // 检查每个模型的可用性
  const availability = {};
  for (const [model, endpoint] of Object.entries(modelEndpoints)) {
    try {
      // 所有模型API都需要参数，使用GET方法发送带参数的测试请求
      const url = new URL(endpoint);
      url.searchParams.append('question', '测试连接');
      url.searchParams.append('system', '测试系统提示');
      
      const getResponse = await fetch(url.toString(), { method: 'GET' });
      availability[model] = getResponse.ok;
    } catch (error) {
      console.warn(`${modelNames[model]} 模型连接失败:`, error);
      availability[model] = false;
    }
  }
  
  // 保存可用性状态到localStorage
  localStorage.setItem('aiModelAvailability', JSON.stringify(availability));
  
  // 更新下拉菜单显示
  updateModelSelectDisplay(availability, currentModel);
}

// 更新模型选择下拉菜单显示
function updateModelSelectDisplay(availability, currentModel) {
  const selectElement = document.getElementById('aiModelSelect');
  if (!selectElement) return;
  
  // 保存当前选择
  const currentSelection = selectElement.value;
  
  // 清空选项
  selectElement.innerHTML = '';
  
  // 重新添加选项，根据可用性添加提示
  const options = [
    { value: 'deepseek', text: 'DeepseekV3.2' },
    { value: 'claude', text: '豆包' },
    { value: 'yuanbao', text: '腾讯元宝' },
    { value: 'qwen3', text: 'Qwen3' },
    { value: 'ling', text: '蚂蚁Ling2.0' },
    { value: 'gemini', text: 'Gemini-2.5' },
    { value: 'glm', text: 'GLM' },
    { value: 'custom', text: '自定义模型' },
    { value: 'ollama', text: 'Ollama本地模型' }
  ];
  
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    
    if (option.value !== 'custom' && option.value !== 'ollama') { // 自定义模型和Ollama模型不检查可用性
      if (!availability[option.value]) {
        optionElement.text = `${option.text} (可能暂时无法使用)`;
      } else {
        optionElement.text = option.text;
      }
    } else {
      optionElement.text = option.text;
    }
    
    selectElement.appendChild(optionElement);
  });
  
  // 恢复原来的选择
  selectElement.value = currentSelection;
  
  // 计算不可用模型数量并显示提示
  const unavailableCount = Object.keys(availability).filter(model => !availability[model]).length;
  
  // 显示不可用模型信息
  const modelAvailabilityInfo = document.getElementById('modelAvailabilityInfo');
  const modelUnavailableCount = document.getElementById('modelUnavailableCount');
  const ignoreModelErrorBtn = document.getElementById('ignoreModelErrorBtn');
  
  if (modelAvailabilityInfo && modelUnavailableCount) {
    if (unavailableCount > 0) {
      modelUnavailableCount.textContent = `${unavailableCount}个模型可能无法正常使用`;
      modelAvailabilityInfo.style.display = 'block';
      
      // 添加或更新忽略错误按钮事件监听器
      if (ignoreModelErrorBtn && !ignoreModelErrorBtn.dataset.listenerAdded) {
        ignoreModelErrorBtn.addEventListener('click', () => {
          // 将所有模型标记为可用
          const allModelsAvailability = {
            'deepseek': true,
            'claude': true,
            'yuanbao': true,
            'qwen3': true,
            'ling': true,
            'gemini': true,
            'glm': true,
            'ollama': true
          };
          
          // 保存到本地存储
          localStorage.setItem('aiModelAvailability', JSON.stringify(allModelsAvailability));
          
          // 重新更新显示
          updateModelSelectDisplay(allModelsAvailability, currentModel);
          
          // 隐藏提示信息
          modelAvailabilityInfo.style.display = 'none';
          
          showNotification('已忽略模型错误，所有模型现在显示为可用');
        });
        ignoreModelErrorBtn.dataset.listenerAdded = 'true'; // 标记监听器已添加
      }
    } else {
      modelAvailabilityInfo.style.display = 'none';
    }
  }
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

// 将指定对话移到列表顶部
function moveConversationToTop(conversationId) {
  const index = allConversations.findIndex(conv => conv.id === conversationId);
  
  if (index !== -1) {
    // 从数组中移除该对话
    const [conversation] = allConversations.splice(index, 1);
    
    // 将对话移到数组开头
    allConversations.unshift(conversation);
    
    // 更新对话的更新时间
    conversation.updatedAt = new Date().toISOString();
    
    // 保存更改
    saveAllConversations();
    
    // 更新对话列表显示
    updateChatListDisplay();
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
      addMessageToHistory(item.content, item.role === 'user', null, false);
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
            addMessageToHistory(item.content, item.role === 'user', null, false);
          });
        } else {
          // 如果没有其他对话了，创建新对话
          currentConversationId = null;
          chatHistory.innerHTML = '';
          addMessageToHistory('您好！我是小R AI助手，有什么可以帮助您的吗？', false, null, false);
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
  
  // 保存技能状态
  saveSkillState();
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
  
  // 保存技能状态
  saveSkillState();
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
  
  // 同时更新技能菜单按钮的状态
  if (imageGenMenuButton) {
    if (activeSkillMode === 'imageGen') {
      imageGenMenuButton.classList.add('active-skill');
    } else {
      imageGenMenuButton.classList.remove('active-skill');
    }
  }
  
  if (imageOcrMenuButton) {
    if (activeSkillMode === 'imageOcr') {
      imageOcrMenuButton.classList.add('active-skill');
    } else {
      imageOcrMenuButton.classList.remove('active-skill');
    }
  }
  
  if (translationMenuButton) {
    if (activeSkillMode === 'translation') {
      translationMenuButton.classList.add('active-skill');
    } else {
      translationMenuButton.classList.remove('active-skill');
    }
  }
  
  if (codeAssistantMenuButton) {
    if (activeSkillMode === 'codeAssistant') {
      codeAssistantMenuButton.classList.add('active-skill');
    } else {
      codeAssistantMenuButton.classList.remove('active-skill');
    }
  }
  
  if (weatherMenuButton) {
    if (activeSkillMode === 'weather') {
      weatherMenuButton.classList.add('active-skill');
    } else {
      weatherMenuButton.classList.remove('active-skill');
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
  
  // 保存技能状态
  saveSkillState();
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

// Ollama相关功能

// 测试Ollama连接
async function testOllamaConnection() {
  const serverUrl = document.getElementById('ollamaServerUrl').value || 'http://localhost:11434';
  const statusElement = document.getElementById('ollamaConnectionStatus');
  const indicatorElement = document.getElementById('ollamaConnectionIndicator');
  
  if (statusElement && indicatorElement) {
    statusElement.textContent = '连接中...';
    indicatorElement.className = 'status-indicator connecting';
  }
  
  try {
    // 测试连接
    const response = await fetch(`${serverUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (statusElement && indicatorElement) {
        statusElement.textContent = '连接成功';
        indicatorElement.className = 'status-indicator connected';
      }
      
      // 获取模型列表并填充到下拉菜单
      updateOllamaModelList(data.models || []);
      
      showNotification('Ollama连接成功！');
      return true;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Ollama连接测试失败:', error);
    
    if (statusElement && indicatorElement) {
      statusElement.textContent = `连接失败: ${error.message || '未知错误'}`;
      indicatorElement.className = 'status-indicator disconnected';
    }
    
    showNotification(`Ollama连接失败: ${error.message || '未知错误'}`);
    return false;
  }
}

// 更新Ollama模型列表
function updateOllamaModelList(models) {
  const modelSelect = document.getElementById('ollamaModelSelect');
  if (!modelSelect) return;
  
  // 清空现有选项
  modelSelect.innerHTML = '';
  
  if (models.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '未找到可用模型';
    modelSelect.appendChild(option);
    return;
  }
  
  // 添加模型选项
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.name;
    option.textContent = model.name;
    modelSelect.appendChild(option);
  });
}

// 刷新Ollama模型列表
async function refreshOllamaModels() {
  const serverUrl = document.getElementById('ollamaServerUrl').value || 'http://localhost:11434';
  const statusElement = document.getElementById('ollamaConnectionStatus');
  
  if (statusElement) {
    statusElement.textContent = '获取模型列表...';
  }
  
  try {
    const response = await fetch(`${serverUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      updateOllamaModelList(data.models || []);
      
      if (statusElement) {
        statusElement.textContent = '连接成功';
      }
      
      showNotification('模型列表已刷新');
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('获取Ollama模型列表失败:', error);
    
    if (statusElement) {
      statusElement.textContent = `获取模型失败: ${error.message || '未知错误'}`;
    }
    
    showNotification(`获取模型列表失败: ${error.message || '未知错误'}`);
  }
}

// 初始化Ollama相关事件监听器
function initializeOllamaSettings() {
  const testConnectionBtn = document.getElementById('testOllamaConnection');
  const refreshModelsBtn = document.getElementById('refreshOllamaModels');
  
  if (testConnectionBtn) {
    testConnectionBtn.addEventListener('click', testOllamaConnection);
  }
  
  if (refreshModelsBtn) {
    refreshModelsBtn.addEventListener('click', refreshOllamaModels);
  }
  
  // 设置默认服务器地址
  const serverUrlInput = document.getElementById('ollamaServerUrl');
  if (serverUrlInput && !serverUrlInput.value) {
    serverUrlInput.value = 'http://localhost:11434';
  }
}

// 初始化Ollama设置
initializeOllamaSettings();

// 窗口控制按钮事件监听器
window.addEventListener('DOMContentLoaded', () => {
  const minimizeBtn = document.getElementById('minimizeBtn');
  const maximizeBtn = document.getElementById('maximizeBtn');
  const closeBtn = document.getElementById('closeBtn');
  
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (window.electronAPI && window.electronAPI.minimizeWindow) {
        try {
          await window.electronAPI.minimizeWindow();
        } catch (error) {
          console.error('最小化窗口失败:', error);
        }
      }
    });
  }
  
  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (window.electronAPI && window.electronAPI.maximizeWindow) {
        try {
          await window.electronAPI.maximizeWindow();
        } catch (error) {
          console.error('最大化/还原窗口失败:', error);
        }
      }
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (window.electronAPI && window.electronAPI.closeWindow) {
        try {
          await window.electronAPI.closeWindow();
        } catch (error) {
          console.error('关闭窗口失败:', error);
        }
      }
    });
  }

  // 监听从迷你输入框发送的消息
  if (window.electronAPI && window.electronAPI.onMiniInputMessage) {
    window.electronAPI.onMiniInputMessage((params) => {
      console.log('通过IPC收到从迷你输入框发送的消息:', params);
      
      // 在主界面中处理消息
      if (params.question) {
        // 添加用户消息到聊天历史
        addMessageToHistory(params.question, true);
        
        // 发送消息到AI，使用设置中的模型（忽略传递的模型参数）
        sendToAI(params.question);
      }
    });
  }

  // 也监听全局IPC消息
  if (window.require) {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('mini-input-message', (event, params) => {
      console.log('通过全局IPC收到从迷你输入框发送的消息:', params);
      
      // 在主界面中处理消息
      if (params.question) {
        // 添加用户消息到聊天历史
        addMessageToHistory(params.question, true);
        
        // 发送消息到AI，使用设置中的模型（忽略传递的模型参数）
        sendToAI(params.question);
      }
    });
  }
});


// 扩展模型功能
function extendModel() {
  const extendButton = document.getElementById('extendModelButton');
  const extendProgress = document.getElementById('extendProgress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  
  if (!extendButton || !extendProgress || !progressFill || !progressText) {
    console.error('扩展模型元素未找到');
    return;
  }
  
  // 显示进度条
  extendProgress.style.display = 'block';
  
  // 模拟10秒进度条
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    progressFill.style.width = progress + '%';
    progressText.textContent = progress + '%';
    
    if (progress >= 100) {
      clearInterval(interval);
      
      // 10秒后显示提示框
      setTimeout(() => {
        showCustomAlert('提示', 'Ruanm自研模型RenMinix扩展成功！服务器正在申请中，敬请期待。');
        // 隐藏进度条
        extendProgress.style.display = 'none';
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
      }, 1000); // 延迟1秒显示提示框
    }
  }, 1000); // 每秒增加10%
}

// 检查更新功能
function checkForUpdate() {
  showCustomAlert('检查更新', '当前已是最新版本: v1.1.2\n如有更新会在此处显示。');
  console.log('用户关闭了更新提示');
}

// 定义showAlert函数
function showAlert(title, message) {
  showCustomAlert(title, message);
}



// 更新关闭时直接退出设置的UI
function updateCloseToExitSetting(enabled) {
  if (closeToExitToggle) {
    closeToExitToggle.checked = enabled;
  }
}

// 为扩展模型按钮添加点击事件
document.addEventListener('DOMContentLoaded', () => {
  const extendButton = document.getElementById('extendModelButton');
  const updateButton = document.getElementById('checkUpdateButton');
  
  if (extendButton) {
    extendButton.addEventListener('click', extendModel);
  }
  
  if (updateButton) {
    updateButton.addEventListener('click', checkForUpdate);
  }
});


