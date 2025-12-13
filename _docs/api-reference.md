# API 레퍼런스

## 개요

Claude Monitor는 REST API와 WebSocket API를 제공합니다.

- Base URL: `http://localhost:8000`
- API Prefix: `/api`
- API Docs: `http://localhost:8000/docs` (Swagger UI)

## REST API

### 헬스체크

```
GET /api/health
```

**응답 예시:**
```json
{
  "status": "healthy"
}
```

---

### 프로젝트 API

#### 프로젝트 목록 조회

```
GET /api/projects
```

**응답 예시:**
```json
{
  "projects": [
    {
      "id": "L1VzZXJzL3VzZXIvcHJvamVjdA==",
      "name": "project",
      "path": "/Users/user/project",
      "session_count": 5,
      "last_active": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### 프로젝트 상세 조회

```
GET /api/projects/{project_id}
```

**경로 파라미터:**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| project_id | string | Base64 인코딩된 프로젝트 ID |

---

### 세션 API

#### 프로젝트의 세션 목록

```
GET /api/projects/{project_id}/sessions
```

**응답 예시:**
```json
{
  "sessions": [
    {
      "id": "abc123-def456",
      "project_id": "L1VzZXJz...",
      "created_at": "2024-01-15T09:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "message_count": 42
    }
  ]
}
```

#### 세션 히스토리 조회

```
GET /api/sessions/{session_id}/history
```

**쿼리 파라미터:**
| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| limit | integer | 100 | 최대 메시지 수 |

**응답 예시:**
```json
{
  "messages": [
    {
      "type": "human",
      "content": "안녕하세요",
      "timestamp": "2024-01-15T09:00:00Z"
    },
    {
      "type": "assistant",
      "content": "안녕하세요! 무엇을 도와드릴까요?",
      "timestamp": "2024-01-15T09:00:05Z",
      "tool_calls": []
    }
  ]
}
```

#### 세션 메타데이터 조회

```
GET /api/sessions/{session_id}/metadata
```

**응답 예시:**
```json
{
  "session_id": "abc123-def456",
  "summary": "프로젝트 설정 및 코드 리뷰",
  "first_message": "새 프로젝트를 시작하려고 합니다",
  "message_count": 42,
  "created_at": "2024-01-15T09:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "usage": {
    "input_tokens": 15000,
    "output_tokens": 8000,
    "cost_usd": 0.45
  }
}
```

#### 세션 재개 정보

```
GET /api/sessions/{session_id}/resume-info
```

**응답 예시:**
```json
{
  "session_id": "abc123-def456",
  "project_path": "/Users/user/project",
  "can_resume": true,
  "commands": {
    "continue": "claude --continue abc123-def456",
    "resume": "claude --resume abc123-def456"
  }
}
```

#### 세션 재개

```
POST /api/sessions/{session_id}/resume?mode={mode}
```

| mode | 설명 |
|------|------|
| continue | 기존 컨텍스트 유지하며 재개 |
| resume | 새 컨텍스트로 재개 |

#### 세션 검색

```
GET /api/sessions/search
```

**쿼리 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| q | string | Y | 검색 키워드 |
| project_id | string | N | 프로젝트 필터 |

#### 에이전트 로그 조회

```
GET /api/sessions/{session_id}/agents
```

백그라운드 에이전트의 실행 로그를 조회합니다.

#### 날짜 범위 세션 조회

```
GET /api/sessions/by-date-range
```

**쿼리 파라미터:**
| 파라미터 | 타입 | 형식 | 설명 |
|----------|------|------|------|
| date_from | string | YYYY-MM-DD | 시작일 |
| date_to | string | YYYY-MM-DD | 종료일 |
| project_ids | array | - | 프로젝트 ID 목록 (선택) |

**응답 예시:**
```json
{
  "projects": [
    {
      "project_id": "L1VzZXJz...",
      "project_name": "my-project",
      "sessions": [
        {
          "id": "abc123",
          "created_at": "2024-01-15T09:00:00Z",
          "summary": "API 개발"
        }
      ]
    }
  ]
}
```

---

### 사용량 API

#### 사용량 통계

```
GET /api/usage/stats
```

**쿼리 파라미터:**
| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| days | integer | null | 조회 기간 (일) |

**응답 예시:**
```json
{
  "summary": {
    "total_sessions": 150,
    "total_cost_usd": 25.50,
    "total_input_tokens": 500000,
    "total_output_tokens": 250000
  },
  "by_model": [
    {
      "model": "claude-3-opus",
      "sessions": 50,
      "input_tokens": 200000,
      "output_tokens": 100000,
      "cost_usd": 15.00
    }
  ],
  "by_project": [
    {
      "project_id": "L1VzZXJz...",
      "project_name": "my-project",
      "sessions": 30,
      "cost_usd": 5.00
    }
  ],
  "by_date": [
    {
      "date": "2024-01-15",
      "sessions": 10,
      "cost_usd": 1.50
    }
  ]
}
```

#### 날짜 범위 통계

```
GET /api/usage/range
```

**쿼리 파라미터:**
| 파라미터 | 타입 | 형식 | 설명 |
|----------|------|------|------|
| start_date | string | ISO format | 시작일 |
| end_date | string | ISO format | 종료일 |

---

### 분석 API

#### 분석 요청

```
POST /api/analysis/analyze
```

**요청 본문:**
```json
{
  "project_id": "L1VzZXJz...",
  "session_ids": ["abc123", "def456"]
}
```

**응답:**
분석 결과는 WebSocket을 통해 스트리밍됩니다.

```json
{
  "analysis_id": "ana-789",
  "status": "started"
}
```

#### 분석 목록 조회

```
GET /api/analysis/list
```

**쿼리 파라미터:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| project_id | string | N | 프로젝트 필터 |

**응답 예시:**
```json
{
  "analyses": [
    {
      "id": "ana-789",
      "project_id": "L1VzZXJz...",
      "session_ids": ["abc123", "def456"],
      "created_at": "2024-01-15T10:00:00Z",
      "status": "completed"
    }
  ]
}
```

#### 분석 상세 조회

```
GET /api/analysis/{id}
```

**응답 예시:**
```json
{
  "id": "ana-789",
  "project_id": "L1VzZXJz...",
  "session_ids": ["abc123", "def456"],
  "result": "## 분석 결과\n\n### 주요 패턴...",
  "created_at": "2024-01-15T10:00:00Z",
  "completed_at": "2024-01-15T10:05:00Z"
}
```

#### 분석 삭제

```
DELETE /api/analysis/{id}
```

#### 재분석

```
POST /api/analysis/{id}/reanalyze
```

---

### 업무분석 API

#### 업무분석 요청

```
POST /api/work-analysis/analyze
```

**요청 본문:**
```json
{
  "date_from": "2024-01-01",
  "date_to": "2024-01-31",
  "project_ids": ["L1VzZXJz..."],
  "model": "sonnet"
}
```

#### 업무분석 목록 조회

```
GET /api/work-analysis/list
```

#### 업무분석 상세 조회

```
GET /api/work-analysis/{id}
```

#### 업무분석 삭제

```
DELETE /api/work-analysis/{id}
```

#### 업무분석 재분석

```
POST /api/work-analysis/{id}/reanalyze
```

---

### 캐시 API

#### 캐시 통계 조회

```
GET /api/cache/stats
```

**응답 예시:**
```json
{
  "caches": {
    "projects": {
      "size": 5,
      "maxsize": 32,
      "ttl": 30,
      "hits": 100,
      "misses": 10
    },
    "sessions": {
      "size": 20,
      "maxsize": 64,
      "ttl": 30,
      "hits": 500,
      "misses": 50
    }
  }
}
```

#### 전체 캐시 클리어

```
DELETE /api/cache
```

#### 특정 캐시 클리어

```
DELETE /api/cache/{cache_name}
```

| cache_name | 설명 |
|------------|------|
| projects | 프로젝트 캐시 |
| sessions | 세션 캐시 |
| metadata | 메타데이터 캐시 |
| analyses | 분석 결과 캐시 |

---

## WebSocket API

### 세션 실시간 업데이트

```
WS /ws/{session_id}
```

세션 파일 변경을 실시간으로 감지하여 새 메시지를 전송합니다.

**수신 메시지 형식:**
```json
{
  "type": "new_messages",
  "messages": [
    {
      "type": "assistant",
      "content": "새로운 응답입니다",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**연결 종료:**
```json
{
  "type": "close",
  "reason": "session_ended"
}
```

### 분석 스트리밍

```
WS /api/analysis/ws/stream
```

프롬프트 분석 진행 상황을 실시간으로 수신합니다.

**수신 메시지 형식:**

청크 처리 중:
```json
{
  "type": "chunk",
  "chunk_index": 1,
  "total_chunks": 5,
  "content": "청크 분석 결과..."
}
```

분석 완료:
```json
{
  "type": "complete",
  "analysis_id": "ana-789",
  "result": "## 최종 분석 결과\n\n..."
}
```

오류 발생:
```json
{
  "type": "error",
  "message": "분석 중 오류가 발생했습니다"
}
```

### 업무분석 스트리밍

```
WS /api/work-analysis/ws/stream
```

업무분석 진행 상황을 실시간으로 수신합니다.

---

## 오류 응답

모든 API는 오류 발생 시 다음 형식으로 응답합니다:

```json
{
  "detail": "오류 메시지"
}
```

**HTTP 상태 코드:**
| 코드 | 설명 |
|------|------|
| 400 | 잘못된 요청 |
| 404 | 리소스 없음 |
| 500 | 서버 오류 |

---

## 인증

현재 버전은 인증을 요구하지 않습니다. 로컬 환경에서의 사용을 전제로 합니다.

---

## Rate Limiting

현재 버전은 Rate Limiting을 적용하지 않습니다.
