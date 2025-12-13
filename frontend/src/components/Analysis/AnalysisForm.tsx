import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useSessionStore } from '@/stores/sessionStore';
import { ModelSelector } from '@/components/common';
import type { Session, Project, SelectedSession } from '@/types';
import { CheckSquare, Square, Loader2, FolderOpen, X, ListChecks } from 'lucide-react';

interface AnalysisFormProps {
  projectId?: string;
  onAnalyze?: () => void;
}

export function AnalysisForm({ projectId, onAnalyze }: AnalysisFormProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectId || null);

  const { projects } = useSessionStore();
  const {
    selectedSessions,
    selectedModel,
    toggleSessionSelection,
    selectAllSessions,
    clearSelection,
    clearProjectSessions,
    isSessionSelected,
    setSelectedModel,
    error,
    clearError,
  } = useAnalysisStore();

  // 프로젝트 변경 시 세션 로드 (선택 초기화 제거)
  useEffect(() => {
    if (selectedProjectId) {
      loadSessions(selectedProjectId);
    } else {
      setSessions([]);
    }
  }, [selectedProjectId]);

  const loadSessions = async (projId: string) => {
    setLoading(true);
    try {
      const data = await api.getSessions(projId);
      // agent 세션 제외
      setSessions(data.filter((s) => !s.is_agent));
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  // 현재 프로젝트 정보
  const currentProject = useMemo(() => {
    return projects.find((p: Project) => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // 선택된 세션을 프로젝트별로 그룹화
  const selectedByProject = useMemo(() => {
    const grouped: Record<string, SelectedSession[]> = {};
    for (const session of selectedSessions) {
      if (!grouped[session.projectId]) {
        grouped[session.projectId] = [];
      }
      grouped[session.projectId].push(session);
    }
    return grouped;
  }, [selectedSessions]);

  const handleSelectAll = () => {
    if (!currentProject) return;
    const sessionsToSelect: SelectedSession[] = sessions.map((s) => ({
      sessionId: s.id,
      projectId: s.project_id,
      projectName: currentProject.name,
      updatedAt: s.updated_at,
      sizeHuman: s.size_human,
    }));
    selectAllSessions(sessionsToSelect);
  };

  const handleToggleSession = (session: Session) => {
    if (!currentProject) return;
    toggleSessionSelection({
      sessionId: session.id,
      projectId: session.project_id,
      projectName: currentProject.name,
      updatedAt: session.updated_at,
      sizeHuman: session.size_human,
    });
  };

  const handleAnalyze = () => {
    if (selectedSessions.length === 0) return;
    clearError();
    if (onAnalyze) {
      onAnalyze();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Model Selection */}
      <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />

      {/* Selected Sessions Summary */}
      {selectedSessions.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Selected Sessions ({selectedSessions.length})
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear All
              </Button>
              <Button size="sm" onClick={handleAnalyze}>
                Analyze Prompts
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(selectedByProject).map(([projId, projSessions]) => (
              <div
                key={projId}
                className="border rounded-lg px-3 py-2 flex items-center gap-2"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <span className="text-sm font-medium">{projSessions[0]?.projectName}</span>
                <Badge variant="secondary">{projSessions.length}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => clearProjectSessions(projId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Content: Left Projects, Right Sessions */}
      <div className="grid grid-cols-2 gap-4" style={{ minHeight: '60vh' }}>
        {/* Left: Project Selection */}
        <Card className="p-4 flex flex-col h-full">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Select Project
          </h3>
          <div className="flex-1 overflow-y-auto space-y-1">
            {projects.map((project: Project) => {
              const selectedCount = selectedByProject[project.id]?.length || 0;
              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded cursor-pointer transition-colors relative"
                  style={{
                    backgroundColor: selectedProjectId === project.id ? 'var(--color-muted)' : 'transparent',
                    border: selectedProjectId === project.id ? '1px solid var(--color-primary)' : '1px solid transparent',
                  }}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <span className="text-sm font-medium truncate flex-1">{project.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {project.session_count}
                    </Badge>
                    {selectedCount > 0 && (
                      <Badge
                        className="h-5 min-w-5 px-1.5 flex items-center justify-center text-xs"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        {selectedCount}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {projects.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              No projects found
            </p>
          )}
        </Card>

        {/* Right: Session Selection */}
        <Card className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              {selectedProjectId ? `Sessions (${sessions.length})` : 'Select a project'}
            </h3>
            {selectedProjectId && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={sessions.length === 0}>
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearProjectSessions(selectedProjectId)}
                  disabled={!selectedByProject[selectedProjectId]?.length}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {!selectedProjectId ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  Select a project to view sessions
                </p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-muted-foreground)' }} />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  No sessions found in this project
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map((session) => {
                  const isSelected = isSessionSelected(session.id);
                  return (
                    <div
                      key={session.id}
                      className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-opacity-50 transition-colors"
                      style={{
                        backgroundColor: isSelected ? 'var(--color-muted)' : 'transparent',
                      }}
                      onClick={() => handleToggleSession(session)}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                      ) : (
                        <Square className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-muted-foreground)' }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.id.slice(0, 8)}...</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                          {formatDate(session.updated_at)} | {session.size_human}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)' }}
        >
          {error}
        </div>
      )}

      {/* Analyze Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          {selectedSessions.length > 0 ? (
            <>
              {selectedSessions.length} session(s) from{' '}
              {Object.keys(selectedByProject).length} project(s) selected
            </>
          ) : (
            'Select sessions to analyze'
          )}
        </p>
        <Button onClick={handleAnalyze} disabled={selectedSessions.length === 0}>
          Analyze Prompts
        </Button>
      </div>
    </div>
  );
}
