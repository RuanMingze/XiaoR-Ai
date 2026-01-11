# XiaoR CLI

小R AI助手命令行工具 - 独立于主程序运行，提供桌面版的完整功能体验

## 安装

```bash
npm install -g xiaor-cli
```

或者直接运行：

```bash
npx xiaor-cli chat
```

## 功能

- 与AI模型直接交互
- 支持多种AI模型（DeepSeek, 豆包, 腾讯元宝, Qwen3, 蚂蚁Ling2.0, Gemini-2.5, 小米MiMo-V2, GLM）
- 管理对话历史
- 导出聊天记录
- 查看系统信息

## 用法

### 启动交互式聊天

```bash
xiaor-cli chat
```

或者

```bash
npx xiaor-cli chat
```

### 切换AI模型

```bash
xiaor-cli model xiaomi
```

### 列出所有支持的模型

```bash
xiaor-cli list-models
```

### 查看对话历史

```bash
xiaor-cli history
```

### 导出对话历史

```bash
xiaor-cli export md --output ./exports/
```

## 支持的命令

- `chat` - 启动交互式聊天模式
- `model [name]` - 切换AI模型 (deepseek, doubao, yuanbao, qwen3, ling, gemini, xiaomi, glm)
- `list-models` - 列出所有支持的AI模型
- `history` - 显示对话历史
- `clear-history` - 清空对话历史
- `export [format]` - 导出对话历史 (json, txt, md)
- `version` - 显示版本号
- `help` - 显示帮助信息

## 选项

- `--model [name]` - 指定AI模型
- `--format [format]` - 指定导出格式 (json, txt, md)
- `--output [path]` - 指定导出路径，默认为当前目录

## 在线使用

不需要安装，可以直接使用：

```bash
npx xiaor-cli chat
```

## 特性

- 独立于主程序运行
- 提供桌面版的完整功能体验
- 支持多种AI模型
- 对话历史管理
- 数据导出功能