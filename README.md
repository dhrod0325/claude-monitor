# Claude Monitor

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md)

![screen.png](frontend/public/screenshot/screen.png)

A web application for real-time monitoring and analysis of Claude Code sessions

## Overview

Claude Monitor visualizes Claude Code session data to track and analyze development activities.
It provides real-time monitoring, usage statistics, and AI-powered prompt/work analysis features.

## Demo

https://dhrod0325.github.io/claude-monitor/

## Download

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | [Claude.Monitor_0.1.0_aarch64.dmg](https://github.com/dhrod0325/claude-monitor/releases/download/v0.1.0/Claude.Monitor_0.1.0_aarch64.dmg) |

> See all releases: [Releases](https://github.com/dhrod0325/claude-monitor/releases)

## Table of Contents

- [Download](#download)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)

## Features

### Session Monitoring
- View project and session lists
- Real-time session history monitoring (WebSocket)
- Session search and filtering
- Tool call visualization
- Session resume (continue/resume)
- Background agent log viewing

### Usage Dashboard
- Total cost, session count, token usage summary
- Usage statistics by model and project
- Daily timeline chart
- Date range filter (7 days, 30 days, all)

### Prompt Analysis
- Prompt pattern analysis via Claude CLI
- Real-time streaming analysis results
- Save/view/delete analysis history

### Work Analysis
- Date range based work analysis
- Chunk-based streaming analysis
- Analysis model selection support

### Internationalization
- Korean, English, Japanese, Chinese support
- Automatic browser language detection

### Performance
- In-Memory TTL-based caching
- Cache statistics and management API

## Requirements

| Component | Version |
|-----------|---------|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

## Installation

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

## Usage

### Development Mode

Run both Backend and Frontend simultaneously using the development script.
Auto-reloads on code changes.

```bash
./scripts/dev.sh
```

- Landing Page: http://localhost:5173
- App: http://localhost:5173/app.html
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Backend Only

```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend Only

```bash
cd frontend
npm run dev
```

### Production Mode

```bash
# Build Frontend
cd frontend
npm run build

# Run Backend (includes static file serving)
cd ../backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Access http://localhost:8000

## API Reference

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/projects` | Project list |
| GET | `/api/projects/{project_id}` | Project detail |
| GET | `/api/projects/{project_id}/sessions` | Session list |
| GET | `/api/sessions/{session_id}/history` | Session history |
| GET | `/api/sessions/{session_id}/metadata` | Session metadata |
| GET | `/api/sessions/{session_id}/agents` | Background agent logs |
| GET | `/api/sessions/{session_id}/resume-info` | Resume info |
| GET | `/api/sessions/search?q={query}` | Session search |
| POST | `/api/sessions/{session_id}/resume?mode={mode}` | Resume session |
| GET | `/api/sessions/by-date-range` | Sessions by date range |
| GET | `/api/usage/stats?days={days}` | Usage statistics |
| GET | `/api/usage/range?start_date={start}&end_date={end}` | Date range usage statistics |
| POST | `/api/analysis/analyze` | Request prompt analysis |
| GET | `/api/analysis/list` | Analysis list |
| GET | `/api/analysis/{id}` | Analysis detail |
| DELETE | `/api/analysis/{id}` | Delete analysis |
| POST | `/api/analysis/{id}/reanalyze` | Reanalyze |
| POST | `/api/work-analysis/analyze` | Request work analysis |
| GET | `/api/work-analysis/list` | Work analysis list |
| GET | `/api/work-analysis/{id}` | Work analysis detail |
| DELETE | `/api/work-analysis/{id}` | Delete work analysis |
| POST | `/api/work-analysis/{id}/reanalyze` | Reanalyze work |
| GET | `/api/cache/stats` | Cache statistics |
| DELETE | `/api/cache` | Clear all cache |
| DELETE | `/api/cache/{cache_name}` | Clear specific cache |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `/ws/{session_id}` | Real-time session updates |
| `/api/analysis/ws/stream` | Prompt analysis streaming |
| `/api/work-analysis/ws/stream` | Work analysis streaming |

## Project Structure

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
│   ├── index.html          # Landing page entry
│   ├── app.html            # App entry
│   ├── src/
│   │   ├── main.tsx        # App entry point
│   │   ├── landing.tsx     # Landing page entry point
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Landing/    # Landing page components
│   │   │   └── ...
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── lib/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── tauri-app/              # Desktop app (Tauri)
├── scripts/
│   └── dev.sh
└── README.md
```

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Backend | Python 3.11+, FastAPI, uvicorn, watchfiles, pydantic, cachetools |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 4.x |
| Desktop | Tauri |
| State | Zustand |
| UI | Radix UI, Framer Motion, Lucide Icons |
| i18n | i18next |
