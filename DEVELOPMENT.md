# 小R AI助手 - 开发文档

## 项目结构

```
小R - AI助手/
├── main.js          # Electron主进程
├── renderer.js      # 渲染进程
├── preload.js       # 预加载脚本
├── index.html       # 主界面
├── styles.css       # 样式文件
├── clearData.js     # 数据清除功能
├── RuanmAi.png      # 应用图标
├── package.json     # 项目配置
├── README.md        # 项目说明
├── CHANGELOG.md     # 变更日志
└── DEVELOPMENT.md   # 开发文档
```

## 主要功能实现

### 1. AI对话功能
- 使用Electron IPC机制与主进程通信
- 支持多种AI模型（DeepseekV3.1、豆包、腾讯元宝、Qwen3）
- 通过GET请求调用API接口

### 2. 对话管理
- 本地存储对话历史
- 支持多对话切换
- 自动对话标题生成

### 3. 技能模式
- 图片生成：调用pollinations.ai API
- OCR识别：识别图片中的文字
- 翻译助手：提供翻译功能

### 4. 语音功能
- 文字转语音（TTS）
- 语音识别输入

### 5. 主题切换
- 深色/浅色主题切换
- 通过CSS变量实现

### 6. 数据管理
- 本地存储用户设置
- 对话历史管理
- 一键清除数据功能

## API接口

### AI对话API
- DeepseekV3.1: `https://api.jkyai.top/API/depsek3.1.php`
- 豆包: `https://api.jkyai.top/API/doubao.php`
- 腾讯元宝: `https://api.jkyai.top/API/yuanbao.php`
- Qwen3: `https://api.jkyai.top/API/qwen3.php`

参数格式：
```
GET /API/endpoint.php?question={用户问题}&system={系统提示词}
```

### OCR识别API
- 接口: `https://api.jkyai.top/API/deepseek-ocr.php`
- 参数: `question={问题}&image={图片URL}`

## 代码结构

### main.js (主进程)
- Electron应用初始化
- 窗口创建和管理
- IPC通信处理
- AI请求处理

### renderer.js (渲染进程)
- UI交互逻辑
- 对话管理
- 设置功能
- 语音功能
- 数据清除功能

### preload.js (预加载脚本)
- 安全的API暴露给渲染进程
- IPC通信接口

## 特殊功能

### 414错误处理
- 当请求URI过长时自动减少上下文数量
- 逐步减少历史对话轮数直到请求成功

### 停止生成功能
- 用户可以中断AI回复生成
- 通过标志位控制响应处理

### 一键清除数据
- 清除本地存储的对话历史
- 清除用户设置
- 清除Electron本地数据

## 开发说明

### 环境要求
- Node.js >= 16
- npm 或 yarn

### 开发命令
```bash
# 安装依赖
npm install

# 启动开发模式
npm start

# 构建应用
npm run build
```

### 代码规范
- 使用ES6+语法
- 遵循JavaScript标准代码风格
- 注释清晰，特别是复杂逻辑部分

## 部署说明

使用electron-builder进行应用打包：
```bash
npm run build
```

打包后的文件位于`dist/`目录下。

## 调试说明

- 使用F12打开开发者工具
- 在控制台查看请求和响应日志
- 查看网络面板中的API请求