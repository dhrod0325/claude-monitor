import { motion } from 'framer-motion';
import { FolderCode, ChevronRight, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko, enUS, ja, zhCN } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjects } from '@/hooks/useProjects';
import { useSessionStore } from '@/stores/sessionStore';
import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useTranslation } from 'react-i18next';
import type { Project } from '@/types';

interface SidebarProps {
  onProjectSelect?: () => void;
}

export function Sidebar({ onProjectSelect }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const { projects, selectedProject, selectProject, loadProjects } = useProjects();
  const isLoading = useSessionStore((state) => state.isLoading);
  const dateLocales: Record<string, Locale> = { ko, en: enUS, ja, zh: zhCN };
  const dateLocale = dateLocales[i18n.language] || ko;

  const handleProjectClick = (project: Project) => {
    if (selectedProject?.id === project.id) {
      selectProject(null);
    } else {
      selectProject(project);
      onProjectSelect?.();
    }
  };

  return (
    <div
      className="w-64 border-r flex flex-col h-full"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
    >
      <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <FolderCode className="w-4 h-4" style={{ color: 'var(--color-muted-foreground)' }} />
          <span className="text-sm font-medium">{t('sidebar.projects')}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={loadProjects}
          disabled={isLoading}
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="p-2 space-y-1"
        >
          {projects.map((project) => (
            <motion.button
              key={project.id}
              variants={staggerItem}
              onClick={() => handleProjectClick(project)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md transition-colors',
                'hover:bg-accent',
                selectedProject?.id === project.id && 'bg-accent'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate flex-1">{project.name}</span>
                <ChevronRight
                  className={cn(
                    'w-4 h-4 transition-transform',
                    selectedProject?.id === project.id && 'rotate-90'
                  )}
                  style={{ color: 'var(--color-muted-foreground)' }}
                />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-xs"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {project.session_count} {t('common.sessions')}
                </span>
                {project.last_activity && (
                  <span
                    className="text-xs"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {formatDistanceToNow(new Date(project.last_activity), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </span>
                )}
              </div>
            </motion.button>
          ))}

          {projects.length === 0 && !isLoading && (
            <div
              className="text-center py-8 text-sm"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              {t('sidebar.noProjects')}
            </div>
          )}
        </motion.div>
      </ScrollArea>
    </div>
  );
}
