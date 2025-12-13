# Claude Monitor 사용 매뉴얼

Claude Monitor는 Claude Code 세션을 실시간으로 모니터링하고 분석하는 웹 애플리케이션입니다.

## 문서 목차

1. [설치 가이드](./installation.md) - 설치 및 실행 방법
2. [기능 가이드](./features.md) - 주요 기능 사용법
3. [API 레퍼런스](./api-reference.md) - REST API 및 WebSocket API

## 주요 기능

- 세션 모니터링: Claude Code 세션 실시간 추적
- 사용량 분석: 토큰 사용량 및 비용 통계
- 프롬프트 분석: AI 기반 프롬프트 패턴 분석
- 업무 분석: 기간별 작업 내역 분석

## 시스템 요구사항

### Backend
- Python 3.11 이상
- pip (Python 패키지 관리자)

### Frontend
- Node.js 18 이상
- npm 9 이상

## 빠른 시작

```bash
# 프로젝트 클론
git clone <repository-url>
cd claude-monitor

# 의존성 설치
cd backend && pip install -r requirements.txt && cd ..
cd frontend && npm install && cd ..

# 개발 모드 실행
./scripts/dev.sh
```

브라우저에서 http://localhost:5173 접속

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | Python, FastAPI, uvicorn, watchfiles, pydantic, cachetools |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| 상태관리 | Zustand |
| UI | Radix UI, Framer Motion |
