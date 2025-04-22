// 与主进程通信
const { ipcRenderer } = require('electron');

// 全局变量
let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let selectedAnswers = [];
let wrongQuestions = [];
let isTestMode = false;
let testQuestionCount = 0;
let userStats = {
  completed: 0,
  correct: 0,
  typeCounts: {
    single: 0,
    multiple: 0,
    judge: 0
  }
};

// DOM元素
const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.content');
const filterButtons = document.querySelectorAll('.filter-btn');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const questionNumber = document.querySelector('.question-number');
const questionType = document.querySelector('.question-type');
const prevBtn = document.getElementById('prev-btn');
const checkBtn = document.getElementById('check-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const resetBtn = document.getElementById('reset-btn');
const wrongQuestionsList = document.getElementById('wrong-questions-list');

// 统计元素
const totalQuestionsEl = document.getElementById('total-questions');
const completedQuestionsEl = document.getElementById('completed-questions');
const correctRateEl = document.getElementById('correct-rate');
const singleCountEl = document.getElementById('single-count');
const multipleCountEl = document.getElementById('multiple-count');
const judgeCountEl = document.getElementById('judge-count');

// 重置应用状态
function resetAppState() {
  // 重置统计信息
  userStats = {
    completed: 0,
    correct: 0,
    typeCounts: {
      single: 0,
      multiple: 0,
      judge: 0
    }
  };
  
  // 清空错题本
  wrongQuestions = [];
  
  // 保存清空的错题本
  ipcRenderer.invoke('save-wrong-questions', wrongQuestions);
  
  // 重置当前题目状态
  currentQuestionIndex = 0;
  selectedAnswers = [];
  isTestMode = false;
  
  // 重新初始化应用
  initApp();
}

// 初始化应用
async function initApp() {
  try {
    // 加载题目数据
    allQuestions = await ipcRenderer.invoke('get-questions');
    console.log(`成功加载 ${allQuestions.length} 道题目`);
    
    // 加载错题本数据
    wrongQuestions = await ipcRenderer.invoke('get-wrong-questions');
    console.log(`成功加载 ${wrongQuestions.length} 道错题`);
    
    // 随机排序题目
    shuffleQuestions();
    
    // 更新统计信息
    updateStats();
    
    // 显示第一题
    showQuestion(currentQuestionIndex);
    
    // 渲染错题本
    renderWrongQuestions();
  } catch (error) {
    console.error('初始化应用失败:', error);
    alert('加载题目数据失败，请重启应用');
  }
}

// 随机排序题目
function shuffleQuestions() {
  // 复制所有题目并随机排序
  currentQuestions = [...allQuestions].sort(() => Math.random() - 0.5);
  currentQuestionIndex = 0;
}

// 开始测试模式
function startTestMode(questionCount) {
  isTestMode = true;
  testQuestionCount = questionCount;
  
  // 随机选择指定数量的题目
  currentQuestions = [...allQuestions]
    .sort(() => Math.random() - 0.5)
    .slice(0, questionCount);
  
  currentQuestionIndex = 0;
  showQuestion(currentQuestionIndex);
  
  // 更新UI显示测试模式
  document.querySelector('.question-number').textContent = `测试模式: 题目 1/${questionCount}`;
  
  // 显示提交按钮，隐藏检查按钮
  submitBtn.style.display = 'block';
  checkBtn.style.display = 'none';
  
  // 重置选中答案
  selectedAnswers = [];
}

// 根据类型筛选题目
function filterQuestionsByType(type) {
  if (type === 'all') {
    currentQuestions = [...allQuestions].sort(() => Math.random() - 0.5);
  } else {
    currentQuestions = allQuestions.filter(q => q.type === type).sort(() => Math.random() - 0.5);
  }
  currentQuestionIndex = 0;
  showQuestion(currentQuestionIndex);
}

// 显示当前题目
function showQuestion(index) {
  if (currentQuestions.length === 0) {
    questionText.textContent = '没有找到题目';
    optionsContainer.innerHTML = '';
    questionNumber.textContent = '题目 0/0';
    questionType.textContent = '';
    prevBtn.disabled = true;
    checkBtn.disabled = true;
    nextBtn.style.display = 'none';
    return;
  }
  
  const question = currentQuestions[index];
  if (!question) {
    console.error('题目不存在:', index);
    return;
  }
  
  // 更新题目信息
  let typeText = '';
  switch(question.type) {
    case 'single':
      typeText = '【单选题】';
      break;
    case 'multiple':
      typeText = '【多选题】';
      break;
    case 'judge':
      typeText = '【判断题】';
      break;
  }
  questionText.textContent = typeText + question.question;
  
  // 根据是否为测试模式显示不同的题目编号
  if (isTestMode) {
    questionNumber.textContent = `测试模式: 题目 ${index + 1}/${testQuestionCount}`;
    // 在测试模式下，当达到最后一题时禁用下一题按钮
    nextBtn.disabled = index >= testQuestionCount - 1;
  } else {
    questionNumber.textContent = `题目 ${index + 1}/${currentQuestions.length}`;
    nextBtn.disabled = index === currentQuestions.length - 1;
  }
  
  // 更新题目类型
  questionType.textContent = typeText.replace(/[【】]/g, '');
  
  // 清空选项容器
  optionsContainer.innerHTML = '';
  
  // 重置选中答案
  selectedAnswers = [];
  
  // 添加选项
  Object.keys(question.options).forEach(key => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option';
    optionDiv.dataset.key = key;
    optionDiv.textContent = `${key}. ${question.options[key]}`;
    
    // 添加点击事件
    optionDiv.addEventListener('click', () => {
      if (question.type === 'single' || question.type === 'judge') {
        // 单选题或判断题，只能选一个
        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        selectedAnswers = [key];
      } else {
        // 多选题，可以选多个
        if (selectedAnswers.includes(key)) {
          selectedAnswers = selectedAnswers.filter(a => a !== key);
          optionDiv.classList.remove('selected');
        } else {
          selectedAnswers.push(key);
          optionDiv.classList.add('selected');
          return;
        }
      }
      optionDiv.classList.add('selected');
    });
    
    optionsContainer.appendChild(optionDiv);
  });
  
  // 更新按钮状态
  prevBtn.disabled = index === 0;
  checkBtn.disabled = false;
  checkBtn.style.display = 'block';
  nextBtn.style.display = 'block';
  nextBtn.disabled = index === currentQuestions.length - 1 && !isTestMode;
}

