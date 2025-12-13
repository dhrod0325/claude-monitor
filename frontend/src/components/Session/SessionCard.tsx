import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ko, enUS, ja, zhCN } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { MessageSquare, HardDrive, Bot, Play, RotateCcw, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import type { Session, SearchResult } from '@/types';

interface SessionCardProps {
  session: Session | SearchResult;
  index?: number;
  onSelect?: (id: string) => void;
}

function isSearchResult(item: Session | SearchResult): item is SearchResult {
  return 'summary' in item;
}

export function SessionCard({ session, index = 0, onSelect }: SessionCardProps) {
  const { t, i18n } = useTranslation();
  const dateLocales: Record<string, Locale> = { ko, en: enUS, ja, zh: zhCN };
  const dateLocale = dateLocales[i18n.language] || ko;
  const updatedAt = 'updated_at' in session ? session.updated_at : null;
  const timeAgo = updatedAt
    ? formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: dateLocale })
    : '';

  const sessionId = isSearchResult(session) ? session.session_id : session.id;
  const sizeHuman = session.size_human;
  const isAgent = !isSearchResult(session) && session.is_agent;

  const copyCommand = async (mode: 'continue' | 'resume') => {
    const command = `claude --${mode} ${sessionId}`;
    await navigator.clipboard.writeText(command);
    alert(`${t('common.copied')}: ${command}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.03 }}
    >
      <Card className="group hover:border-primary/50 transition-colors shimmer-hover">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <span
              className="font-mono text-xs"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              {sessionId.slice(0, 8)}...
              {isAgent && (
                <span className="ml-2 text-destructive">[{t('sessionCard.agent')}]</span>
              )}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              {timeAgo}
            </span>
          </div>

          {isSearchResult(session) && session.summary && (
            <h3 className="font-medium mb-2 line-clamp-2">{session.summary}</h3>
          )}

          {isSearchResult(session) && session.first_message && (
            <p
              className="text-sm mb-3 line-clamp-2"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              "{session.first_message}"
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {isSearchResult(session) && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-secondary-foreground)' }}
              >
                <MessageSquare className="w-3 h-3" />
                {session.message_count}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
              style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-secondary-foreground)' }}
            >
              <HardDrive className="w-3 h-3" />
              {sizeHuman}
            </span>
            {isSearchResult(session) && session.has_agents && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-destructive)' }}
              >
                <Bot className="w-3 h-3" />
                {session.agent_count}
              </span>
            )}
          </div>

          {isSearchResult(session) && session.project_path && (
            <p
              className="text-xs mb-3 truncate"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              {session.project_path}
            </p>
          )}

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="secondary" size="sm" onClick={() => onSelect?.(sessionId)}>
              <Eye className="w-4 h-4 mr-1" />
              {t('sessionCard.view')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyCommand('continue')}>
              <Play className="w-4 h-4 mr-1" />
              {t('sessionCard.continue')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => copyCommand('resume')}>
              <RotateCcw className="w-4 h-4 mr-1" />
              {t('sessionCard.resume')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
