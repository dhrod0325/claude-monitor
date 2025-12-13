import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { CLAUDE_MODELS, type ClaudeModelId } from '@/types';
import { Cpu } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: ClaudeModelId;
  onModelChange: (model: ClaudeModelId) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const { t } = useTranslation();

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Cpu className="h-4 w-4" />
        {t('common.selectModel', 'Select Model')}
      </h3>
      <div className="flex gap-2 flex-wrap">
        {CLAUDE_MODELS.map((model) => (
          <button
            key={model.id}
            type="button"
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: selectedModel === model.id ? 'var(--color-primary)' : 'var(--color-muted)',
              color: selectedModel === model.id ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
              border: selectedModel === model.id ? 'none' : '1px solid var(--color-border)',
            }}
            onClick={() => onModelChange(model.id)}
          >
            {model.name}
          </button>
        ))}
      </div>
    </Card>
  );
}