// 提交测试
function submitTest() {
  if (!isTestMode) return;
  
  // 检查是否已选择答案
  if (selectedAnswers.length === 0) {
    alert('请选择答案');
    return;
  }
  
  // 计算测试结果
  let correctCount = 0;
  const currentQuestion = currentQuestions[currentQuestionIndex];
  if (arraysEqual(selectedAnswers.sort(), currentQuestion.correctAnswer.sort())) {
    correctCount++;
  }
  
  // 更新统计信息
  userStats.completed++;
  if (correctCount > 0) {
    userStats.correct++;
  } else {
    // 添加到错题本
    if (!wrongQuestions.some(q => q.id === currentQuestion.id)) {
      wrongQuestions.push(currentQuestion);
      ipcRenderer.invoke('save-wrong-questions', wrongQuestions);
    }
  }
  
  // 显示测试结果
  const correctRate = Math.round((userStats.correct / userStats.completed) * 100);
  alert(`测试完成！\n总题数: ${testQuestionCount}\n正确数: ${userStats.correct}\n正确率: ${correctRate}%`);
  
  // 重置测试模式
  isTestMode = false;
  initApp();
}

// 检查答案
function checkAnswer() {
  const question = currentQuestions[currentQuestionIndex];
  const correctAnswers = question.correctAnswer;
  
  // 检查是否已选择答案
  if (selectedAnswers.length === 0) {
    alert('请选择答案');
    return;
  }
  
  // 判断答案是否正确
  const isCorrect = arraysEqual(selectedAnswers.sort(), correctAnswers.sort());
  
  // 更新统计信息
  userStats.completed++;
  if (isCorrect) {
    userStats.correct++;
  } else {
    // 添加到错题本
    if (!wrongQuestions.some(q => q.id === question.id)) {
      wrongQuestions.push(question);
      // 保存错题本
      ipcRenderer.invoke('save-wrong-questions', wrongQuestions)
        .then(result => {
          if (!result.success) {
            console.error('保存错题失败:', result.error);
          }
          // 更新错题本显示
          renderWrongQuestions();
        })
        .catch(err => {
          console.error('保存错题出错:', err);
        });
    }
  }
  
  // 更新题型统计
  if (question.type === 'single') {
    userStats.typeCounts.single++;
  } else if (question.type === 'multiple') {
    userStats.typeCounts.multiple++;
  } else if (question.type === 'judge') {
    userStats.typeCounts.judge++;
  }
  
  // 更新统计信息
  updateStats();
  
  // 显示正确答案
  document.querySelectorAll('.option').forEach(option => {
    const key = option.dataset.key;
    if (correctAnswers.includes(key)) {
      option.classList.add('correct');
    } else if (selectedAnswers.includes(key)) {
      option.classList.add('wrong');
    }
  });
  
  // 更新按钮状态
  checkBtn.disabled = true;
  nextBtn.disabled = false;
}

