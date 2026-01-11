// 侧边栏专用JavaScript功能

// 获取DOM元素
const chatHistory = document.getElementById('chatHistory');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// 自动调整文本域高度函数
function adjustTextareaHeight() {
    userInput.style.height = 'auto';
    // 设置最大高度，防止过度拉伸
    userInput.style.maxHeight = '120px';
    // 计算内容所需的高度
    const scrollHeight = userInput.scrollHeight;
    const maxHeight = parseInt(window.getComputedStyle(userInput).maxHeight);
    
    if (scrollHeight > maxHeight) {
        userInput.style.overflowY = 'auto';
        userInput.style.height = maxHeight + 'px';
    } else {
        userInput.style.overflowY = 'hidden';
        userInput.style.height = scrollHeight + 'px';
    }
}

// 设置相关元素
const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');
const contextSelect = document.getElementById('contextSelect');
const voiceTypeSelect = document.getElementById('voiceTypeSelect');
const voiceTypeSetting = document.getElementById('voiceTypeSetting');
const aiModelSelect = document.getElementById('aiModelSelect');
const saveSettingsButton = document.getElementById('saveSettings');
const closeSettingsButton = document.getElementById('closeSettings');
const customModelSettings = document.getElementById('customModelSettings');
const customModelUrl = document.getElementById('customModelUrl');
const themeSelect = document.getElementById('themeSelect');

// 技能相关元素
const skillButton = document.getElementById('skillButton');
const skillMenu = document.getElementById('skillMenu');

// 技能菜单按钮
const imageGenMenuButton = document.getElementById('imageGenMenuButton');
const imageOcrMenuButton = document.getElementById('imageOcrMenuButton');
const translationMenuButton = document.getElementById('translationMenuButton');
const codeAssistantMenuButton = document.getElementById('codeAssistantMenuButton');
const weatherMenuButton = document.getElementById('weatherMenuButton');
const newsInquiryMenuButton = document.getElementById('newsInquiryMenuButton');



// 当前激活的技能模式
let activeSkillMode = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 加载设置
    loadSettings();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 显示欢迎消息
    showWelcomeMessage();
});

// 设置事件监听器
function setupEventListeners() {
    // 发送按钮事件
    sendButton.addEventListener('click', handleUserMessage);
    
    // 输入框回车事件
    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleUserMessage();
        }
    });
                
    // 输入框内容改变时调整高度
    userInput.addEventListener('input', adjustTextareaHeight);
                
    // 页面加载完成后调整一次高度
    setTimeout(adjustTextareaHeight, 100);
    
    // 设置按钮事件
    settingsButton.addEventListener('click', () => {
        settingsPanel.classList.add('active');
    });
    
    // 关闭设置面板
    closeSettingsButton.addEventListener('click', () => {
        settingsPanel.classList.remove('active');
    });
    
    // 保存设置
    saveSettingsButton.addEventListener('click', saveSettings);
    

    
    // AI模型选择事件
    aiModelSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customModelSettings.style.display = 'block';
        } else {
            customModelSettings.style.display = 'none';
        }
    });
    
    // 主题选择事件
    themeSelect.addEventListener('change', function() {
        applyTheme(this.value);
    });
    
    // 技能按钮事件
    skillButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleSkillMenu();
    });
    
    // 点击外部关闭技能菜单
    document.addEventListener('click', (event) => {
        if (!skillMenu.contains(event.target) && event.target !== skillButton) {
            skillMenu.style.display = 'none';
        }
    });
    
    
    
    // 技能菜单按钮事件
    imageGenMenuButton.addEventListener('click', () => toggleSkillMode('imageGen', '图片生成'));
    imageOcrMenuButton.addEventListener('click', () => toggleSkillMode('imageOcr', 'OCR识别')); 
    translationMenuButton.addEventListener('click', () => toggleSkillMode('translation', '翻译')); 
    codeAssistantMenuButton.addEventListener('click', () => toggleSkillMode('codeAssistant', '编程助手')); 
    weatherMenuButton.addEventListener('click', () => toggleSkillMode('weather', '天气查询')); 
    newsInquiryMenuButton.addEventListener('click', () => toggleSkillMode('newsInquiry', '新闻查询')); 
}

