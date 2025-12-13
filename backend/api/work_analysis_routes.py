"""업무분석 API 라우터"""

import logging
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query

from models.work_analysis import WorkAnalysis, WorkAnalysisListItem, WorkAnalysisRequest
from services.work_analysis import work_analysis_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/work-analysis", tags=["work-analysis"])


@router.post("/analyze", response_model=WorkAnalysis)
async def analyze_work(request: WorkAnalysisRequest):
    """업무분석 요청"""
    logger.debug(f"Work analysis request: {request.date_from} ~ {request.date_to}")
    try:
        result = await work_analysis_service.analyze(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list", response_model=list[WorkAnalysisListItem])
async def list_work_analyses():
    """저장된 분석 목록 조회"""
    return work_analysis_service.list_analyses()


@router.get("/{analysis_id}", response_model=WorkAnalysis)
async def get_work_analysis(analysis_id: str):
    """분석 상세 조회"""
    analysis = work_analysis_service.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="분석을 찾을 수 없습니다.")
    return analysis


@router.delete("/{analysis_id}")
async def delete_work_analysis(analysis_id: str):
    """분석 삭제"""
    if work_analysis_service.delete_analysis(analysis_id):
        return {"success": True}
    raise HTTPException(status_code=404, detail="분석을 찾을 수 없습니다.")


@router.post("/{analysis_id}/reanalyze", response_model=WorkAnalysis)
async def reanalyze_work(analysis_id: str):
    """재분석"""
    try:
        result = await work_analysis_service.reanalyze(analysis_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/stream")
async def work_analyze_stream(websocket: WebSocket):
    """스트리밍 업무분석 WebSocket (청크 기반)"""
    await websocket.accept()
    logger.debug("Work Analysis WebSocket connected")

    try:
        # 요청 데이터 수신
        data = await websocket.receive_json()
        request = WorkAnalysisRequest(**data)

        logger.info(f"[WS] Streaming work analysis: {request.date_from} ~ {request.date_to}, model={request.model}")

        # 청크 기반 스트리밍 분석 실행
        full_result = ""
        sessions = []
        project_names = []

        async for event in work_analysis_service.run_chunked_analysis_stream(request):
            event_type = event.get("type")

            if event_type == "chunk_info":
                await websocket.send_json({
                    "type": "chunk_info",
                    "current_chunk": event.get("current_chunk"),
                    "total_chunks": event.get("total_chunks"),
                    "phase": event.get("phase"),
                })

            elif event_type == "chunk_complete":
                await websocket.send_json({
                    "type": "chunk_complete",
                    "current_chunk": event.get("current_chunk"),
                    "total_chunks": event.get("total_chunks"),
                })

            elif event_type == "text":
                content = event.get("content", "")
                full_result += content
                await websocket.send_json({
                    "type": "chunk",
                    "content": content,
                })

            elif event_type == "phase_complete":
                sessions = event.get("sessions", [])
                project_names = event.get("project_names", [])

        # 분석 결과 저장
        if sessions:
            analysis = work_analysis_service._save_analysis(
                request, sessions, project_names, full_result, model=request.model
            )

            await websocket.send_json({
                "type": "complete",
                "analysis": {
                    "id": analysis.id,
                    "date_from": analysis.date_from,
                    "date_to": analysis.date_to,
                    "project_ids": analysis.project_ids,
                    "project_names": analysis.project_names,
                    "session_ids": analysis.session_ids,
                    "session_count": analysis.session_count,
                    "result": analysis.result,
                    "model": analysis.model,
                    "created_at": analysis.created_at.isoformat(),
                    "updated_at": analysis.updated_at.isoformat() if analysis.updated_at else None,
                },
            })

    except WebSocketDisconnect:
        logger.debug("Work Analysis WebSocket disconnected")
    except ValueError as e:
        await websocket.send_json({"type": "error", "message": str(e)})
    except RuntimeError as e:
        await websocket.send_json({"type": "error", "message": str(e)})
    except Exception as e:
        logger.error(f"Work Analysis WebSocket error: {e}")
        await websocket.send_json({"type": "error", "message": str(e)})
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
