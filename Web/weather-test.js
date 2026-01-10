// 天气API测试功能
async function testWeatherAPI(apiKey, city) {
    try {
        // 构建天气API请求URL
        const weatherUrl = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        
        console.log('正在请求天气数据...');
        console.log('请求URL:', weatherUrl);
        
        // 发起API请求
        const response = await fetch(weatherUrl);
        const data = await response.json();
        
        if (response.ok) {
            // 解析并显示天气信息
            console.log('天气数据获取成功！');
            console.log('城市:', data.name);
            console.log('国家:', data.sys.country);
            console.log('温度:', data.main.temp + '°C');
            console.log('体感温度:', data.main.feels_like + '°C');
            console.log('天气描述:', data.weather[0].description);
            console.log('湿度:', data.main.humidity + '%');
            console.log('风速:', data.wind.speed + ' m/s');
            
            // 返回格式化的天气信息
            const weatherInfo = {
                city: data.name,
                country: data.sys.country,
                temperature: data.main.temp,
                feelsLike: data.main.feels_like,
                description: data.weather[0].description,
                humidity: data.main.humidity,
                windSpeed: data.wind.speed
            };
            
            return weatherInfo;
        } else {
            console.error('API请求失败:', data.message);
            throw new Error(data.message || '天气API请求失败');
        }
    } catch (error) {
        console.error('获取天气数据时发生错误:', error.message);
        throw error;
    }
}