// 显示欢迎消息
function showWelcomeMessage() {
    // 清空聊天历史
    chatHistory.innerHTML = '';
    
    // 添加欢迎消息
    addMessageToHistory('欢迎使用小R AI助手！我是您的智能AI伙伴，随时为您服务。您可以问我任何问题，也可以使用上方的 💡 技能按钮来调用特殊功能。', false);
}

// 处理用户发送消息
function handleUserMessage() {
    const message = userInput.value.trim();
    
    if (message) {
        // 添加用户消息到聊天历史
        addMessageToHistory(message, true);
        
        // 清空输入框
        userInput.value = '';
        
        // 发送消息到AI
        sendToAI(message);
    }
}

// 添加消息到聊天历史
function addMessageToHistory(message, isUser = false, messageId = null) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isUser ? 'user' : 'ai');
    
    if (messageId) {
        messageDiv.id = messageId;
    }
    
    if (!isUser) {
        // 如果是AI消息，解析markdown
        messageDiv.innerHTML = parseMarkdown(message);
    } else {
        messageDiv.textContent = message;
    }
    
    chatHistory.appendChild(messageDiv);
    
    // 滚动到底部
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// 发送消息到AI
async function sendToAI(question) {
    // 显示加载状态
    sendButton.innerHTML = '<span>🤔</span>';
    sendButton.disabled = true;
    
    try {
        // 实际的AI请求处理
        try {
            // 显示正在思考状态
            const thinkingMessageId = 'thinking-' + Date.now();
            addMessageToHistory('🤔 正在思考...', false, thinkingMessageId);
            
            // 构建请求数据
            let systemMessage = '你是小R AI助手，由Ruanm开发，专注于帮用户解决各种难题、聊天。';
            
            // 根据激活的技能模式修改system消息
            if (activeSkillMode === 'imageGen') {
                systemMessage = '你现在是专业图片生成Ai，根据用户的图片描述生成图片。请严格按照以下步骤操作：1.对用户的图片描述进行润色成中文；2.输出润色后的内容；3.对用户描述给予回应或建议；4.最后必须输出XiaoR://Request?URL=https://yunzhiapi.cn/API/qwen-image/index.php?msg=润色后的图片描述来发起API请求。';
            } else if (activeSkillMode === 'imageOcr') {
                systemMessage = '你现在是专业OCR识别助手，帮助用户从图片中识别文字。请严格按照以下步骤操作：1.对用户提供的图片链接进行处理；2.输出处理后的链接；3.对OCR识别给予回应或建议；4.最后必须输出XiaoR://OCR?URL=https://yunzhiapi.cn/API/ocrwzsb.php?url=图片链接&type=text来发起OCR API请求。';
            } else if (activeSkillMode === 'translation') {
                systemMessage = '你现在是一个专业的翻译助手，用户将提供需要翻译的文本。请直接输出翻译结果，不要添加任何解释或额外内容。如果用户没有明确指定目标语言，请询问用户需要翻译成哪种语言。';
            } else if (activeSkillMode === 'codeAssistant') {
                systemMessage = '你现在是一个专业的编程助手，专门帮助用户解释和生成代码。请遵循以下规则：\n1. 如果用户请求解释代码，请详细解释代码的功能、逻辑和关键部分；\n2. 如果用户请求生成代码，请生成清晰、高效的代码，并提供必要的注释；\n3. 如果用户询问编程问题，请提供详细的解答和最佳实践建议。';
            } else if (activeSkillMode === 'weather') {
                systemMessage = '你现在是专业天气查询AI助手，根据用户提供的地名查询天气信息。请严格按照以下步骤操作：1.对用户提供的地名进行处理（中国地名转换为拼音）；2.输出处理后的地名；3.对天气查询给予回应或建议；4.最后必须输出XiaoR://GetWeather?URL=http://api.openweathermap.org/data/2.5/weather?q=地名&appid=YOUR_API_KEY来发起天气API请求。';
            } else if (activeSkillMode === 'newsInquiry') {
                systemMessage = '你现在是专业新闻查询AI助手，根据用户提供的需求查询新闻。请严格按照以下步骤操作：1.对用户提供的查询需求进行分析；2.输出分析结果；3.对新闻查询给予回应或建议；4.最后必须输出XiaoR://NewsInquiry?URL=https://yunzhiapi.cn/API/txxwtt.php?page=用户要查询的数量&type=text来发起新闻API请求。';
            }
            
            // 根据选择的AI模型构建请求（统一使用GET请求格式）
            const selectedModel = aiModelSelect.value;
            let apiUrl;
            
            switch(selectedModel) {
                case 'deepseek':
                    apiUrl = `https://yunzhiapi.cn/API/depsek3.2.php?question=${encodeURIComponent(question)}&system=${encodeURIComponent(systemMessage)}`;
                    break;
                case 'claude':
                    apiUrl = `https://yunzhiapi.cn/API/doubao.php?question=${encodeURIComponent(question)}&system=${encodeURIComponent(systemMessage)}`;
                    break;
                case 'yuanbao':
                    apiUrl = `https://yunzhiapi.cn/API/yuanbao.php?question=${encodeURIComponent(question)}&system=${encodeURIComponent(systemMessage)}`;
                    break;
                case 'qwen3':
                    apiUrl = `https://yunzhiapi.cn/API/qwen3.php?question=${encodeURIComponent(question)}&system=${encodeURIComponent(systemMessage)}`;
                    break;
                case 'ling':
                    apiUrl = `https://yunzhiapi.cn/API/ling-1t.php?question=${encodeURIComponent(question)}&system=${encodeURIComponent(systemMessage)}`;
                    break;
                case 'gemini':
                    apiUrl = `https://yunzhiapi.cn/API/gemini2.5/index.php?question=${encodeURIComponent(question)}&system=${encodeURIComponent(systemMessage)}`;
                    break;
                case 'xiaomi':
                    apiUrl = `https://yunzhiapi.cn/API/xiaomi/index.php?question=${encodeURIComponent(question)}&system=${encodeURIComponent(systemMessage)}`;
                    break;
                case 'custom':
                    const customUrl = customModelUrl.value;
                    if (customUrl) {
                        apiUrl = customUrl.replace('%提问内容%', encodeURIComponent(question)).replace('%联想词%', encodeURIComponent(systemMessage));
                    } else {
                        throw new Error('自定义模型URL未设置');
                    }
                    break;
                case 'glm':
                    // GLM模型特殊处理
                    apiUrl = `https://api.52vmy.cn/api/chat/glm?msg=${encodeURIComponent(question + '。提示词是：' + systemMessage)}`;
                    break;
                default:
                    apiUrl = `https://yunzhiapi.cn/API/depsek3.2.php?question=${encodeURIComponent(question)}&system=${encodeURIComponent(systemMessage)}`;
            }
            
            // 发送请求到AI API
            try {
                // 统一使用GET请求
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态: ${response.status}`);
                }
                const result = await response.text();
                
                // 移除正在思考的消息，然后处理响应
                removeThinkingMessage(thinkingMessageId);
                handleAIResponse(result, question);
            } catch (apiError) {
                console.error('API请求失败:', apiError);
                // 移除正在思考的消息，然后显示错误
                removeThinkingMessage(thinkingMessageId);
                addMessageToHistory(`API请求失败: ${apiError.message}`, false);
                sendButton.innerHTML = '<i class="fa-solid fa-paper-plane fa-rotate-270 fa-xl" style="color: #ffffff;"></i>';
                sendButton.disabled = false;
            }
        } catch (error) {
            console.error('发送到AI时出错:', error);
            addMessageToHistory('抱歉，发送到AI时出现了错误：' + error.message, false);
            sendButton.innerHTML = '<i class="fa-solid fa-paper-plane fa-rotate-270 fa-xl" style="color: #ffffff;"></i>';
            sendButton.disabled = false;
        }
    } catch (error) {
        console.error('发送到AI时出错:', error);
        addMessageToHistory('抱歉，发送到AI时出现了错误。', false);
        sendButton.innerHTML = '<i class="fa-solid fa-paper-plane fa-rotate-270 fa-xl" style="color: #ffffff;"></i>';
        sendButton.disabled = false;
    }
}

// 解析markdown格式
function parseMarkdown(text) {
    // 简单的markdown解析
    let parsed = text;
    
    // 处理粗体 **text**
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 处理斜体 *text*
    parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 处理链接 [text](url)
    parsed = parsed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // 处理换行
    parsed = parsed.replace(/\n/g, '<br>');
    
    return parsed;
}

// 切换技能菜单显示
function toggleSkillMenu() {
    if (skillMenu.style.display === 'none' || !skillMenu.style.display) {
        skillMenu.style.display = 'flex';
    } else {
        skillMenu.style.display = 'none';
    }
}

// 切换技能模式
function toggleSkillMode(mode, name) {
    if (activeSkillMode === mode) {
        activeSkillMode = null;
        showNotification(`已取消${name}模式`);
    } else {
        activeSkillMode = mode;
        showNotification(`已切换到${name}模式`);
    }
    skillMenu.style.display = 'none';
}

// 显示通知
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'voice-input-alert';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}



// 保存设置
function saveSettings() {
    const settings = {
        contextCount: contextSelect.value,
        voiceEnabled: voiceToggle.checked,
        voiceType: voiceTypeSelect.value,
        aiModel: aiModelSelect.value,
        theme: themeSelect.value,
        animationOutput: document.getElementById('animationOutputToggle').checked,
        customModelUrl: customModelUrl.value
    };
    
    localStorage.setItem('xiaor-sidepanel-settings', JSON.stringify(settings));
    showNotification('设置已保存');
    
    // 应用主题设置
    applyTheme(settings.theme);
}

// 应用主题
function applyTheme(theme) {
    const body = document.body;
    
    if (theme === 'dark') {
        body.classList.add('dark-theme');
    } else if (theme === 'light') {
        body.classList.remove('dark-theme');
    } else {
        // 如果没有指定主题，则根据系统偏好设置
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }
    }
}

// 加载设置
function loadSettings() {
    const savedSettings = localStorage.getItem('xiaor-sidepanel-settings');
    
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        if (settings.contextCount) contextSelect.value = settings.contextCount;
        if (settings.voiceEnabled !== undefined) voiceToggle.checked = settings.voiceEnabled;
        if (settings.voiceType) voiceTypeSelect.value = settings.voiceType;
        if (settings.aiModel) aiModelSelect.value = settings.aiModel;
        if (settings.theme) themeSelect.value = settings.theme;
        if (settings.animationOutput !== undefined) document.getElementById('animationOutputToggle').checked = settings.animationOutput;
        if (settings.customModelUrl) customModelUrl.value = settings.customModelUrl;
        
        // 根据设置显示/隐藏相关元素
        if (settings.voiceEnabled) {
            voiceTypeSetting.style.display = 'block';
        }
                        
        if (settings.aiModel === 'custom') {
            customModelSettings.style.display = 'block';
        }
        
        // 应用主题设置
        applyTheme(settings.theme);
    } else {
        // 默认应用主题（跟随系统）
        applyTheme(null);
    }
}



// 处理AI响应
function handleAIResponse(response, originalQuestion) {
    try {
        // 检查响应是否为空
        if (!response || response.trim() === '') {
            addMessageToHistory('AI未返回有效内容，请稍后重试或尝试其他模型', false);
            return;
        }
        
        // 检查响应是否包含特殊协议
        const requestProtocolRegex = /XiaoR:\/\/Request\?URL=([\s\S]*)/;
        const weatherProtocolRegex = /XiaoR:\/\/GetWeather\?URL=([^\s]+)/;
        const ocrProtocolRegex = /XiaoR:\/\/OCR\?URL=([\s\S]*)/;
        const newsProtocolRegex = /XiaoR:\/\/NewsInquiry\?URL=([\s\S]*)/;
        
        const requestMatch = response.match(requestProtocolRegex);
        const weatherMatch = response.match(weatherProtocolRegex);
        const ocrMatch = response.match(ocrProtocolRegex);
        const newsMatch = response.match(newsProtocolRegex);
        
        if (requestMatch) {
            // 图片生成请求
            const requestUrl = requestMatch[1].trim();
            const aiResponseWithoutProtocol = response.replace(requestProtocolRegex, '').trim();
            
            // 显示AI的原始响应
            if (aiResponseWithoutProtocol) {
                addMessageToHistory(aiResponseWithoutProtocol, false);
            }
            
            // 显示正在生成的提示
            const loadingMessageId = 'api-request-' + Date.now();
            addMessageToHistory('图片正在生成中...', false, loadingMessageId);
            
            // 发起API请求
            fetch(requestUrl)
                .then(apiResponse => apiResponse.text())
                .then(apiResult => {
                    // 检查结果是否为图片链接
                    const isImageUrl = apiResult.trim().endsWith('.jpg') || 
                                      apiResult.trim().endsWith('.jpeg') || 
                                      apiResult.trim().endsWith('.png') || 
                                      apiResult.trim().endsWith('.gif') || 
                                      apiResult.trim().endsWith('.webp');
                    
                    if (isImageUrl) {
                        const imgHtml = `<img src="${apiResult}" alt="生成的图片" style="max-width: 100%; height: auto; border-radius: 8px; margin-top: 10px; cursor: pointer;" onclick="showImageModal('${apiResult}')">`;
                        const resultMessage = `图片生成成功！<br>${imgHtml}<br><small>图片链接：<a href="${apiResult}" target="_blank">${apiResult}</a></small>`;
                        updateMessageContent(loadingMessageId, resultMessage);
                    } else {
                        const resultMessage = `图片生成成功！图片链接：${apiResult}`;
                        updateMessageContent(loadingMessageId, resultMessage);
                    }
                })
                .catch(error => {
                    console.error('API请求失败:', error);
                    updateMessageContent(loadingMessageId, `API请求失败: ${error.message}`);
                });
        } else if (weatherMatch) {
            // 天气查询请求
            const weatherUrl = weatherMatch[1].trim();
            const aiResponseWithoutProtocol = response.replace(weatherProtocolRegex, '').trim();
            
            // 显示AI的原始响应
            if (aiResponseWithoutProtocol) {
                addMessageToHistory(aiResponseWithoutProtocol, false);
            }
            
            // 显示正在查询的提示
            const loadingMessageId = 'weather-request-' + Date.now();
            addMessageToHistory('天气正在查询中...', false, loadingMessageId);
            
            // 发起天气API请求
            fetch(weatherUrl)
                .then(weatherResponse => {
                    if (!weatherResponse.ok) {
                        throw new Error(`天气API请求失败: ${weatherResponse.status} ${weatherResponse.statusText}`);
                    }
                    return weatherResponse.json();
                })
                .then(weatherData => {
                    if (weatherData && weatherData.main) {
                        const cityName = weatherData.name || '未知城市';
                        const country = weatherData.sys ? weatherData.sys.country : '';
                        const temperature = Math.round(weatherData.main.temp - 273.15);
                        const feelsLike = Math.round(weatherData.main.feels_like - 273.15);
                        const humidity = weatherData.main.humidity;
                        const description = weatherData.weather && weatherData.weather[0] ? weatherData.weather[0].description : '未知';
                        const windSpeed = weatherData.wind ? weatherData.wind.speed : '未知';
                        
                        const weatherInfo = `
🏙️ 城市: ${cityName}${country ? ` (${country})` : ''}
🌡️ 温度: ${temperature}°C (体感 ${feelsLike}°C)
☁️ 天气: ${description}
💧 湿度: ${humidity}%
💨 风速: ${windSpeed} m/s`;
                        
                        const resultMessage = `🌤️ 天气查询成功！${weatherInfo}`;
                        updateMessageContent(loadingMessageId, resultMessage);
                    } else {
                        updateMessageContent(loadingMessageId, '天气查询失败：未获取到有效数据');
                    }
                })
                .catch(error => {
                    console.error('天气API请求失败:', error);
                    updateMessageContent(loadingMessageId, `天气查询失败: ${error.message}`);
                });
        } else if (ocrMatch) {
            // OCR识别请求
            const ocrUrl = ocrMatch[1].trim();
            const aiResponseWithoutProtocol = response.replace(ocrProtocolRegex, '').trim();
            
            // 显示AI的原始响应
            if (aiResponseWithoutProtocol) {
                addMessageToHistory(aiResponseWithoutProtocol, false);
            }
            
            // 显示正在识别的提示
            const loadingMessageId = 'ocr-request-' + Date.now();
            addMessageToHistory('正在获取文字...', false, loadingMessageId);
            
            // 发起OCR API请求
            fetch(ocrUrl)
                .then(ocrResponse => ocrResponse.text())
                .then(ocrResult => {
                    const resultMessage = `OCR识别成功！\n\n${ocrResult}`;
                    updateMessageContent(loadingMessageId, resultMessage);
                })
                .catch(error => {
                    console.error('OCR API请求失败:', error);
                    updateMessageContent(loadingMessageId, `OCR识别失败: ${error.message}`);
                });
        } else if (newsMatch) {
            // 新闻查询请求
            const newsUrl = newsMatch[1].trim();
            const aiResponseWithoutProtocol = response.replace(newsProtocolRegex, '').trim();
            
            // 显示AI的原始响应
            if (aiResponseWithoutProtocol) {
                addMessageToHistory(aiResponseWithoutProtocol, false);
            }
            
            // 显示正在查询的提示
            const loadingMessageId = 'news-request-' + Date.now();
            addMessageToHistory('新闻正在查询中...', false, loadingMessageId);
            
            // 发起新闻API请求
            fetch(newsUrl)
                .then(newsResponse => newsResponse.text())
                .then(newsResult => {
                    try {
                        const newsData = JSON.parse(newsResult);
                        if (newsData.status === 'success' && newsData.data && Array.isArray(newsData.data)) {
                            let formattedNews = '📰 新闻查询成功！\n\n';
                            newsData.data.forEach((article, index) => {
                                formattedNews += `新闻${index + 1}：${article.title}\n`;
                                formattedNews += `链接：${article.url}\n`;
                                if (index < newsData.data.length - 1) {
                                    formattedNews += '\n';
                                }
                            });
                            updateMessageContent(loadingMessageId, formattedNews);
                        } else {
                            const resultMessage = `📰 新闻查询成功！\n\n${newsResult}`;
                            updateMessageContent(loadingMessageId, resultMessage);
                        }
                    } catch (parseError) {
                        const resultMessage = `📰 新闻查询成功！\n\n${newsResult}`;
                        updateMessageContent(loadingMessageId, resultMessage);
                    }
                })
                .catch(error => {
                    console.error('新闻API请求失败:', error);
                    updateMessageContent(loadingMessageId, `新闻查询失败: ${error.message}`);
                });
        } else {
            // 普通AI响应
            addMessageToHistory(response, false);
        }
        
        // 恢复发送按钮
        sendButton.innerHTML = '<i class="fa-solid fa-paper-plane fa-rotate-270 fa-xl" style="color: #ffffff;"></i>';
        sendButton.disabled = false;
    } catch (error) {
        console.error('处理AI响应时出错:', error);
        addMessageToHistory('处理AI响应时出现错误：' + error.message, false);
        sendButton.innerHTML = '<i class="fa-solid fa-paper-plane fa-rotate-270 fa-xl" style="color: #ffffff;"></i>';
        sendButton.disabled = false;
    }
}

// 更新消息内容
function updateMessageContent(messageId, newContent) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        messageElement.innerHTML = parseMarkdown(newContent);
    }
}

// 移除消息
function removeThinkingMessage(messageId) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        messageElement.remove();
    }
}

// 显示图片模态框
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
            const modalImg = document.getElementById('modalImage');
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