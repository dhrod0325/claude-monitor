import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AnalysisPageLayoutProps {
  title: string;
  description: string;
  activeTab: 'new' | 'history';
  onTabChange: (tab: 'new' | 'history') => void;
  onBack: () => void;
  newTabLabel: string;
  historyTabLabel: string;
  formContent: ReactNode;
  listContent: ReactNode;
}

export function AnalysisPageLayout({
  title,
  description,
  activeTab,
  onTabChange,
  onBack,
  newTabLabel,
  historyTabLabel,
  formContent,
  listContent,
}: AnalysisPageLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full flex flex-col h-full">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back', 'Back')}
            </Button>
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-0">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'new' | 'history')} className="w-full">
              <TabsList className="grid grid-cols-2 w-64 mb-6 h-auto p-1">
                <TabsTrigger value="new" className="py-2.5 px-3">{newTabLabel}</TabsTrigger>
                <TabsTrigger value="history" className="py-2.5 px-3">{historyTabLabel}</TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-6">
                {formContent}
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                {listContent}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
