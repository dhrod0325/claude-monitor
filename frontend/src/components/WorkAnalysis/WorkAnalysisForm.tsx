import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';
import { useWorkAnalysisStore } from '@/stores/workAnalysisStore';
import { ModelSelector } from '@/components/common';
import { api } from '@/services/api';
import type { Project, Session } from '@/types';
import { Calendar, Loader2, FolderOpen, Check } from 'lucide-react';

interface ProjectWithSessions {
  project: Project;
  sessions: Session[];
  sessionCount: number;
}

export function WorkAnalysisForm({ onAnalyze }: { onAnalyze: () => void }) {
  const { t } = useTranslation();
  const {
    selectedDateFrom,
    selectedDateTo,
    selectedProjectIds,
    selectedModel,
    setDateFrom,
    setDateTo,
    toggleProjectSelection,
    selectProjects,
    clearProjectSelection,
    setSelectedModel,
  } = useWorkAnalysisStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsWithSessions, setProjectsWithSessions] = useState<ProjectWithSessions[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // 프로젝트 목록 로드
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const data = await api.getProjects();
        setProjects(data);
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    loadProjects();
  }, []);

  // 날짜 범위가 변경되면 세션 수 업데이트
  useEffect(() => {
    const loadSessionCounts = async () => {
      if (!selectedDateFrom || !selectedDateTo || projects.length === 0) {
        setProjectsWithSessions([]);
        return;
      }

      setIsLoadingSessions(true);
      try {
        const data = await api.getSessionsByDateRange(selectedDateFrom, selectedDateTo);
        const projectMap = new Map(projects.map(p => [p.id, p]));

        const result: ProjectWithSessions[] = data.map(item => ({
          project: projectMap.get(item.project_id) || {
            id: item.project_id,
            name: item.project_name,
            path: '',
            session_count: 0,
            last_activity: null,
          },
          sessions: item.sessions,
          sessionCount: item.sessions.length,
        })).filter(item => item.sessionCount > 0);

        setProjectsWithSessions(result);
      } catch (err) {
        console.error('Failed to load session counts:', err);
        setProjectsWithSessions([]);
      } finally {
        setIsLoadingSessions(false);
      }
    };
    loadSessionCounts();
  }, [selectedDateFrom, selectedDateTo, projects]);

  // 선택된 프로젝트의 총 세션 수
  const totalSelectedSessions = useMemo(() => {
    if (selectedProjectIds.length === 0) {
      return projectsWithSessions.reduce((sum, p) => sum + p.sessionCount, 0);
    }
    return projectsWithSessions
      .filter(p => selectedProjectIds.includes(p.project.id))
      .reduce((sum, p) => sum + p.sessionCount, 0);
  }, [selectedProjectIds, projectsWithSessions]);

  // 전체 선택
  const handleSelectAll = () => {
    selectProjects(projectsWithSessions.map(p => p.project.id));
  };

  // 분석 시작 가능 여부
  const canAnalyze = totalSelectedSessions > 0;

  return (
    <div className="space-y-6">
      {/* 모델 선택 */}
      <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />

      {/* 날짜 선택 */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {t('workAnalysis.dateRange', '분석 기간')}
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              type="date"
              value={selectedDateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full"
            />
          </div>
          <span style={{ color: 'var(--color-muted-foreground)' }}>~</span>
          <div className="flex-1">
            <Input
              type="date"
              value={selectedDateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* 프로젝트 선택 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            {t('workAnalysis.selectProjects', '프로젝트 선택')}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={projectsWithSessions.length === 0}
            >
              {t('workAnalysis.selectAll', '전체선택')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearProjectSelection}
              disabled={selectedProjectIds.length === 0}
            >
              {t('workAnalysis.clearSelection', '선택해제')}
            </Button>
          </div>
        </div>

        {isLoadingProjects || isLoadingSessions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-muted-foreground)' }} />
          </div>
        ) : projectsWithSessions.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {t('workAnalysis.noSessionsInPeriod', '선택한 기간에 세션이 없습니다')}
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {projectsWithSessions.map(({ project, sessionCount }) => {
                const isSelected = selectedProjectIds.length === 0 || selectedProjectIds.includes(project.id);
                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isSelected ? 'var(--color-accent)' : 'transparent',
                      border: '1px solid var(--color-border)',
                    }}
                    onClick={() => toggleProjectSelection(project.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center"
                        style={{
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                          border: isSelected ? 'none' : '1px solid var(--color-border)',
                        }}
                      >
                        {isSelected && <Check className="h-3 w-3" style={{ color: 'var(--color-primary-foreground)' }} />}
                      </div>
                      <span className="text-sm font-medium">{project.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {sessionCount} {t('workAnalysis.sessions', '세션')}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* 분석 시작 버튼 */}
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          {t('workAnalysis.selectedSessions', { count: totalSelectedSessions, defaultValue: `선택된 세션: ${totalSelectedSessions}개` })}
        </span>
        <Button onClick={onAnalyze} disabled={!canAnalyze}>
          {t('workAnalysis.startAnalysis', '분석 시작')}
        </Button>
      </div>
    </div>
  );
}
