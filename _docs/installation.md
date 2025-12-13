# 설치 가이드

## 사전 요구사항

### 필수 소프트웨어
- Python 3.11 이상
- Node.js 18 이상
- npm 9 이상
- Claude Code CLI (프롬프트 분석 기능 사용 시)

## 설치 방법

### 1. 소스 코드 다운로드

```bash
git clone <repository-url>
cd claude-monitor
```

### 2. Backend 의존성 설치

```bash
cd backend
pip install -r requirements.txt
```

**requirements.txt 주요 패키지:**
- fastapi: REST API 프레임워크
- uvicorn: ASGI 서버
- watchfiles: 파일 변경 감시
- pydantic: 데이터 검증
- cachetools: 캐싱

### 3. Frontend 의존성 설치

```bash
cd frontend
npm install
```

## 실행 방법

### 개발 모드 (권장)

프로젝트 루트에서 실행:

```bash
./scripts/dev.sh
```

이 명령은 다음을 동시에 실행합니다:
- Backend 서버: http://localhost:8000
- Frontend 개발 서버: http://localhost:5173
- API Docs: http://localhost:8000/docs

코드 변경 시 자동 재시작됩니다.

### 프로덕션 모드

```bash
# Frontend 빌드
cd frontend
npm run build

# Backend 실행 (정적 파일 서빙 포함)
cd ../backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

통합 서버: http://localhost:8000

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

## 설정

### 데이터 디렉토리

Claude Monitor는 다음 디렉토리를 사용합니다:

| 경로 | 용도 |
|------|------|
| `~/.claude/projects/` | Claude Code 프로젝트 및 세션 |
| `~/.claude-monitor/analyses/` | 분석 결과 저장 |

### 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `HOST` | 127.0.0.1 | 서버 바인딩 주소 |
| `PORT` | 8000 | 서버 포트 |

## 문제 해결

### Backend 실행 오류

**증상:** `ModuleNotFoundError: No module named 'fastapi'`

**해결:**
```bash
pip install -r backend/requirements.txt
```

### Frontend 빌드 오류

**증상:** `npm ERR! code ENOENT`

**해결:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 포트 충돌

**증상:** `Address already in use`

**해결:**
```bash
# 사용 중인 프로세스 확인
lsof -i :8000
lsof -i :5173

# 프로세스 종료
kill -9 <PID>
```

### 개발 스크립트 권한 오류 (macOS/Linux)

**증상:** `permission denied: ./scripts/dev.sh`

**해결:**
```bash
chmod +x ./scripts/dev.sh
```
