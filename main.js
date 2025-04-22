const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 获取应用程序的基础路径
function getAppPath() {
  // 在开发环境中使用 __dirname
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    return __dirname;
  }
  // 在打包后的环境中使用 process.resourcesPath
  return process.resourcesPath;
}

// 获取数据存储路径
function getDataPath() {
  // 在开发环境中使用项目目录
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    return path.join(__dirname, 'data');
  }
  // 在打包后的环境中使用可执行文件所在目录
  return path.join(path.dirname(app.getPath('exe')), 'data');
}

// 保存应用数据的目录
const dataDir = getDataPath();

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
  
  // 开发环境下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// 处理获取题目数据的请求
ipcMain.handle('get-questions', async () => {
  try {
    const jsDir = path.join(getAppPath(), 'js');
    let allQuestions = [];
    
    // 读取单选题
    const singlePath = path.join(jsDir, '单选.json');
    if (fs.existsSync(singlePath)) {
      const singleData = fs.readFileSync(singlePath, 'utf8');
      const singleQuestions = JSON.parse(singleData);
      allQuestions = allQuestions.concat(singleQuestions);
    }
    
    // 读取多选题
    const multiplePath = path.join(jsDir, '多选.json');
    if (fs.existsSync(multiplePath)) {
      const multipleData = fs.readFileSync(multiplePath, 'utf8');
      const multipleQuestions = JSON.parse(multipleData);
      allQuestions = allQuestions.concat(multipleQuestions);
    }
    
    // 读取判断题
    const judgePath = path.join(jsDir, '判断.json');
    if (fs.existsSync(judgePath)) {
      const judgeData = fs.readFileSync(judgePath, 'utf8');
      const judgeQuestions = JSON.parse(judgeData);
      allQuestions = allQuestions.concat(judgeQuestions);
    }
    
    return allQuestions;
  } catch (error) {
    console.error('Error loading questions:', error);
    return [];
  }
});

// 保存错题本数据
ipcMain.handle('save-wrong-questions', async (event, wrongQuestions) => {
  try {
    const wrongQuestionsPath = path.join(dataDir, 'wrong-questions.json');
    fs.writeFileSync(wrongQuestionsPath, JSON.stringify(wrongQuestions, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving wrong questions:', error);
    return { success: false, error: error.message };
  }
});

// 获取错题本数据
ipcMain.handle('get-wrong-questions', async () => {
  try {
    const wrongQuestionsPath = path.join(dataDir, 'wrong-questions.json');
    if (fs.existsSync(wrongQuestionsPath)) {
      const data = fs.readFileSync(wrongQuestionsPath, 'utf8');
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error loading wrong questions:', error);
    return [];
  }
});