// 在浏览器环境中使用时的简单界面函数
function createWeatherTestUI() {
    // 创建测试界面元素
    const testContainer = document.createElement('div');
    testContainer.id = 'weather-test-container';
    testContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--bg-color, white);
        color: var(--text-color, #333);
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        width: 400px;
        max-width: 90vw;
    `;
    
    try {
        testContainer.innerHTML = `
            <h3 style="margin-top: 0; text-align: center; color: var(--text-color, #333);">天气API测试</h3>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: var(--text-color, #333);">API密钥:</label>
                <input type="password" id="apiKeyInput" placeholder="输入您的API密钥" style="width: 100%; padding: 8px; border: 1px solid var(--border-color, #ddd); border-radius: 4px; background: var(--input-bg, #fff); color: var(--text-color, #333);">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: var(--text-color, #333);">城市名称 (拼音):</label>
                <input type="text" id="cityInput" placeholder="例如: Beijing, Shanghai" style="width: 100%; padding: 8px; border: 1px solid var(--border-color, #ddd); border-radius: 4px; background: var(--input-bg, #fff); color: var(--text-color, #333);">
            </div>
            <div style="margin-bottom: 15px;">
                <button id="testWeatherBtn" style="width: 100%; padding: 10px; background: var(--primary-color, #4a90e2); color: var(--button-text-color, white); border: none; border-radius: 4px; cursor: pointer;">
                    测试天气API
                </button>
            </div>
            <div id="weatherResult" style="margin-top: 15px; padding: 10px; background: var(--result-bg, #f5f5f5); border-radius: 4px; display: none; color: var(--text-color, #333);"></div>
            <div style="margin-top: 10px; text-align: center;">
                <button id="closeTestBtn" style="padding: 5px 10px; background: var(--secondary-color, #ccc); color: var(--button-text-color, #333); border: none; border-radius: 4px; cursor: pointer;">关闭</button>
            </div>
        `;
    } catch (error) {
        console.error('设置天气测试界面时出错:', error);
        return;
    }
    
    if (document && document.body) {
        document.body.appendChild(testContainer);
    } else {
        console.error('文档对象未准备好，无法添加天气测试界面');
        return;
    }
    
    // 更新测试容器以匹配当前主题
    function updateTheme() {
        if (document.body.classList.contains('dark-theme')) {
            // 深色主题样式
            testContainer.style.setProperty('--bg-color', '#2d2d2d');
            testContainer.style.setProperty('--text-color', '#ffffff');
            testContainer.style.setProperty('--border-color', '#555');
            testContainer.style.setProperty('--input-bg', '#3c3c3c');
            testContainer.style.setProperty('--result-bg', '#3c3c3c');
            testContainer.style.setProperty('--primary-color', '#007acc');
            testContainer.style.setProperty('--secondary-color', '#555');
            testContainer.style.setProperty('--button-text-color', '#ffffff');
            testContainer.style.setProperty('--error-color', '#ff6b6b');
        } else {
            // 浅色主题样式
            testContainer.style.setProperty('--bg-color', '#ffffff');
            testContainer.style.setProperty('--text-color', '#333333');
            testContainer.style.setProperty('--border-color', '#ddd');
            testContainer.style.setProperty('--input-bg', '#fff');
            testContainer.style.setProperty('--result-bg', '#f5f5f5');
            testContainer.style.setProperty('--primary-color', '#4a90e2');
            testContainer.style.setProperty('--secondary-color', '#ccc');
            testContainer.style.setProperty('--button-text-color', '#333');
            testContainer.style.setProperty('--error-color', 'red');
        }
    }
    
    // 初始设置主题
    updateTheme();
    
    // 监听主题变化
    const themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                updateTheme();
            }
        });
    });
    
    themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
    
    // 绑定事件
    const testWeatherBtn = document.getElementById('testWeatherBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const cityInput = document.getElementById('cityInput');
    const closeTestBtn = document.getElementById('closeTestBtn');
    
    if (testWeatherBtn) {
        testWeatherBtn.addEventListener('click', async () => {
            const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
            const city = cityInput ? cityInput.value.trim() : '';
            
            if (!apiKey || !city) {
                console.log('请填写完整的API密钥和城市名称');
                const resultDiv = document.getElementById('weatherResult');
                if (resultDiv) {
                    resultDiv.innerHTML = '<p style="color: var(--error-color, red);">请填写完整的API密钥和城市名称</p>';
                }
                return;
            }
            
            const resultDiv = document.getElementById('weatherResult');
            if (resultDiv) {
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = '正在获取天气数据...';
            }
            
            try {
                const weatherData = await testWeatherAPI(apiKey, city);
                if (resultDiv) {
                    resultDiv.innerHTML = `
                        <h4 style="color: var(--text-color, #333);">天气信息</h4>
                        <p style="color: var(--text-color, #333);"><strong>城市:</strong> ${weatherData.city} (${weatherData.country})</p>
                        <p style="color: var(--text-color, #333);"><strong>温度:</strong> ${weatherData.temperature}°C (体感 ${weatherData.feelsLike}°C)</p>
                        <p style="color: var(--text-color, #333);"><strong>天气:</strong> ${weatherData.description}</p>
                        <p style="color: var(--text-color, #333);"><strong>湿度:</strong> ${weatherData.humidity}%</p>
                        <p style="color: var(--text-color, #333);"><strong>风速:</strong> ${weatherData.windSpeed} m/s</p>
                    `;
                }
            } catch (error) {
                if (resultDiv) {
                    resultDiv.innerHTML = `<p style="color: var(--error-color, red);">错误: ${error.message}</p>`;
                }
            }
        });
    }
    
    if (closeTestBtn) {
        closeTestBtn.addEventListener('click', () => {
            if (testContainer && testContainer.parentNode) {
                testContainer.parentNode.removeChild(testContainer);
            }
        });
    }
}

// 如果在浏览器环境中，添加一个触发测试的函数
if (typeof window !== 'undefined') {
    // 检查是否在Electron环境中
    if (window && window.process && window.process.type) {
        // 在Electron环境中，安全地暴露函数
        window.openWeatherTest = function() {
            try {
                createWeatherTestUI();
            } catch (error) {
                console.error('打开天气测试界面时出错:', error);
            }
        };
    } else {
        // 在普通浏览器环境中
        window.openWeatherTest = createWeatherTestUI;
    }
}

// 导出函数以供其他模块使用（如果支持模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testWeatherAPI,
        createWeatherTestUI
    };
}