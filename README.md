# One刷题系统

## 项目介绍

One刷题系统是一个本地离线智能刷题系统，专为备考各类考试设计。系统支持随机顺序刷题、错题本管理等功能，所有数据保存在程序所在目录中，无需联网即可使用。

## 主要功能

- **随机顺序刷题**：题目随机排序，避免记忆题号
- **题型筛选**：支持按单选题、多选题、判断题筛选
- **错题本管理**：自动记录做错的题目，方便重点复习
- **学习统计**：统计做题数量、正确率等数据
- **本地数据存储**：所有数据保存在本地，保护隐私
- **测试模式**：支持自定义题目数量的测试，自动统计正确率
- **题型标识**：题目前清晰标注题型（单选题/多选题/判断题）
- **固定布局**：题目显示区域固定尺寸，避免页面跳动

## 使用方法

### 安装依赖

```
npm install
```

### 运行程序

```
npm start
```

### 打包为可执行文件

```
npm run build
```

打包后的程序将保存在`dist`目录下。

## 题库管理

系统使用项目根目录下的`questions.json`文件作为题库数据源。题库格式为JSON数组，每个题目包含以下字段：

- `id`: 题目ID
- `type`: 题目类型（single/multiple/judge）
- `question`: 题目内容
- `options`: 选项对象
- `correctAnswer`: 正确答案数组

## 注意事项

- 首次使用前请确保`questions.json`文件已正确放置在程序目录下
- 错题本数据保存在`data/wrong-questions.json`文件中
- 程序需要Node.js和Electron环境支持
- 测试模式下会自动限制题目数量，确保不会超出设定范围
- 题目显示区域采用固定尺寸设计，确保良好的用户体验