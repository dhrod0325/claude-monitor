import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import { formatCurrencyByLanguage } from '@/lib/currency';
import type { UsageStats } from '@/types';
import {
  ArrowLeft,
  Filter,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface UsageDashboardProps {
  onBack: () => void;
}

export function UsageDashboard({ onBack }: UsageDashboardProps) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | '7d' | '30d'>('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const [projectsPage, setProjectsPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const formatCurrency = useCallback((amount: number): string => {
    return formatCurrencyByLanguage(amount, i18n.language);
  }, [i18n.language]);

  const getLocale = useCallback((): string => {
    const localeMap: Record<string, string> = {
      ko: 'ko-KR',
      en: 'en-US',
      ja: 'ja-JP',
      zh: 'zh-CN',
    };
    return localeMap[i18n.language] || 'en-US';
  }, [i18n.language]);

  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat(getLocale()).format(num);
  }, [getLocale]);

  const formatTokens = useCallback((num: number): string => {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    }
    return formatNumber(num);
  }, [formatNumber]);

  const getModelDisplayName = useCallback((model: string): string => {
    const modelMap: Record<string, string> = {
      'claude-opus-4-5-20251101': 'Opus 4.5',
      'claude-sonnet-4-5-20250514': 'Sonnet 4.5',
      'claude-4-opus': 'Opus 4',
      'claude-4-sonnet': 'Sonnet 4',
      'claude-3.5-sonnet': 'Sonnet 3.5',
      'claude-3-opus': 'Opus 3',
    };
    return modelMap[model] || model;
  }, []);

  const loadUsageStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let statsData: UsageStats;

      if (selectedDateRange === 'all') {
        statsData = await api.getUsageStats();
      } else {
        const endDate = new Date();
        const startDate = new Date();
        const days = selectedDateRange === '7d' ? 7 : 30;
        startDate.setDate(startDate.getDate() - days);

        statsData = await api.getUsageByDateRange(
          startDate.toISOString(),
          endDate.toISOString()
        );
      }

      setStats(statsData);
    } catch (err) {
      console.error('Failed to load usage stats:', err);
      setError(t('usage.loadError'));
    } finally {
      setLoading(false);
    }
  }, [selectedDateRange]);

  useEffect(() => {
    setProjectsPage(1);
    loadUsageStats();
  }, [loadUsageStats]);

  const summaryCards = useMemo(() => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{t('usage.totalCost')}</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(stats.total_cost)}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{t('usage.totalSessions')}</p>
          <p className="text-2xl font-bold mt-1">{formatNumber(stats.total_sessions)}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{t('usage.totalTokens')}</p>
          <p className="text-2xl font-bold mt-1">{formatTokens(stats.total_tokens)}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{t('usage.avgCostPerSession')}</p>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(stats.total_sessions > 0 ? stats.total_cost / stats.total_sessions : 0)}
          </p>
        </Card>
      </div>
    );
  }, [stats, formatCurrency, formatNumber, formatTokens]);

  const timelineChartData = useMemo(() => {
    if (!stats?.by_date || stats.by_date.length === 0) return null;

    const maxCost = Math.max(...stats.by_date.map((d) => d.total_cost), 0);
    const reversedData = stats.by_date.slice().reverse();

    return {
      maxCost,
      halfMaxCost: maxCost / 2,
      bars: reversedData.map((day) => ({
        ...day,
        heightPercent: maxCost > 0 ? (day.total_cost / maxCost) * 100 : 0,
        dateObj: new Date(day.date.replace(/-/g, '/')),
      })),
    };
  }, [stats?.by_date]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full flex flex-col h-full">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.back')}
              </Button>
              <div>
                <h1 className="text-xl font-bold">{t('usage.title')}</h1>
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  {t('usage.description')}
                </p>
              </div>
            </div>
            {/* Date Range Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" style={{ color: 'var(--color-muted-foreground)' }} />
              <div className="flex space-x-1">
                {(['7d', '30d', 'all'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={selectedDateRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDateRange(range)}
                    disabled={loading}
                  >
                    {t(`usage.dateRange.${range}`)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-muted-foreground)' }} />
            </div>
          ) : error ? (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)' }}
            >
              {error}
              <Button onClick={loadUsageStats} size="sm" className="ml-4">
                {t('common.tryAgain')}
              </Button>
            </div>
          ) : stats ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              {summaryCards}

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 w-full mb-6 h-auto p-1">
                  <TabsTrigger value="overview" className="py-2.5 px-3">{t('usage.overview')}</TabsTrigger>
                  <TabsTrigger value="models" className="py-2.5 px-3">{t('usage.byModel')}</TabsTrigger>
                  <TabsTrigger value="projects" className="py-2.5 px-3">{t('usage.byProject')}</TabsTrigger>
                  <TabsTrigger value="timeline" className="py-2.5 px-3">{t('usage.timeline')}</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                  <Card className="p-6">
                    <h3 className="text-sm font-semibold mb-4">{t('usage.tokenBreakdown')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{t('usage.inputTokens')}</p>
                        <p className="text-lg font-semibold">{formatTokens(stats.total_input_tokens)}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{t('usage.outputTokens')}</p>
                        <p className="text-lg font-semibold">{formatTokens(stats.total_output_tokens)}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{t('usage.cacheWrite')}</p>
                        <p className="text-lg font-semibold">{formatTokens(stats.total_cache_creation_tokens)}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{t('usage.cacheRead')}</p>
                        <p className="text-lg font-semibold">{formatTokens(stats.total_cache_read_tokens)}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-6">
                      <h3 className="text-sm font-semibold mb-4">{t('usage.mostUsedModels')}</h3>
                      <div className="space-y-3">
                        {stats.by_model.slice(0, 3).map((model) => (
                          <div key={model.model} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {getModelDisplayName(model.model)}
                              </Badge>
                              <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                {model.session_count} sessions
                              </span>
                            </div>
                            <span className="text-sm font-medium">{formatCurrency(model.total_cost)}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-sm font-semibold mb-4">{t('usage.topProjects')}</h3>
                      <div className="space-y-3">
                        {stats.by_project.slice(0, 3).map((project) => (
                          <div key={project.project_path} className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span
                                className="text-sm font-medium truncate max-w-[200px]"
                                title={project.project_path}
                              >
                                {project.project_name}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                {project.session_count} sessions
                              </span>
                            </div>
                            <span className="text-sm font-medium">{formatCurrency(project.total_cost)}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                {/* Models Tab */}
                <TabsContent value="models" className="space-y-6 mt-6">
                  <Card className="p-6">
                    <h3 className="text-sm font-semibold mb-4">{t('usage.usageByModel')}</h3>
                    <div className="space-y-4">
                      {stats.by_model.map((model) => (
                        <div key={model.model} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Badge variant="outline" className="text-xs">
                                {getModelDisplayName(model.model)}
                              </Badge>
                              <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                                {model.session_count} sessions
                              </span>
                            </div>
                            <span className="text-sm font-semibold">{formatCurrency(model.total_cost)}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div>
                              <span style={{ color: 'var(--color-muted-foreground)' }}>Input: </span>
                              <span className="font-medium">{formatTokens(model.input_tokens)}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--color-muted-foreground)' }}>Output: </span>
                              <span className="font-medium">{formatTokens(model.output_tokens)}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--color-muted-foreground)' }}>Cache W: </span>
                              <span className="font-medium">{formatTokens(model.cache_creation_tokens)}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--color-muted-foreground)' }}>Cache R: </span>
                              <span className="font-medium">{formatTokens(model.cache_read_tokens)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-6 mt-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold">{t('usage.usageByProject')}</h3>
                      <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {t('usage.totalProjects', { count: stats.by_project.length })}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {(() => {
                        const startIndex = (projectsPage - 1) * ITEMS_PER_PAGE;
                        const endIndex = startIndex + ITEMS_PER_PAGE;
                        const paginatedProjects = stats.by_project.slice(startIndex, endIndex);
                        const totalPages = Math.ceil(stats.by_project.length / ITEMS_PER_PAGE);

                        return (
                          <>
                            {paginatedProjects.map((project) => (
                              <div
                                key={project.project_path}
                                className="flex items-center justify-between py-2"
                                style={{ borderBottom: '1px solid var(--color-border)' }}
                              >
                                <div className="flex flex-col truncate">
                                  <span className="text-sm font-medium truncate" title={project.project_path}>
                                    {project.project_name}
                                  </span>
                                  <div className="flex items-center space-x-3 mt-1">
                                    <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                      {project.session_count} sessions
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                      {formatTokens(project.total_tokens)} tokens
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold">{formatCurrency(project.total_cost)}</p>
                                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                    {formatCurrency(project.total_cost / project.session_count)}{t('usage.perSession')}
                                  </p>
                                </div>
                              </div>
                            ))}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between pt-4">
                                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                  Showing {startIndex + 1}-{Math.min(endIndex, stats.by_project.length)} of{' '}
                                  {stats.by_project.length}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setProjectsPage((prev) => Math.max(1, prev - 1))}
                                    disabled={projectsPage === 1}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <span className="text-sm">
                                    Page {projectsPage} of {totalPages}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setProjectsPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={projectsPage === totalPages}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </Card>
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline" className="space-y-6 mt-6">
                  <Card className="p-6">
                    <h3 className="text-sm font-semibold mb-6 flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{t('usage.dailyUsage')}</span>
                    </h3>
                    {timelineChartData ? (
                      <div className="relative pl-8 pr-4">
                        {/* Y-axis labels */}
                        <div
                          className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs"
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          <span>{formatCurrency(timelineChartData.maxCost)}</span>
                          <span>{formatCurrency(timelineChartData.halfMaxCost)}</span>
                          <span>{formatCurrency(0)}</span>
                        </div>

                        {/* Chart container */}
                        <div
                          className="flex items-end space-x-2 h-64 pl-4"
                          style={{ borderLeft: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
                        >
                          {timelineChartData.bars.map((day) => {
                            const formattedDate = day.dateObj.toLocaleDateString(getLocale(), {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            });

                            return (
                              <div
                                key={day.date}
                                className="flex-1 h-full flex flex-col items-center justify-end group relative"
                              >
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                  <div
                                    className="rounded-lg shadow-lg p-3 whitespace-nowrap"
                                    style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}
                                  >
                                    <p className="text-sm font-semibold">{formattedDate}</p>
                                    <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                                      {t('usage.cost')}: {formatCurrency(day.total_cost)}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                      {formatTokens(day.total_tokens)} {t('common.tokens')}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                      {day.models_used.length} {day.models_used.length !== 1 ? t('usage.modelPlural') : t('usage.model')}
                                    </p>
                                  </div>
                                </div>

                                {/* Bar */}
                                <div
                                  className="w-full hover:opacity-80 transition-opacity rounded-t cursor-pointer"
                                  style={{
                                    height: `${day.heightPercent}%`,
                                    backgroundColor: 'var(--color-primary)',
                                  }}
                                />

                                {/* X-axis label */}
                                <div
                                  className="absolute left-1/2 top-full mt-2 -translate-x-1/2 text-xs whitespace-nowrap pointer-events-none"
                                  style={{ color: 'var(--color-muted-foreground)' }}
                                >
                                  {day.dateObj.toLocaleDateString(getLocale(), { month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* X-axis label */}
                        <div
                          className="mt-10 text-center text-xs"
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          {t('usage.dailyUsageOverTime')}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                        {t('usage.noUsageData')}
                      </div>
                    )}
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
