import { motion } from 'framer-motion';
import { useSessionStore } from '@/stores/sessionStore';
import { SessionCard } from './SessionCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { staggerContainer } from '@/lib/animations';
import { useTranslation } from 'react-i18next';

interface SessionListProps {
  onSelectSession?: (sessionId: string) => void;
}

export function SessionList({ onSelectSession }: SessionListProps) {
  const { t } = useTranslation();
  const { sessions, selectedProject, searchResults, searchQuery } = useSessionStore();

  const displaySessions = searchQuery ? searchResults : sessions;

  if (!selectedProject && !searchQuery) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: 'var(--color-muted-foreground)' }}>
          {t('sessionList.selectProject')}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-4">
        {searchQuery && (
          <div className="mb-4">
            <h2 className="text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
              {t('sessionList.searchResults', { query: searchQuery, count: searchResults.length })}
            </h2>
          </div>
        )}

        {!searchQuery && selectedProject && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold">{selectedProject.name}</h2>
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              {selectedProject.path}
            </p>
          </div>
        )}

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {displaySessions.map((session, index) => (
            <SessionCard
              key={'session_id' in session ? session.session_id : session.id}
              session={session}
              index={index}
              onSelect={onSelectSession}
            />
          ))}

          {displaySessions.length === 0 && (
            <div
              className="text-center py-12"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              {searchQuery ? t('sessionList.noSearchResults') : t('sessionList.noSessions')}
            </div>
          )}
        </motion.div>
      </div>
    </ScrollArea>
  );
}
