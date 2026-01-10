/**
 * 一键清除小R AI助手数据脚本
 * 功能：清除所有本地存储的对话历史、设置等数据
 */
 
function clearAllData() {
  try {
    // 清除localStorage中的数据
    localStorage.removeItem('xiaor-settings');
    console.log('✅ 已清除用户设置');
    
    // 清除所有以 'xiaor-conversation-' 开头的对话数据
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('xiaor-conversation-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ 已清除对话数据: ${key}`);
    });
    
    // 清除当前对话ID
    localStorage.removeItem('currentConversationId');
    console.log('✅ 已清除当前对话ID');
    
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
async function clearElectronData() {
  try {
    if (window.electronAPI) {
      // 调用Electron API清除本地文件存储的数据
      if (window.electronAPI.clearAllConversations) {
        await window.electronAPI.clearAllConversations();
        console.log('✅ 已清除Electron本地数据');
      }
      
      // 同时清除对话历史
      if (window.electronAPI.clearConversationHistory) {
        await window.electronAPI.clearConversationHistory();
        console.log('✅ 已清除对话历史');
      }
    } else {
      console.log('ℹ️ 非Electron环境，跳过本地文件清除');
    }
  } catch (error) {
    console.error('❌ 清除Electron数据时发生错误:', error);
  }
}

// 三重确认清除函数
async function clearAllUserData() {
  console.log('🚀 开始清除小R AI助手所有数据...');
  
  // 第一重确认
  const firstConfirm = await showCustomConfirm('您确定要清除所有数据吗？', '这将删除所有对话记录和设置，此操作不可恢复。', '取消', '继续');
  if (!firstConfirm) {
    console.log('用户取消了数据清除操作');
    return false;
  }
  
  // 第二重确认
  const secondConfirm = await showCustomConfirm('再次确认', '您确定要清除所有数据吗？这是最后一次机会。', '取消', '继续');
  if (!secondConfirm) {
    console.log('用户取消了数据清除操作');
    return false;
  }
  
  // 第三重确认
  const thirdConfirm = await showCustomConfirm('最终确认', '即将清除所有数据，此操作不可恢复，确定继续吗？', '取消', '清除数据');
  if (!thirdConfirm) {
    console.log('用户取消了数据清除操作');
    return false;
  }
  
  // 执行清除操作
  console.log('用户已确认清除所有数据');

  // 清除Web存储数据
  clearAllData();
  
  // 清除Electron相关数据
  await clearElectronData();
  
  // 显示完成消息
  showCustomAlert('数据清除完成', '所有数据已成功清除，请刷新页面或重启应用。');
  
  return true;
}

// 显示自定义确认框
function showCustomConfirm(title, message, cancelText, okText) {
  return new Promise((resolve) => {
    const confirmBox = document.getElementById('customConfirm');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmCancel = document.getElementById('confirmCancel');
    const confirmOk = document.getElementById('confirmOk');
    const confirmClose = document.getElementById('confirmClose');
    
    if (confirmBox && confirmTitle && confirmMessage && confirmCancel && confirmOk && confirmClose) {
      confirmTitle.textContent = title;
      confirmMessage.textContent = message;
      confirmCancel.textContent = cancelText;
      confirmOk.textContent = okText;
      
      // 显示确认框
      confirmBox.style.display = 'flex';
      
      // 事件处理函数
      const handleConfirm = () => {
        cleanup();
        resolve(true);
      };
      
      const handleCancel = () => {
        cleanup();
        resolve(false);
      };
      
      const handleOutsideClick = (event) => {
        if (event.target === confirmBox) {
          handleCancel();
        }
      };
      
      const cleanup = () => {
        confirmCancel.removeEventListener('click', handleCancel);
        confirmOk.removeEventListener('click', handleConfirm);
        confirmClose.removeEventListener('click', handleCancel);
        confirmBox.removeEventListener('click', handleOutsideClick);
        confirmBox.style.display = 'none';
      };
      
      // 添加事件监听器
      confirmCancel.addEventListener('click', handleCancel);
      confirmOk.addEventListener('click', handleConfirm);
      confirmClose.addEventListener('click', handleCancel);
      confirmBox.addEventListener('click', handleOutsideClick);
    } else {
      // 如果没有自定义确认框元素，使用原生confirm
      resolve(confirm(`${title}\n\n${message}`));
    }
  });
}

// 显示自定义提示框
function showCustomAlert(title, message) {
  return new Promise((resolve) => {
    const alertBox = document.getElementById('customAlert');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertConfirm = document.getElementById('alertConfirm');
    const alertClose = document.getElementById('alertClose');
    
    if (alertBox && alertTitle && alertMessage && alertConfirm && alertClose) {
      alertTitle.textContent = title;
      alertMessage.textContent = message;
      
      // 显示提示框
      alertBox.style.display = 'flex';
      
      // 事件处理函数
      const handleConfirm = () => {
        cleanup();
        resolve(true);
      };
      
      const handleOutsideClick = (event) => {
        if (event.target === alertBox) {
          handleConfirm();
        }
      };
      
      const cleanup = () => {
        alertConfirm.removeEventListener('click', handleConfirm);
        alertClose.removeEventListener('click', handleConfirm);
        alertBox.removeEventListener('click', handleOutsideClick);
        alertBox.style.display = 'none';
      };
      
      // 添加事件监听器
      alertConfirm.addEventListener('click', handleConfirm);
      alertClose.addEventListener('click', handleConfirm);
      alertBox.addEventListener('click', handleOutsideClick);
    } else {
      // 如果没有自定义提示框元素，使用原生alert
      alert(`${title}\n\n${message}`);
      resolve(true);
    }
  });
}

// 提供一个全局函数供页面调用
window.clearAllUserData = clearAllUserData;

// 为Electron主进程提供清除数据的函数
let ipcRenderer;
// 检查是否在Electron环境中
if (typeof window !== 'undefined' && window.process && window.process.type) {
  // 在Electron渲染进程中
  try {
    ipcRenderer = require('electron').ipcRenderer;
  } catch (e) {
    console.log('在Electron环境中但无法加载ipcRenderer:', e.message);
  }
} else if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
  // 在Electron主进程中
  try {
    ipcRenderer = require('electron').ipcRenderer;
  } catch (e) {
    console.log('在Electron环境中但无法加载ipcRenderer:', e.message);
  }
} else if (navigator.userAgent.toLowerCase().includes('electron')) {
  // 通过User Agent检测Electron环境
  try {
    ipcRenderer = require('electron').ipcRenderer;
  } catch (e) {
    console.log('在Electron环境中但无法加载ipcRenderer:', e.message);
  }
} else {
  console.log('非Electron环境，跳过ipcRenderer加载');
}

// 如果直接运行此脚本，执行清除操作
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clearAllUserData, clearAllData, clearElectronData, showCustomConfirm, showCustomAlert };
} else if (typeof window !== 'undefined') {
  // 在浏览器环境中，将函数暴露到全局
  console.log('📋 数据清除工具已加载，调用 clearAllUserData() 开始清除数据');
}