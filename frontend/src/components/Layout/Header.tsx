import { motion } from 'framer-motion';
import { Search, BarChart3, FileSearch, Globe, Check, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useSessionSearch } from '@/hooks/useSessionSearch';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onUsageClick?: () => void;
  onAnalysisClick?: () => void;
  onWorkAnalysisClick?: () => void;
}

export function Header({ onSearch, onUsageClick, onAnalysisClick, onWorkAnalysisClick }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const { search, loading } = useSessionSearch();

  const languages = [
    { code: 'ko', label: '한국어' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'zh', label: '中文' },
  ];

  const changeLanguage = useCallback((lang: string) => {
    i18n.changeLanguage(lang);
  }, [i18n]);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        search(query);
        onSearch?.(query);
      }
    },
    [query, search, onSearch]
  );

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="border-b px-4 py-3 flex items-center justify-between"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
    >
      <div className="flex items-center gap-3">
        <img src="/logo.svg" alt="Claude Monitor" className="w-8 h-8" />
        <h1 className="text-lg font-semibold">{t('header.title')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-md w-full">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <Input
            type="text"
            placeholder={t('header.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            disabled={loading}
          />
        </div>
      </form>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAnalysisClick}
          className="flex items-center gap-2"
        >
          <FileSearch className="w-4 h-4" />
          {t('header.analysis')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onWorkAnalysisClick}
          className="flex items-center gap-2"
        >
          <Briefcase className="w-4 h-4" />
          {t('header.workAnalysis')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onUsageClick}
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          {t('header.usage')}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              {currentLang.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className="flex items-center justify-between gap-2"
              >
                {lang.label}
                {i18n.language === lang.code && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}
