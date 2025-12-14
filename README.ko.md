# Claude Monitor

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md)

![screen.png](frontend/public/screenshot/screen.png)

Claude Code 세션을 실시간으로 모니터링하고 분석하는 웹 애플리케이션

## 개요

Claude Monitor는 Claude Code의 세션 데이터를 시각화하여 개발 활동을 추적하고 분석합니다.
실시간 모니터링, 사용량 통계, AI 기반 프롬프트/업무 분석 기능을 제공합니다.

## 데모

https://dhrod0325.github.io/claude-monitor/

## 다운로드

| 플랫폼 | 다운로드 |
|--------|----------|
| macOS (Apple Silicon) | [Claude.Monitor_0.1.3_aarch64.dmg](https://github.com/dhrod0325/claude-monitor/releases/download/v0.1.3/Claude.Monitor_0.1.3_aarch64.dmg) |
| Windows (x64) | [Claude.Monitor_0.1.3_x64-setup.exe](https://github.com/dhrod0325/claude-monitor/releases/download/v0.1.3/Claude.Monitor_0.1.3_x64-setup.exe) |
| Linux (x64) | [Claude.Monitor_0.1.3_amd64.AppImage](https://github.com/dhrod0325/claude-monitor/releases/download/v0.1.3/Claude.Monitor_0.1.3_amd64.AppImage) |

> 모든 릴리스 보기: [Releases](https://github.com/dhrod0325/claude-monitor/releases)

## 목차

- [다운로드](#다운로드)
- [기능](#기능)
- [요구사항](#요구사항)
- [설치](#설치)
- [사용법](#사용법)
- [API 레퍼런스](#api-레퍼런스)
- [프로젝트 구조](#프로젝트-구조)

## 기능

### 세션 모니터링

- 프로젝트/세션 목록 조회
- 세션 히스토리 실시간 모니터링 (WebSocket)
- 세션 검색 및 필터링
- 도구 호출 시각화
- 세션 재개 (continue/resume)
- 백그라운드 에이전트 로그 조회

### 사용량 대시보드

- 총 비용, 세션 수, 토큰 사용량 요약
- 모델별/프로젝트별 사용량 통계
- 일별 타임라인 차트
- 날짜 범위 필터 (7일, 30일, 전체)

### 프롬프트 분석

- Claude CLI를 통한 프롬프트 패턴 분석
- 실시간 스트리밍 분석 결과
- 분석 기록 저장/조회/삭제

### 업무 분석

- 날짜 범위 기반 업무 분석
- 청크 기반 스트리밍 분석
- 분석 모델 선택 지원

### 다국어 지원

- 한국어, 영어, 일본어, 중국어 지원
- 브라우저 언어 자동 감지

### 성능

- In-Memory TTL 기반 캐싱
- 캐시 통계 조회 및 관리 API

## 요구사항

| 구성요소    | 버전    |
|---------|-------|
| Python  | 3.11+ |
| Node.js | 18+   |
| npm     | 9+    |

## 설치

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

## 사용법

### 개발 모드

개발 스크립트를 사용하여 Backend와 Frontend를 동시에 실행합니다.
코드 변경 시 자동으로 리로드됩니다.

```bash
./scripts/dev.sh
```

- 랜딩 페이지: http://localhost:5173
- 앱: http://localhost:5173/app.html
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Backend만 실행

```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend만 실행

```bash
cd frontend
npm run dev
```

### 프로덕션 모드

```bash
# Frontend 빌드
cd frontend
npm run build

# Backend 실행 (정적 파일 서빙 포함)
cd ../backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

http://localhost:8000 접속

## API 레퍼런스

### REST API

| 메서드    | 엔드포인트                                                | 설명            |
|--------|------------------------------------------------------|---------------|
| GET    | `/api/health`                                        | 헬스 체크         |
| GET    | `/api/projects`                                      | 프로젝트 목록       |
| GET    | `/api/projects/{project_id}`                         | 프로젝트 상세       |
| GET    | `/api/projects/{project_id}/sessions`                | 세션 목록         |
| GET    | `/api/sessions/{session_id}/history`                 | 세션 히스토리       |
| GET    | `/api/sessions/{session_id}/metadata`                | 세션 메타데이터      |
| GET    | `/api/sessions/{session_id}/agents`                  | 백그라운드 에이전트 로그 |
| GET    | `/api/sessions/{session_id}/resume-info`             | 재개 정보         |
| GET    | `/api/sessions/search?q={query}`                     | 세션 검색         |
| POST   | `/api/sessions/{session_id}/resume?mode={mode}`      | 세션 재개         |
| GET    | `/api/sessions/by-date-range`                        | 날짜 범위로 세션 조회  |
| GET    | `/api/usage/stats?days={days}`                       | 사용량 통계        |
| GET    | `/api/usage/range?start_date={start}&end_date={end}` | 날짜 범위 사용량 통계  |
| POST   | `/api/analysis/analyze`                              | 프롬프트 분석 요청    |
| GET    | `/api/analysis/list`                                 | 분석 목록         |
| GET    | `/api/analysis/{id}`                                 | 분석 상세         |
| DELETE | `/api/analysis/{id}`                                 | 분석 삭제         |
| POST   | `/api/analysis/{id}/reanalyze`                       | 재분석           |
| POST   | `/api/work-analysis/analyze`                         | 업무분석 요청       |
| GET    | `/api/work-analysis/list`                            | 업무분석 목록       |
| GET    | `/api/work-analysis/{id}`                            | 업무분석 상세       |
| DELETE | `/api/work-analysis/{id}`                            | 업무분석 삭제       |
| POST   | `/api/work-analysis/{id}/reanalyze`                  | 업무분석 재분석      |
| GET    | `/api/cache/stats`                                   | 캐시 통계         |
| DELETE | `/api/cache`                                         | 전체 캐시 클리어     |
| DELETE | `/api/cache/{cache_name}`                            | 특정 캐시 클리어     |

### WebSocket

| 엔드포인트                          | 설명           |
|--------------------------------|--------------|
| `/ws/{session_id}`             | 실시간 세션 업데이트  |
| `/api/analysis/ws/stream`      | 프롬프트 분석 스트리밍 |
| `/api/work-analysis/ws/stream` | 업무분석 스트리밍    |

## 프로젝트 구조

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
│   ├── index.html          # 랜딩 페이지 엔트리
│   ├── app.html            # 앱 엔트리
│   ├── src/
│   │   ├── main.tsx        # 앱 엔트리포인트
│   │   ├── landing.tsx     # 랜딩 페이지 엔트리포인트
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Landing/    # 랜딩 페이지 컴포넌트
│   │   │   └── ...
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── lib/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── tauri-app/              # 데스크톱 앱 (Tauri)
├── scripts/
│   └── dev.sh
└── README.md
```

## 기술 스택

| 레이어      | 기술                                                               |
|----------|------------------------------------------------------------------|
| Backend  | Python 3.11+, FastAPI, uvicorn, watchfiles, pydantic, cachetools |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 4.x                     |
| Desktop  | Tauri                                                            |
| 상태관리     | Zustand                                                          |
| UI       | Radix UI, Framer Motion, Lucide Icons                            |
| 다국어      | i18next                                                          |
