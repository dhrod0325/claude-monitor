"""프롬프트 분석 API 라우터"""

import logging
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from models.analysis import Analysis, AnalysisListItem, AnalysisRequest
from services.analysis import analysis_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/analyze", response_model=Analysis)
async def analyze_prompts(request: AnalysisRequest):
    """프롬프트 분석 요청"""
    logger.debug(f"Analysis request: project={request.project_id}, sessions={len(request.session_ids)}")
    try:
        result = await analysis_service.analyze(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list", response_model=list[AnalysisListItem])
async def list_analyses(project_id: str | None = None):
    """저장된 분석 목록 조회"""
    return analysis_service.list_analyses(project_id)


@router.get("/{analysis_id}", response_model=Analysis)
async def get_analysis(analysis_id: str):
    """분석 상세 조회"""
    analysis = analysis_service.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="분석을 찾을 수 없습니다.")
    return analysis


@router.delete("/{analysis_id}")
async def delete_analysis(analysis_id: str):
    """분석 삭제"""
    if analysis_service.delete_analysis(analysis_id):
        return {"success": True}
    raise HTTPException(status_code=404, detail="분석을 찾을 수 없습니다.")


@router.post("/{analysis_id}/reanalyze", response_model=Analysis)
async def reanalyze(analysis_id: str):
    """재분석"""
    try:
        result = await analysis_service.reanalyze(analysis_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/stream")
async def analyze_stream(websocket: WebSocket):
    """스트리밍 분석 WebSocket"""
    await websocket.accept()
    logger.debug("Analysis WebSocket connected")

    try:
        # 요청 데이터 수신
        data = await websocket.receive_json()
        request = AnalysisRequest(**data)

        logger.info(f"[WS] Streaming analysis: project={request.project_id}, sessions={len(request.session_ids)}, model={request.model}")

        # 분석 준비 (프롬프트 추출 및 포맷팅)
        logger.info("[WS] Preparing analysis...")
        prompts, prompt_content = analysis_service.prepare_analysis(request)
        logger.info(f"[WS] Prepared: {len(prompts)} prompts, {len(prompt_content):,} chars")

        await websocket.send_json({
            "type": "start",
            "prompt_count": len(prompts),
        })
        logger.info("[WS] Sent start message, beginning chunked analysis...")

        # 청크 분할 스트리밍 분석 실행
        full_result = ""
        async for chunk in analysis_service._run_chunked_analysis_stream(prompts, request.model):
            full_result += chunk
            await websocket.send_json({
                "type": "chunk",
                "content": chunk,
            })

        # 분석 결과 저장
        analysis = analysis_service._save_analysis(request, len(prompts), full_result, model=request.model)

        await websocket.send_json({
            "type": "complete",
            "analysis": {
                "id": analysis.id,
                "project_id": analysis.project_id,
                "project_name": analysis.project_name,
                "session_ids": analysis.session_ids,
                "prompt_count": analysis.prompt_count,
                "result": analysis.result,
                "model": analysis.model,
                "created_at": analysis.created_at.isoformat(),
                "updated_at": analysis.updated_at.isoformat() if analysis.updated_at else None,
            },
        })

    except WebSocketDisconnect:
        logger.debug("Analysis WebSocket disconnected")
    except ValueError as e:
        await websocket.send_json({"type": "error", "message": str(e)})
    except RuntimeError as e:
        await websocket.send_json({"type": "error", "message": str(e)})
    except Exception as e:
        logger.error(f"Analysis WebSocket error: {e}")
        await websocket.send_json({"type": "error", "message": str(e)})
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
