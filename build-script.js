const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function showProgress(totalSteps, currentStep, description) {
  const progressBarLength = 50;
  const completed = Math.floor((currentStep / totalSteps) * progressBarLength);
  const progressBar = '[' + '='.repeat(completed) + ' '.repeat(progressBarLength - completed) + ']';
  const percentage = Math.floor((currentStep / totalSteps) * 100);
  
  process.stdout.write(`\r${progressBar} ${percentage}% ${description}`);
}

async function buildForPlatform(platform, buildType) {
  let buildCommand = 'npx electron-builder --';
  
  switch(platform) {
    case 'windows':
      buildCommand += ' win';
      break;
    case 'mac':
      buildCommand += ' mac';
      break;
    case 'linux':
      buildCommand += ' linux';
      break;
    default:
      buildCommand += ' win'; // 默认为Windows
  }
  
  // 根据构建类型添加参数
  switch(buildType) {
    case 'installer':
      // 默认构建安装包（NSIS）
      break;
    case 'executable':
      buildCommand += ' --dir';
      break;
    case 'all':
      // 构建所有类型 - 直接执行基本命令，不添加额外参数
      break;
    default:
      // 默认构建安装包
      break;
  }
  
  console.log(`执行构建命令: ${buildCommand}`);
  
  return new Promise((resolve) => {
    const child = require('child_process').exec(buildCommand);
    
    // 显示进度条
    const progressBarLength = 40;
    let progress = 0;
    let progressInterval = setInterval(() => {
      progress = (progress + 1) % (progressBarLength + 1);
      const progressBar = '[' + '='.repeat(progress) + ' '.repeat(progressBarLength - progress) + ']';
      const percentage = Math.floor((progress / progressBarLength) * 100);
      process.stdout.write(`\r构建进度: ${progressBar} ${percentage}% (构建中...)`);
    }, 200);
    
    let stderrData = '';
    let stdoutData = '';
    
    child.stdout.on('data', (data) => {
      stdoutData += data;
      // 检测构建完成的标志
      if (data.includes('• defaultElectronBuilderConfiguration') || data.includes('Building') || data.includes('Packaging application')) {
        process.stdout.write('\n');
        process.stdout.write(`处理中: ${data.trim()}\n`);
      }
    });
    
    child.stderr.on('data', (data) => {
      stderrData += data;
      process.stderr.write(`错误: ${data}`);
    });
    
    child.on('close', (code) => {
      clearInterval(progressInterval);
      if (code === 0) {
        process.stdout.write('\n构建完成!                                    \n'); // 确保覆盖进度条
        resolve(true);
      } else {
        process.stdout.write('\n构建失败!                                    \n'); // 确保覆盖进度条
        if (stderrData) {
          console.error('详细错误信息:');
          console.error(stderrData);
        }
        if (stdoutData) {
          console.log('标准输出信息:');
          console.log(stdoutData);
        }
        resolve(false);
      }
    });
  });
}

async function main() {
  console.log('=== 小R AI助手构建工具 ===\n');
  
  // 询问构建目标平台
  const platform = await askQuestion('请选择构建目标系统 (windows/mac/linux): ');
  if (!['windows', 'mac', 'linux'].includes(platform.toLowerCase())) {
    console.log('无效的平台选择，使用默认值: windows');
  }
  
  // 询问构建类型
  console.log('\n请选择构建类型:');
  console.log('1. installer - 生成安装包');
  console.log('2. executable - 生成可执行文件(目录)');
  console.log('3. all - 全部生成');
  
  const buildTypeInput = await askQuestion('请输入选择 (1-3): ');
  let buildType;
  
  switch(buildTypeInput) {
    case '1':
      buildType = 'installer';
      break;
    case '2':
      buildType = 'executable';
      break;
    case '3':
      buildType = 'all';
      break;
    default:
      console.log('无效选择，使用默认值: installer');
      buildType = 'installer';
  }
  
  console.log(`\n开始构建 ${platform} 平台的 ${buildType} 版本...\n`);
  
  // 显示进度条
  const totalSteps = 10;
  for (let i = 0; i <= totalSteps; i++) {
    await showProgress(totalSteps, i, `准备构建环境...`);
    await sleep(200); // 模拟进度
  }
  
  process.stdout.write('\n');
  
  // 执行构建
  let success = false;
  
  if (buildType === 'all') {
    // 构建所有类型 - 直接执行electron-builder
    console.log('正在构建所有类型...');
    success = await buildForPlatform(platform, 'all');
  } else {
    success = await buildForPlatform(platform, buildType);
  }
  
  if (success) {
    console.log('\n构建完成！生成的文件位于 dist 目录中。');
  } else {
    console.log('\n构建失败。');
  }
  
  rl.close();
}

main().catch(error => {
  console.error('脚本执行出错:', error);
  rl.close();
});