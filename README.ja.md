# Claude Monitor

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md)

![screen.png](frontend/public/screenshot/screen.png)

Claude Codeセッションをリアルタイムで監視・分析するWebアプリケーション

## 概要

Claude MonitorはClaude Codeのセッションデータを可視化し、開発活動を追跡・分析します。
リアルタイム監視、使用量統計、AI駆動のプロンプト/業務分析機能を提供します。

## デモ

https://dhrod0325.github.io/claude-monitor/

## ダウンロード

| プラットフォーム | ダウンロード |
|------------------|--------------|
| macOS (Apple Silicon) | [Claude.Monitor_0.1.2_aarch64.dmg](https://github.com/dhrod0325/claude-monitor/releases/download/v0.1.2/Claude.Monitor_0.1.2_aarch64.dmg) |
| Windows (x64) | [Claude.Monitor_0.1.2_x64-setup.exe](https://github.com/dhrod0325/claude-monitor/releases/download/v0.1.2/Claude.Monitor_0.1.2_x64-setup.exe) |
| Linux (x64) | [Claude.Monitor_0.1.2_amd64.AppImage](https://github.com/dhrod0325/claude-monitor/releases/download/v0.1.2/Claude.Monitor_0.1.2_amd64.AppImage) |

> 全リリースを見る: [Releases](https://github.com/dhrod0325/claude-monitor/releases)

## 目次

- [ダウンロード](#ダウンロード)
- [機能](#機能)
- [要件](#要件)
- [インストール](#インストール)
- [使用方法](#使用方法)
- [APIリファレンス](#apiリファレンス)
- [プロジェクト構造](#プロジェクト構造)

## 機能

### セッション監視
- プロジェクト/セッション一覧表示
- セッション履歴のリアルタイム監視 (WebSocket)
- セッション検索とフィルタリング
- ツール呼び出しの可視化
- セッション再開 (continue/resume)
- バックグラウンドエージェントログの表示

### 使用量ダッシュボード
- 総コスト、セッション数、トークン使用量サマリー
- モデル別/プロジェクト別使用量統計
- 日別タイムラインチャート
- 日付範囲フィルター (7日、30日、全期間)

### プロンプト分析
- Claude CLIによるプロンプトパターン分析
- リアルタイムストリーミング分析結果
- 分析履歴の保存/表示/削除

### 業務分析
- 日付範囲に基づく業務分析
- チャンクベースのストリーミング分析
- 分析モデル選択対応

### 国際化
- 韓国語、英語、日本語、中国語対応
- ブラウザ言語自動検出

### パフォーマンス
- インメモリTTLベースキャッシング
- キャッシュ統計と管理API

## 要件

| コンポーネント | バージョン |
|----------------|------------|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

## インストール

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

### 開発モード

開発スクリプトを使用してBackendとFrontendを同時に実行します。
コード変更時に自動リロードされます。

```bash
./scripts/dev.sh
```

- ランディングページ: http://localhost:5173
- アプリ: http://localhost:5173/app.html
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Backendのみ実行

```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontendのみ実行

```bash
cd frontend
npm run dev
```

### プロダクションモード

```bash
# Frontendビルド
cd frontend
npm run build

# Backend実行 (静的ファイル配信含む)
cd ../backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

http://localhost:8000 にアクセス

## APIリファレンス

### REST API

| メソッド | エンドポイント | 説明 |
|----------|----------------|------|
| GET | `/api/health` | ヘルスチェック |
| GET | `/api/projects` | プロジェクト一覧 |
| GET | `/api/projects/{project_id}` | プロジェクト詳細 |
| GET | `/api/projects/{project_id}/sessions` | セッション一覧 |
| GET | `/api/sessions/{session_id}/history` | セッション履歴 |
| GET | `/api/sessions/{session_id}/metadata` | セッションメタデータ |
| GET | `/api/sessions/{session_id}/agents` | バックグラウンドエージェントログ |
| GET | `/api/sessions/{session_id}/resume-info` | 再開情報 |
| GET | `/api/sessions/search?q={query}` | セッション検索 |
| POST | `/api/sessions/{session_id}/resume?mode={mode}` | セッション再開 |
| GET | `/api/sessions/by-date-range` | 日付範囲でセッション取得 |
| GET | `/api/usage/stats?days={days}` | 使用量統計 |
| GET | `/api/usage/range?start_date={start}&end_date={end}` | 日付範囲使用量統計 |
| POST | `/api/analysis/analyze` | プロンプト分析リクエスト |
| GET | `/api/analysis/list` | 分析一覧 |
| GET | `/api/analysis/{id}` | 分析詳細 |
| DELETE | `/api/analysis/{id}` | 分析削除 |
| POST | `/api/analysis/{id}/reanalyze` | 再分析 |
| POST | `/api/work-analysis/analyze` | 業務分析リクエスト |
| GET | `/api/work-analysis/list` | 業務分析一覧 |
| GET | `/api/work-analysis/{id}` | 業務分析詳細 |
| DELETE | `/api/work-analysis/{id}` | 業務分析削除 |
| POST | `/api/work-analysis/{id}/reanalyze` | 業務分析再分析 |
| GET | `/api/cache/stats` | キャッシュ統計 |
| DELETE | `/api/cache` | 全キャッシュクリア |
| DELETE | `/api/cache/{cache_name}` | 特定キャッシュクリア |

### WebSocket

| エンドポイント | 説明 |
|----------------|------|
| `/ws/{session_id}` | リアルタイムセッション更新 |
| `/api/analysis/ws/stream` | プロンプト分析ストリーミング |
| `/api/work-analysis/ws/stream` | 業務分析ストリーミング |

## プロジェクト構造

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
│   ├── index.html          # ランディングページエントリー
│   ├── app.html            # アプリエントリー
│   ├── src/
│   │   ├── main.tsx        # アプリエントリーポイント
│   │   ├── landing.tsx     # ランディングページエントリーポイント
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Landing/    # ランディングページコンポーネント
│   │   │   └── ...
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── lib/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── tauri-app/              # デスクトップアプリ (Tauri)
├── scripts/
│   └── dev.sh
└── README.md
```

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| Backend | Python 3.11+, FastAPI, uvicorn, watchfiles, pydantic, cachetools |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 4.x |
| Desktop | Tauri |
| 状態管理 | Zustand |
| UI | Radix UI, Framer Motion, Lucide Icons |
| 国際化 | i18next |
