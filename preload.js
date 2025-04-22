// 预加载脚本，用于安全地暴露主进程的API到渲染进程
const { contextBridge, ipcRenderer } = require('electron');

// 暴露API到window对象
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取题目数据
  getQuestions: () => ipcRenderer.invoke('get-questions'),
  
  // 保存错题本数据
  saveWrongQuestions: (wrongQuestions) => ipcRenderer.invoke('save-wrong-questions', wrongQuestions),
  
  // 获取错题本数据
  getWrongQuestions: () => ipcRenderer.invoke('get-wrong-questions')
});