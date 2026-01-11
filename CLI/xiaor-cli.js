#!/usr/bin/env node

/**
 * XiaoR CLI - 小R AI助手命令行工具
 * 
 * 独立于主程序运行，提供桌面版的完整功能体验
 * 功能:
 * - 与AI模型直接交互
 * - 支持多种AI模型
 * - 管理对话历史
 * - 导出聊天记录
 * - 查看系统信息
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { stdin: input, stdout: output } = require('process');
const https = require('https');

// 引入美化CLI界面的库
const chalk = require('chalk');
const gradient = require('gradient-string');
const ora = require('ora');
const figlet = require('figlet');
const inquirer = require('inquirer');
const boxen = require('boxen');

// CLI版本
const VERSION = '1.0.0';

// 支持的AI模型API端点
const MODEL_ENDPOINTS = {
  'deepseek': 'https://yunzhiapi.cn/API/depsek3.2.php',  // DeepseekV3.2
  'doubao': 'https://yunzhiapi.cn/API/doubao.php',      // 豆包
  'yuanbao': 'https://yunzhiapi.cn/API/yuanbao.php',    // 腾讯元宝
  'qwen3': 'https://yunzhiapi.cn/API/qwen3.php',       // Qwen3
  'ling': 'https://yunzhiapi.cn/API/ling-1t.php',      // 蚂蚁Ling2.0
  'gemini': 'https://yunzhiapi.cn/API/gemini2.5/index.php', // Gemini-2.5
  'xiaomi': 'https://yunzhiapi.cn/API/xiaomi/index.php', // 小米MiMo-V2
  'glm': 'https://api.52vmy.cn/api/chat/glm'           // GLM
};

// 当前选中的模型
let currentModel = 'deepseek';

// 对话历史
let conversationHistory = [];

// 显示帮助信息
function showHelp() {
  const gradientTitle = gradient(['#ff6b6b', '#4ecdc4', '#45b7d1']).multiline([
    '╔══════════════════════════════════════╗',
    '║        小R AI助手命令行工具           ║',
    '║              (XiaoR CLI)            ║',
    '╚══════════════════════════════════════╝'
  ]);
  
  console.log(gradientTitle);
  
  const helpText = `
${chalk.bold.blue('用法:')}
  ${chalk.cyan('xiaor-cli [command]')}

${chalk.bold.blue('命令:')}
  ${chalk.green('chat')}                 启动交互式聊天模式
  ${chalk.green('model [name]')}         切换AI模型 (deepseek, doubao, yuanbao, qwen3, ling, gemini, xiaomi, glm)
  ${chalk.green('list-models')}          列出所有支持的AI模型
  ${chalk.green('history')}              显示对话历史
  ${chalk.green('clear-history')}        清空对话历史
  ${chalk.green('export [format]')}      导出对话历史 (json, txt, md)
  ${chalk.green('version')}              显示版本号
  ${chalk.green('help')}                 显示此帮助信息

${chalk.bold.blue('选项:')}
  ${chalk.yellow('--model [name]')}       指定AI模型
  ${chalk.yellow('--format [format]')}    指定导出格式 (json, txt, md)
  ${chalk.yellow('--output [path]')}      指定导出路径，默认为当前目录

${chalk.bold.blue('示例:')}
  ${chalk.cyan('xiaor-cli chat')}
  ${chalk.cyan('xiaor-cli model xiaomi')}
  ${chalk.cyan('xiaor-cli chat --model glm')}
  ${chalk.cyan('xiaor-cli export md --output ./exports/')}
  ${chalk.cyan('xiaor-cli history')}
  `;
  
  console.log(helpText);
}

// 显示版本号
function showVersion() {
  const versionGradient = gradient(['#ff9a00', '#ff6a00', '#ff3c00']);
  console.log(versionGradient(`XiaoR CLI v${VERSION}`));
}

// 列出所有支持的模型
function listModels() {
  const titleGradient = gradient(['#ff6b6b', '#4ecdc4']);
  console.log(titleGradient('支持的AI模型:'));
  for (const [key, value] of Object.entries(MODEL_ENDPOINTS)) {
    console.log(`${chalk.magenta('-')} ${chalk.green(key)}: ${chalk.yellow(value)}`);
  }
}

// 切换AI模型
function setModel(modelName) {
  if (MODEL_ENDPOINTS[modelName]) {
    currentModel = modelName;
    console.log(chalk.green(`✓ 已切换到模型: ${chalk.bold(modelName)}`));
  } else {
    console.error(chalk.red(`✗ 错误: 不支持的模型 "${modelName}"`));
    console.log(chalk.yellow('支持的模型:'), chalk.cyan(Object.keys(MODEL_ENDPOINTS).join(', ')));
  }
}

// 显示对话历史
function showHistory() {
  if (conversationHistory.length === 0) {
    console.log(chalk.yellow('暂无对话历史'));
    return;
  }

  const titleGradient = gradient(['#4ecdc4', '#45b7d1']);
  console.log(titleGradient('对话历史:'));
  conversationHistory.forEach((entry, index) => {
    const roleColor = entry.role === 'user' ? chalk.blue : chalk.green;
    const roleText = entry.role === 'user' ? '用户' : 'AI';
    console.log(`${chalk.cyan(`${index + 1}.`)} [${chalk.gray(entry.timestamp)}] ${roleColor(roleText)}: ${entry.content.substring(0, 50)}${entry.content.length > 50 ? chalk.gray('...') : ''}`);
  });
}

// 清空对话历史
function clearHistory() {
  conversationHistory = [];
  console.log(chalk.green('✓ 对话历史已清空'));
}

// 导出对话历史
function exportHistory(format, outputPath) {
  if (conversationHistory.length === 0) {
    console.log(chalk.yellow('暂无对话历史可导出'));
    return;
  }

  const exportPath = outputPath || './';
  
  // 确保输出目录存在
  if (!fs.existsSync(exportPath)) {
    fs.mkdirSync(exportPath, { recursive: true });
  }

  let exportData = '';
  let fileName = '';

  switch (format.toLowerCase()) {
    case 'json':
      exportData = JSON.stringify(conversationHistory, null, 2);
      fileName = `xiaor-conversation-${Date.now()}.json`;
      break;

    case 'txt':
      exportData = conversationHistory.map(entry => {
        return `[${entry.timestamp}] ${entry.role}: ${entry.content}`;
      }).join('\n');
      fileName = `xiaor-conversation-${Date.now()}.txt`;
      break;

    case 'md':
      exportData = '# XiaoR AI助手对话记录\n\n';
      exportData += conversationHistory.map(entry => {
        return `### [${entry.timestamp}] ${entry.role}

${entry.content}

---

`;
      }).join('');
      fileName = `xiaor-conversation-${Date.now()}.md`;
      break;

    default:
      console.error(chalk.red(`✗ 不支持的导出格式: ${format}`));
      return;
  }

  const filePath = path.join(exportPath, fileName);
  fs.writeFileSync(filePath, exportData);

  console.log(chalk.green(`✓ 对话历史已导出到: ${chalk.bold(filePath)}`));
}

// 发送请求到AI模型
function sendToAI(question, systemPrompt = '') {
  return new Promise((resolve, reject) => {
    const endpoint = MODEL_ENDPOINTS[currentModel];
    if (!endpoint) {
      reject(new Error(`不支持的模型: ${currentModel}`));
      return;
    }

    // 替换系统提示词中的变量
    const processedSystemPrompt = systemPrompt.replace(/\$MODEL_NAME/g, currentModel);

    // GLM模型使用不同的API格式
    if (currentModel === 'glm') {
      const glmUrl = `${endpoint}?msg=${encodeURIComponent(question + '。提示词是：' + processedSystemPrompt)}&type=text`;
      
      https.get(glmUrl, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            // 尝试解析JSON响应
            const response = JSON.parse(data);
            if (response.content) {
              resolve(response.content);
            } else if (response.result) {
              resolve(response.result);
            } else {
              resolve(data);
            }
          } catch (e) {
            // 如果不是JSON格式，直接返回原始数据
            resolve(data);
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    } else {
      // 构建请求URL
      const url = new URL(endpoint);
      url.searchParams.append('question', question);
      url.searchParams.append('system', processedSystemPrompt);

      https.get(url.toString(), (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            // 尝试解析JSON响应
            const response = JSON.parse(data);
            if (response.content) {
              resolve(response.content);
            } else if (response.result) {
              resolve(response.result);
            } else {
              resolve(data);
            }
          } catch (e) {
            // 如果不是JSON格式，直接返回原始数据
            resolve(data);
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    }
  });
}

// 启动交互式聊天模式
async function startChat() {
  const welcomeGradient = gradient(['#ff6b6b', '#4ecdc4', '#45b7d1']);
  console.log(welcomeGradient(figlet.textSync('XiaoR CLI', { horizontalLayout: 'default', verticalLayout: 'default' })));
  console.log(chalk.bold.green(`欢迎使用小R AI助手CLI! 当前模型: ${currentModel}`));
  console.log(chalk.blue('输入 "exit" 或 "quit" 退出，输入 "help" 获取帮助'));

  // 创建readline接口
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // 定义处理输入的函数
  const processInput = async (input) => {
    const command = input.trim();

    if (command.toLowerCase() === 'exit' || command.toLowerCase() === 'quit') {
      console.log(chalk.green('再见!'));
      rl.close();
      return;
    }

    if (command.toLowerCase() === 'help') {
      console.log(chalk.yellow('命令: exit/quit - 退出, history - 查看历史, clear - 清空历史, model [name] - 切换模型'));
      showInputBox();
      return;
    }

    if (command.toLowerCase() === 'history') {
      showHistory();
      showInputBox();
      return;
    }

    if (command.toLowerCase() === 'clear') {
      clearHistory();
      console.log(chalk.green('历史已清空'));
      showInputBox();
      return;
    }

    if (command.toLowerCase().startsWith('model ')) {
      const modelName = command.split(' ')[1];
      setModel(modelName);
      showInputBox();
      return;
    }

    if (command === '') {
      showInputBox();
      return;
    }

    // 添加用户输入到历史记录
    conversationHistory.push({
      role: 'user',
      content: command,
      timestamp: new Date().toISOString()
    });

    // 显示AI正在思考的加载动画
    const spinner = ora({
      text: chalk.blue('AI正在思考中...'),
      spinner: 'clock'
    });
    spinner.start();

    try {
      // 构建系统提示词
      const systemPrompt = `你是Ruanm开发的小R-Ai助手，但是底层模型是$MODEL_NAME，专注于帮用户解决各种难题、聊天。现在正值中国农历新年，你可以向用户送上新年祝福，分享春节文化知识，或参与与春节相关的话题讨论。`;
      
      // 发送请求到AI
      const aiResponse = await sendToAI(command, systemPrompt);
      
      spinner.succeed();
      
      // 使用框样式显示AI回复
      try {
        console.log('\n' + boxen(`${chalk.green('AI回复:')}\n${aiResponse}`, {
          padding: 1,
          borderColor: 'blue',
          borderStyle: 'round'
        }));
      } catch (boxenError) {
        // 如果boxen不可用，使用简单的格式化输出
        console.log(`\n${chalk.bgBlueBright.black(' AI回复: ')}\n${aiResponse}\n`);
      }

      // 添加AI响应到历史记录
      conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      spinner.fail();
      console.error(chalk.red(`错误: ${error.message}`));
    }
    
    showInputBox();
  };

  // 定义显示输入框的函数
  const showInputBox = () => {
    process.stdout.write(chalk.bold.hex('#4A90E2')('┌─[') + chalk.bold.hex('#FFD700')(`模型: ${currentModel}`) + chalk.bold.hex('#4A90E2')(']') + '\n' + chalk.bold.hex('#4A90E2')('├─ ') + chalk.reset('> '));
  };

  // 监听行输入事件
  rl.on('line', processInput);
  
  // 监听关闭事件
  rl.on('close', () => {
    console.log(chalk.green('再见!'));
    process.exit(0);
  });

  // 显示初始输入框
  showInputBox();
}

// 解析命令行参数
function parseArgs(args) {
  const parsed = {
    command: null,
    options: {}
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const optionName = arg.substring(2);
      if (args[i + 1] && !args[i + 1].startsWith('--')) {
        parsed.options[optionName] = args[i + 1];
        i++; // 跳过下一个参数（因为它已被用作当前选项的值）
      } else {
        parsed.options[optionName] = true;
      }
    } else if (!parsed.command) {
      parsed.command = arg;
    }
  }

  return parsed;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  // 检查是否有--help参数
  if (parsed.options.help || parsed.command === 'help' || parsed.command === '--help' || parsed.command === '-h') {
    showHelp();
    return;
  }
  
  // 如果没有提供命令，默认执行chat命令
  if (!parsed.command) {
    parsed.command = 'chat';
  }
  
  switch (parsed.command) {
    case 'chat':
      if (parsed.options.model) {
        setModel(parsed.options.model);
      }
      await startChat();
      break;

    case 'model':
      if (args[1]) {
        setModel(args[1]);
      } else {
        console.log(`当前模型: ${currentModel}`);
      }
      break;

    case 'list-models':
      listModels();
      break;

    case 'history':
      showHistory();
      break;

    case 'clear-history':
      clearHistory();
      break;

    case 'export':
      const format = parsed.options.format || 'json';
      const outputPath = parsed.options.output || './';
      exportHistory(format, outputPath);
      break;

    case 'version':
    case '--version':
    case '-v':
      showVersion();
      break;

    case 'help':
    case '--help':
    case '-h':
    default:
      showHelp();
      break;
  }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  showHelp,
  showVersion,
  startChat,
  setModel,
  listModels,
  showHistory,
  clearHistory,
  exportHistory
};