// 下一题
function nextQuestion() {
  if (currentQuestionIndex < currentQuestions.length - 1) {
    currentQuestionIndex++;
    showQuestion(currentQuestionIndex);
    // 重置检查按钮状态
    checkBtn.disabled = false;
  } else {
    if (isTestMode) {
      // 测试模式结束
      const correctCount = userStats.correct - (localStorage.getItem('lastCorrectCount') || 0);
      const testTotal = testQuestionCount;
      const correctRate = Math.round((correctCount / testTotal) * 100);
      
      alert(`测试完成！\n总题数: ${testTotal}\n正确数: ${correctCount}\n正确率: ${correctRate}%`);
      
      // 保存当前正确数，用于下次计算
      localStorage.setItem('lastCorrectCount', userStats.correct);
      
      // 重置测试模式
      isTestMode = false;
      shuffleQuestions();
      showQuestion(0);
    } else {
      alert('已经是最后一题了');
    }
  }
}

// 上一题
function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    showQuestion(currentQuestionIndex);
    // 重置检查按钮状态
    checkBtn.disabled = false;
  }
}

// 渲染错题本
function renderWrongQuestions() {
  wrongQuestionsList.innerHTML = '';
  
  if (wrongQuestions.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.textContent = '错题本为空，继续加油！';
    wrongQuestionsList.appendChild(emptyMsg);
    return;
  }
  
  wrongQuestions.forEach((question, index) => {
    const card = document.createElement('div');
    card.className = 'wrong-question-card';
    
    // 题目类型
    let typeText = '';
    switch(question.type) {
      case 'single':
        typeText = '单选题';
        break;
      case 'multiple':
        typeText = '多选题';
        break;
      case 'judge':
        typeText = '判断题';
        break;
    }
    
    card.innerHTML = `
      <div class="question-type">${typeText}</div>
      <div class="question-text">${question.question.substring(0, 50)}${question.question.length > 50 ? '...' : ''}</div>
    `;
    
    // 点击错题卡片，跳转到该题
    card.addEventListener('click', () => {
      // 切换到练习模式
      switchTab('practice');
      
      // 找到该题在所有题目中的索引
      const index = currentQuestions.findIndex(q => q.id === question.id);
      if (index !== -1) {
        currentQuestionIndex = index;
      } else {
        // 如果当前筛选中没有这道题，切换到全部并找到这道题
        filterQuestionsByType('all');
        const newIndex = currentQuestions.findIndex(q => q.id === question.id);
        if (newIndex !== -1) {
          currentQuestionIndex = newIndex;
        }
      }
      
      showQuestion(currentQuestionIndex);
    });
    
    wrongQuestionsList.appendChild(card);
  });
}

