const readline = require('readline');
const { spawn } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 测试脚本配置
const testScripts = {
  '1': {
    name: '基础AI模型测试',
    description: '测试单个AI模型，可选择模型、输入消息和提示词',
    script: 'test-ai.js'
  },
  '2': {
    name: '启动GUI测试',
    description: '启动主程序GUI进行功能测试',
    script: 'start-gui'
  },
  '3': {
    name: '天气API测试',
    description: '测试天气API功能，输入API密钥和城市名称',
    script: 'weather-test'
  }
};

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function runScript(scriptName) {
  return new Promise((resolve) => {
    if (scriptName === 'start-gui') {
      console.log('\n正在启动GUI测试...');
      console.log('----------------------------------------');
      
      // 启动Electron应用
      const child = spawn('npm', ['start'], { stdio: 'inherit' });
      
      child.on('close', (code) => {
        console.log('\nGUI测试已关闭');
        console.log('----------------------------------------');
        resolve();
      });
      
      child.on('error', (err) => {
        console.error('启动GUI时出错:', err.message);
        console.log('请确保已安装electron: npm install -g electron 或 npm install electron');
        resolve();
      });
    } else if (scriptName === 'weather-test') {
      console.log('\n正在启动天气API测试...');
      console.log('----------------------------------------');
      console.log('请在浏览器中打开 weather-test.html 页面进行测试');
      console.log('页面路径: ./weather-test.html');
      console.log('----------------------------------------');
      
      // 打开默认浏览器显示天气测试页面
      const { exec } = require('child_process');
      let command;
      
      // 根据操作系统选择命令
      if (process.platform === 'darwin') { // macOS
        command = 'open';
      } else if (process.platform === 'win32') { // Windows
        command = 'start';
      } else { // Linux
        command = 'xdg-open';
      }
      
      exec(`${command} weather-test.html`, (error) => {
        if (error) {
          console.log('自动打开浏览器失败，请手动打开 weather-test.html 文件');
        }
      });
      
      // 等待用户操作
      setTimeout(() => {
        resolve();
      }, 1000);
    } else {
      console.log(`\n正在运行 ${scriptName}...`);
      console.log('----------------------------------------');
      
      const child = spawn('node', [scriptName], { stdio: 'inherit' });
      
      child.on('close', (code) => {
        console.log(`\n${scriptName} 执行完成，退出码: ${code}`);
        console.log('----------------------------------------');
        resolve();
      });
      
      child.on('error', (err) => {
        console.error(`运行 ${scriptName} 时出错:`, err.message);
        resolve();
      });
    }
  });
}

async function showTestMenu() {
  console.log('========================================');
  console.log('         小R AI助手 - 测试菜单          ');
  console.log('========================================\n');
  
  console.log('可用的测试选项：\n');
  
  for (const [key, script] of Object.entries(testScripts)) {
    console.log(`${key}. ${script.name}`);
    console.log(`   描述: ${script.description}`);
    if (script.script !== 'start-gui') {
      console.log(`   脚本: ${script.script}`);
    } else {
      console.log('   启动: 主程序GUI');
    }
    console.log('');
  }
  
  console.log('输入 "q" 或 "quit" 退出菜单\n');
  
  while (true) {
    const choice = await askQuestion('请选择要运行的测试选项 (输入数字或q退出): ');
    
    if (choice.toLowerCase() === 'q' || choice.toLowerCase() === 'quit') {
      console.log('退出测试菜单，再见！');
      rl.close();
      break;
    }
    
    if (testScripts[choice]) {
      await runScript(testScripts[choice].script);
      console.log('\n回到测试菜单...\n');
    } else {
      console.log('无效选择，请输入正确的数字或"q"退出。\n');
    }
  }
}

// 运行测试菜单
showTestMenu().catch(console.error);