# Claude Monitor

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md)

![screen.png](frontend/public/screenshot/screen.png)

实时监控和分析Claude Code会话的Web应用程序

## 概述

Claude Monitor可视化Claude Code会话数据，追踪和分析开发活动。
提供实时监控、使用量统计、AI驱动的提示词/工作分析功能。

## 演示

https://dhrod0325.github.io/claude-monitor/

## 下载

| 平台 | 下载 |
|------|------|
| macOS (Apple Silicon) | [Claude.Monitor_0.1.1_aarch64.dmg](https://github.com/dhrod0325/claude-monitor/releases/download/v0.1.1/Claude.Monitor_0.1.1_aarch64.dmg) |
| Windows (x64) | [Claude.Monitor_0.1.1_x64-setup.exe](https://github.com/dhrod0325/claude-monitor/releases/download/v0.1.1/Claude.Monitor_0.1.1_x64-setup.exe) |
| Linux (x64) | [claude-monitor_0.1.1_amd64.AppImage](https://github.com/dhrod0325/claude-monitor/releases/download/v0.1.1/claude-monitor_0.1.1_amd64.AppImage) |

> 查看所有版本: [Releases](https://github.com/dhrod0325/claude-monitor/releases)

## 目录

- [下载](#下载)
- [功能](#功能)
- [系统要求](#系统要求)
- [安装](#安装)
- [使用方法](#使用方法)
- [API参考](#api参考)
- [项目结构](#项目结构)

## 功能

### 会话监控

- 查看项目/会话列表
- 实时监控会话历史 (WebSocket)
- 会话搜索和过滤
- 工具调用可视化
- 会话恢复 (continue/resume)
- 后台代理日志查看

### 使用量仪表板

- 总成本、会话数、令牌使用量摘要
- 按模型/项目的使用量统计
- 每日时间线图表
- 日期范围过滤器 (7天、30天、全部)

### 提示词分析

- 通过Claude CLI进行提示词模式分析
- 实时流式分析结果
- 保存/查看/删除分析记录

### 工作分析

- 基于日期范围的工作分析
- 基于分块的流式分析
- 支持分析模型选择

### 国际化

- 支持韩语、英语、日语、中文
- 自动检测浏览器语言

### 性能

- 基于内存TTL的缓存
- 缓存统计和管理API

## 系统要求

| 组件      | 版本    |
|---------|-------|
| Python  | 3.11+ |
| Node.js | 18+   |
| npm     | 9+    |

## 安装

### Backend

```bash
cd backend
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## 使用方法

### 开发模式

使用开发脚本同时运行Backend和Frontend。
代码更改时自动重新加载。

```bash
./scripts/dev.sh
```

- 着陆页: http://localhost:5173
- 应用: http://localhost:5173/app.html
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 仅运行Backend

```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 仅运行Frontend

```bash
cd frontend
npm run dev
```

### 生产模式

```bash
# 构建Frontend
cd frontend
npm run build

# 运行Backend (包含静态文件服务)
cd ../backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

访问 http://localhost:8000

## API参考

### REST API

| 方法     | 端点                                                   | 描述        |
|--------|------------------------------------------------------|-----------|
| GET    | `/api/health`                                        | 健康检查      |
| GET    | `/api/projects`                                      | 项目列表      |
| GET    | `/api/projects/{project_id}`                         | 项目详情      |
| GET    | `/api/projects/{project_id}/sessions`                | 会话列表      |
| GET    | `/api/sessions/{session_id}/history`                 | 会话历史      |
| GET    | `/api/sessions/{session_id}/metadata`                | 会话元数据     |
| GET    | `/api/sessions/{session_id}/agents`                  | 后台代理日志    |
| GET    | `/api/sessions/{session_id}/resume-info`             | 恢复信息      |
| GET    | `/api/sessions/search?q={query}`                     | 会话搜索      |
| POST   | `/api/sessions/{session_id}/resume?mode={mode}`      | 恢复会话      |
| GET    | `/api/sessions/by-date-range`                        | 按日期范围获取会话 |
| GET    | `/api/usage/stats?days={days}`                       | 使用量统计     |
| GET    | `/api/usage/range?start_date={start}&end_date={end}` | 日期范围使用量统计 |
| POST   | `/api/analysis/analyze`                              | 请求提示词分析   |
| GET    | `/api/analysis/list`                                 | 分析列表      |
| GET    | `/api/analysis/{id}`                                 | 分析详情      |
| DELETE | `/api/analysis/{id}`                                 | 删除分析      |
| POST   | `/api/analysis/{id}/reanalyze`                       | 重新分析      |
| POST   | `/api/work-analysis/analyze`                         | 请求工作分析    |
| GET    | `/api/work-analysis/list`                            | 工作分析列表    |
| GET    | `/api/work-analysis/{id}`                            | 工作分析详情    |
| DELETE | `/api/work-analysis/{id}`                            | 删除工作分析    |
| POST   | `/api/work-analysis/{id}/reanalyze`                  | 重新工作分析    |
| GET    | `/api/cache/stats`                                   | 缓存统计      |
| DELETE | `/api/cache`                                         | 清除所有缓存    |
| DELETE | `/api/cache/{cache_name}`                            | 清除特定缓存    |

### WebSocket

| 端点                             | 描述     |
|--------------------------------|--------|
| `/ws/{session_id}`             | 实时会话更新 |
| `/api/analysis/ws/stream`      | 提示词分析流 |
| `/api/work-analysis/ws/stream` | 工作分析流  |

## 项目结构

```
claude-monitor/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── api/
│   │   ├── routes.py
│   │   ├── websocket.py
│   │   ├── analysis_routes.py
│   │   └── work_analysis_routes.py
│   ├── services/
│   │   ├── project.py
│   │   ├── session.py
│   │   ├── parser.py
│   │   ├── watcher.py
│   │   ├── analysis.py
│   │   ├── work_analysis.py
│   │   ├── usage.py
│   │   ├── cache.py
│   │   └── common/
│   │       ├── claude_cli.py
│   │       ├── constants.py
│   │       └── utils.py
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   └── models/
│       ├── schemas.py
│       ├── analysis.py
│       └── work_analysis.py
├── frontend/
│   ├── index.html          # 着陆页入口
│   ├── app.html            # 应用入口
│   ├── src/
│   │   ├── main.tsx        # 应用入口点
│   │   ├── landing.tsx     # 着陆页入口点
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Landing/    # 着陆页组件
│   │   │   └── ...
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── lib/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── tauri-app/              # 桌面应用 (Tauri)
├── scripts/
│   └── dev.sh
└── README.md
```

## 技术栈

| 层级       | 技术                                                               |
|----------|------------------------------------------------------------------|
| Backend  | Python 3.11+, FastAPI, uvicorn, watchfiles, pydantic, cachetools |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 4.x                     |
| Desktop  | Tauri                                                            |
| 状态管理     | Zustand                                                          |
| UI       | Radix UI, Framer Motion, Lucide Icons                            |
| 国际化      | i18next                                                          |
