const readline = require('readline');
const fetch = require('node-fetch');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// AI模型配置
const aiModels = {
  '1': {
    name: 'DeepseekV3.2',
    endpoint: 'https://api.jkyai.top/API/depsek3.2.php'
  },
  '2': {
    name: '豆包 (Doubao)',
    endpoint: 'https://api.jkyai.top/API/doubao.php'
  },
  '3': {
    name: '腾讯元宝',
    endpoint: 'https://api.jkyai.top/API/yuanbao.php'
  },
  '4': {
    name: 'Qwen3',
    endpoint: 'https://api.jkyai.top/API/qwen3.php'
  },
  '5': {
    name: '蚂蚁Ling2.0',
    endpoint: 'https://api.jkyai.top/API/ling-1t.php'
  },
  '6': {
    name: 'Gemini-2.5',
    endpoint: 'https://api.jkyai.top/API/gemini2.5/index.php'
  }
};

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function testSingleModel(apiEndpoint, userMessage, systemPrompt) {
  try {
    const params = new URLSearchParams({
      question: userMessage,
      system: systemPrompt
    });
    const requestUrl = `${apiEndpoint}?${params.toString()}`;
    
    const startTime = Date.now();
    
    // 创建一个超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时')), 20000); // 20秒超时
    });
    
    // 使用Promise.race来设置超时
    const response = await Promise.race([
      fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }),
      timeoutPromise
    ]);
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }
    
    const resultText = await response.text();
    
    return {
      success: true,
      response: resultText,
      responseTime: responseTime,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      responseTime: -1
    };
  }
}

async function testAllModels(userMessage, systemPrompt) {
  console.log('\n=== 测试所有AI模型 ===\n');
  
  for (const [key, model] of Object.entries(aiModels)) {
    console.log(`正在测试 ${model.name}...`);
    
    const result = await testSingleModel(model.endpoint, userMessage, systemPrompt);
    
    if (result.success) {
      console.log(`✓ ${model.name} - 响应时间: ${result.responseTime}ms`);
      console.log(`  响应长度: ${result.response.length} 字符`);
      console.log(`  状态码: ${result.status}\n`);
    } else {
      console.log(`✗ ${model.name} - 错误: ${result.error}\n`);
    }
  }
}

async function performanceTest(modelKey, userMessage, systemPrompt, iterations = 3) {
  console.log(`\n=== ${aiModels[modelKey].name} 性能测试 (${iterations} 次请求) ===\n`);
  
  const responseTimes = [];
  
  for (let i = 0; i < iterations; i++) {
    console.log(`请求 ${i + 1}/${iterations}...`);
    
    const result = await testSingleModel(aiModels[modelKey].endpoint, userMessage, systemPrompt);
    
    if (result.success) {
      responseTimes.push(result.responseTime);
      console.log(`  响应时间: ${result.responseTime}ms`);
    } else {
      console.log(`  错误: ${result.error}`);
    }
  }
  
  if (responseTimes.length > 0) {
    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minTime = Math.min(...responseTimes);
    const maxTime = Math.max(...responseTimes);
    
    console.log(`\n=== 性能统计 ===`);
    console.log(`平均响应时间: ${avgTime.toFixed(2)}ms`);
    console.log(`最短响应时间: ${minTime}ms`);
    console.log(`最长响应时间: ${maxTime}ms`);
    console.log(`成功请求数: ${responseTimes.length}/${iterations}`);
  }
}

async function advancedTest() {
  console.log('=== 小R AI助手 - AI模型测试 ===\n');
  
  console.log('测试模式:');
  console.log('1. 单个模型测试');
  console.log('2. 所有模型测试');
  console.log('3. 性能测试');
  console.log('4. 自定义API端点测试\n');
  
  const mode = await askQuestion('请选择测试模式 (1-4): ');
  
  // 显示AI模型选项
  console.log('\n可选的AI模型：');
  for (const [key, model] of Object.entries(aiModels)) {
    console.log(`${key}. ${model.name}`);
  }
  console.log(`${Object.keys(aiModels).length + 1}. 自定义API端点\n`);
  
  let apiEndpoint, modelName;
  
  if (mode !== '2') { // 非"所有模型测试"模式
    const modelChoice = await askQuestion('请选择AI模型 (1-' + Object.keys(aiModels).length + '): ');
    
    if (parseInt(modelChoice) === Object.keys(aiModels).length + 1) {
      apiEndpoint = await askQuestion('请输入自定义API端点: ');
      modelName = '自定义模型';
    } else if (aiModels[modelChoice]) {
      apiEndpoint = aiModels[modelChoice].endpoint;
      modelName = aiModels[modelChoice].name;
    } else {
      console.log('无效选择，使用默认模型 DeepseekV3.2');
      apiEndpoint = aiModels['1'].endpoint;
      modelName = aiModels['1'].name;
    }
  }
  
  // 获取用户消息
  const userMessage = await askQuestion('\n请输入要发送的消息: ') || '你好，请简单介绍一下自己。';
  
  // 获取系统提示词
  const systemPrompt = await askQuestion('\n请输入系统提示词 (可选，直接回车使用默认): ') || 
    '你是Ruanm开发的小R-Ai助手，专注于帮用户解决各种难题、聊天。';
  
  console.log('\n=== 测试配置 ===');
  console.log(`测试模式: ${mode}`);
  if (mode !== '2') {
    console.log(`AI模型: ${modelName}`);
    console.log(`API端点: ${apiEndpoint}`);
  }
  console.log(`用户消息: ${userMessage}`);
  console.log(`系统提示词: ${systemPrompt}\n`);
  
  switch (mode) {
    case '1': // 单个模型测试
      console.log(`正在测试 ${modelName}...`);
      const result = await testSingleModel(apiEndpoint, userMessage, systemPrompt);
      
      if (result.success) {
        console.log('=== 测试结果 ===');
        console.log(`响应时间: ${result.responseTime}ms`);
        console.log(`状态码: ${result.status}`);
        console.log('\n=== AI响应 ===');
        console.log(result.response);
      } else {
        console.log('=== 测试失败 ===');
        console.log(`错误: ${result.error}`);
      }
      break;
      
    case '2': // 所有模型测试
      await testAllModels(userMessage, systemPrompt);
      break;
      
    case '3': // 性能测试
      const iterations = await askQuestion('请输入测试迭代次数 (默认3次): ') || '3';
      await performanceTest('1', userMessage, systemPrompt, parseInt(iterations));
      break;
      
    case '4': // 自定义API端点测试
      console.log(`正在测试 ${modelName}...`);
      const customResult = await testSingleModel(apiEndpoint, userMessage, systemPrompt);
      
      if (customResult.success) {
        console.log('=== 测试结果 ===');
        console.log(`响应时间: ${customResult.responseTime}ms`);
        console.log(`状态码: ${customResult.status}`);
        console.log('\n=== AI响应 ===');
        console.log(customResult.response);
      } else {
        console.log('=== 测试失败 ===');
        console.log(`错误: ${customResult.error}`);
      }
      break;
      
    default:
      console.log('无效的测试模式');
  }
  
  rl.close();
}

// 运行高级测试
advancedTest().catch(console.error);