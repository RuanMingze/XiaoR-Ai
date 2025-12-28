/**
 * 一键清除小R AI助手数据脚本
 * 功能：清除所有本地存储的对话历史、设置等数据
 */
 
function clearAllData() {
  try {
    // 清除localStorage中的数据
    localStorage.removeItem('xiaor-settings');
    console.log('✅ 已清除用户设置');
    
    // 清除会话存储
    sessionStorage.clear();
    console.log('✅ 已清除会话存储');
    
    console.log('🎉 数据清除完成！');
    console.log('💡 提示：请刷新页面或重启应用以使更改生效');
    
    return true;
  } catch (error) {
    console.error('❌ 清除数据时发生错误:', error);
    return false;
  }
}

// 为Electron环境提供清除数据的函数
function clearElectronData() {
  try {
    if (window.electronAPI) {
      // 调用Electron API清除本地文件存储的数据
      window.electronAPI.clearAllConversations && window.electronAPI.clearAllConversations();
      console.log('✅ 已请求清除Electron本地数据');
      
      // 同时清除对话历史
      window.electronAPI.clearConversationHistory && window.electronAPI.clearConversationHistory();
      console.log('✅ 已请求清除对话历史');
    } else {
      console.log('ℹ️ 非Electron环境，跳过本地文件清除');
    }
  } catch (error) {
    console.error('❌ 清除Electron数据时发生错误:', error);
  }
}

// 主清除函数
function clearAllUserData() {
  console.log('🚀 开始清除小R AI助手所有数据...');
  
  // 清除Web存储数据
  clearAllData();
  
  // 清除Electron相关数据
  clearElectronData();
  
  // 显示确认消息
  if (typeof alert !== 'undefined') {
    alert('数据清除完成！请刷新页面或重启应用。');
  } else {
    // 在控制台输出确认信息
    console.log('数据清除完成！请刷新页面或重启应用。');
  }
  
  return true;
}

// 提供一个全局函数供页面调用
window.clearAllUserData = clearAllUserData;

// 为Electron主进程提供清除数据的函数
let ipcRenderer;
try {
  ipcRenderer = require('electron').ipcRenderer;
} catch (e) {
  console.log('非Electron环境，跳过ipcRenderer加载');
}

// 如果直接运行此脚本，执行清除操作
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clearAllUserData, clearAllData, clearElectronData };
} else if (typeof window !== 'undefined') {
  // 在浏览器环境中，将函数暴露到全局
  console.log('📋 数据清除工具已加载，调用 clearAllUserData() 开始清除数据');
}