// 更新统计信息
function updateStats() {
  // 计算题型数量
  const typeCounts = {
    single: allQuestions.filter(q => q.type === 'single').length,
    multiple: allQuestions.filter(q => q.type === 'multiple').length,
    judge: allQuestions.filter(q => q.type === 'judge').length
  };
  
  // 更新统计显示
  totalQuestionsEl.textContent = allQuestions.length;
  completedQuestionsEl.textContent = userStats.completed;
  correctRateEl.textContent = userStats.completed > 0 ? 
    Math.round((userStats.correct / userStats.completed) * 100) + '%' : '0%';
  
  singleCountEl.textContent = typeCounts.single;
  multipleCountEl.textContent = typeCounts.multiple;
  judgeCountEl.textContent = typeCounts.judge;
  
  // 保存用户统计数据到本地存储
  localStorage.setItem('userStats', JSON.stringify(userStats));
}

// 切换标签页
function switchTab(tabId) {
  tabs.forEach(tab => {
    if (tab.dataset.tab === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  contents.forEach(content => {
    if (content.id === `${tabId}-content`) {
      content.classList.remove('hidden');
    } else {
      content.classList.add('hidden');
    }
  });
}

// 辅助函数：比较两个数组是否相等
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// 清除所有本地数据
async function clearAllData() {
  if (confirm('确定要清除所有数据吗？此操作将清除：\n\n1. 统计数据\n2. 错题本\n3. 本地缓存\n\n此操作不可恢复！')) {
    try {
      // 清除localStorage中的数据
      localStorage.clear();
      
      // 重置统计信息
      userStats = {
        completed: 0,
        correct: 0,
        typeCounts: {
          single: 0,
          multiple: 0,
          judge: 0
        }
      };
      
      // 清空错题本
      wrongQuestions = [];
      await ipcRenderer.invoke('save-wrong-questions', []);
      
      // 清除lastCorrectCount
      localStorage.removeItem('lastCorrectCount');
      
      // 更新UI
      updateStats();
      renderWrongQuestions();
      
      alert('所有数据已清除成功！');
      
      // 重新初始化应用
      initApp();
    } catch (error) {
      console.error('清除数据失败:', error);
      alert('清除数据时出现错误，请重试');
    }
  }
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
  // 从本地存储加载用户统计数据
  const savedStats = localStorage.getItem('userStats');
  if (savedStats) {
    try {
      userStats = JSON.parse(savedStats);
    } catch (e) {
      console.error('解析保存的统计数据失败:', e);
    }
  }
  
  // 初始化应用
  initApp();
  
  // 标签切换事件
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });
  
  // 题型筛选事件
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterQuestionsByType(btn.dataset.type);
    });
  });
  
  // 按钮事件
  prevBtn.addEventListener('click', prevQuestion);
  checkBtn.addEventListener('click', checkAnswer);
  nextBtn.addEventListener('click', nextQuestion);
  
  // 添加测试模式按钮事件
  const test50Btn = document.getElementById('test-50-btn');
  const test100Btn = document.getElementById('test-100-btn');
  
  if (test50Btn) {
    test50Btn.addEventListener('click', () => {
      if (confirm('确定要开始50题测试模式吗？')) {
        // 保存当前正确数，用于计算测试结果
        localStorage.setItem('lastCorrectCount', userStats.correct);
        startTestMode(50);
      }
    });
  }
  
  if (test100Btn) {
    test100Btn.addEventListener('click', () => {
      if (confirm('确定要开始100题测试模式吗？')) {
        // 保存当前正确数，用于计算测试结果
        localStorage.setItem('lastCorrectCount', userStats.correct);
        startTestMode(100);
      }
    });
  }
  
  // 添加清空错题本按钮事件
  const clearWrongBtn = document.getElementById('clear-wrong-btn');
  if (clearWrongBtn) {
    clearWrongBtn.addEventListener('click', () => {
      if (confirm('确定要清空错题本吗？此操作不可恢复。')) {
        wrongQuestions = [];
        ipcRenderer.invoke('save-wrong-questions', wrongQuestions);
        renderWrongQuestions();
        alert('错题本已清空');
      }
    });
  }
  
  // 添加清除数据按钮事件
  const clearDataBtn = document.getElementById('clear-data-btn');
  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', clearAllData);
  }
});

// 添加提交按钮事件监听
submitBtn.addEventListener('click', submitTest);