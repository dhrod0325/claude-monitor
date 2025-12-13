import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAnalysisStore } from '@/stores/analysisStore';
import { Loader2, Trash2, Eye, FileText } from 'lucide-react';

export function AnalysisList() {
  const { analyses, isLoading, fetchAnalyses, fetchAnalysis, deleteAnalysis } = useAnalysisStore();

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleView = (analysisId: string) => {
    fetchAnalysis(analysisId);
  };

  const handleDelete = async (analysisId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this analysis?')) {
      await deleteAnalysis(analysisId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-muted-foreground)' }} />
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <FileText className="h-12 w-12 mb-4" style={{ color: 'var(--color-muted-foreground)' }} />
          <h3 className="text-lg font-semibold mb-2">No Analysis History</h3>
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Start by selecting sessions and running your first analysis
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((analysis) => (
        <Card
          key={analysis.id}
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleView(analysis.id)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{analysis.project_name}</Badge>
                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {formatDate(analysis.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                <span>{analysis.session_count} session(s)</span>
                <span>{analysis.prompt_count} prompt(s)</span>
              </div>
              <p
                className="text-sm mt-2 line-clamp-2"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                {analysis.summary}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => handleView(analysis.id)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDelete(analysis.id, e)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
