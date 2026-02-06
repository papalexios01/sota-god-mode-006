import { useState, useMemo } from 'react';
import { useGodModeEngine } from '@/hooks/useGodModeEngine';
import { useOptimizerStore } from '@/lib/store';
import {
  Zap, Play, Pause, Square, Settings, Activity, Clock,
  CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw,
  BarChart3, FileText, ExternalLink, Target, TrendingUp, Eye,
  Shield, Gauge, Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { GodModeConfigPanel } from './GodModeConfigPanel';
import { GodModeActivityFeed } from './GodModeActivityFeed';
import { GodModeQueuePanel } from './GodModeQueuePanel';
import { GodModeContentPreview } from './GodModeContentPreview';
import type { GodModeHistoryItem } from '@/lib/sota/GodModeTypes';

export function GodModeDashboard() {
  const { state, isRunning, isPaused, start, stop, pause, resume } = useGodModeEngine();
  const { sitemapUrls, priorityUrls, priorityOnlyMode, setPriorityOnlyMode } = useOptimizerStore();
  const [showConfig, setShowConfig] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [previewItem, setPreviewItem] = useState<GodModeHistoryItem | null>(null);

  const priorityProgress = useMemo(() => {
    if (!priorityOnlyMode || priorityUrls.length === 0) return null;
    const completed = state.stats.totalProcessed;
    const total = priorityUrls.length;
    const pct = Math.min(100, Math.round((completed / total) * 100));
    return { completed, total, pct };
  }, [priorityOnlyMode, priorityUrls.length, state.stats.totalProcessed]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await start();
      toast.success('God Mode activated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start God Mode');
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = () => {
    stop();
    toast.info('God Mode stopped');
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resume();
      toast.info('God Mode resumed');
    } else {
      pause();
      toast.info('God Mode paused');
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPhaseLabel = () => {
    switch (state.currentPhase) {
      case 'scanning': return 'Scanning Sitemap';
      case 'scoring': return 'Scoring Pages';
      case 'generating': return 'Generating Content';
      case 'publishing': return 'Publishing';
      default: return 'Idle';
    }
  };

  const getPhaseIcon = () => {
    switch (state.currentPhase) {
      case 'scanning': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'scoring': return <Gauge className="w-4 h-4" />;
      case 'generating': return <Zap className="w-4 h-4" />;
      case 'publishing': return <ExternalLink className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Priority Only Mode Banner */}
      {priorityOnlyMode && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl p-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Target className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-amber-300 text-lg tracking-tight">
                  Priority Only Mode
                </h3>
                <p className="text-sm text-amber-400/70 mt-0.5">
                  Processing {priorityUrls.length} priority URL{priorityUrls.length !== 1 ? 's' : ''} exclusively. Sitemap scanning disabled.
                </p>
              </div>
            </div>
            <button
              onClick={() => setPriorityOnlyMode(false)}
              disabled={isRunning}
              className="px-4 py-2 bg-amber-500/15 text-amber-300 rounded-lg text-sm font-medium border border-amber-500/20 hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Switch to Full Sitemap
            </button>
          </div>

          {/* Progress bar for priority mode */}
          {priorityProgress && isRunning && (
            <div className="mt-4 relative">
              <div className="flex items-center justify-between text-xs text-amber-400/70 mb-1.5">
                <span>{priorityProgress.completed} of {priorityProgress.total} processed</span>
                <span>{priorityProgress.pct}%</span>
              </div>
              <div className="h-2 bg-amber-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${priorityProgress.pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-br from-card via-card to-muted/30 border border-border rounded-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center border border-teal-500/20">
                <Zap className="w-7 h-7 text-teal-400" />
                {isRunning && !isPaused && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card">
                    <span className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">God Mode 2.0</h2>
                  <span className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-md uppercase tracking-wider",
                    state.status === 'running' && "bg-green-500/15 text-green-400 border border-green-500/20",
                    state.status === 'paused' && "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
                    state.status === 'error' && "bg-red-500/15 text-red-400 border border-red-500/20",
                    state.status === 'idle' && "bg-muted text-muted-foreground border border-border"
                  )}>
                    {state.status}
                  </span>
                  {priorityOnlyMode && (
                    <span className="px-2.5 py-1 text-[11px] font-semibold rounded-md uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      Priority Only
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {priorityOnlyMode
                    ? `Targeted optimization for ${priorityUrls.length} priority URLs`
                    : `Autonomous SEO maintenance engine`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {!isRunning && !priorityOnlyMode && priorityUrls.length > 0 && (
                <button
                  onClick={() => setPriorityOnlyMode(true)}
                  className="px-3.5 py-2.5 bg-amber-500/10 text-amber-400 rounded-xl text-sm font-medium border border-amber-500/15 hover:bg-amber-500/20 transition-all flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Priority Only
                </button>
              )}

              <button
                onClick={() => setShowConfig(!showConfig)}
                className={cn(
                  "p-2.5 rounded-xl transition-all border",
                  showConfig
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                )}
              >
                <Settings className="w-5 h-5" />
              </button>

              {isRunning ? (
                <>
                  <button
                    onClick={handlePauseResume}
                    className={cn(
                      "px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all border",
                      isPaused
                        ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20"
                    )}
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={handleStop}
                    className="px-4 py-2.5 bg-red-500/10 text-red-400 rounded-xl font-medium flex items-center gap-2 border border-red-500/20 hover:bg-red-500/20 transition-all"
                  >
                    <Square className="w-4 h-4" />
                    Stop
                  </button>
                </>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={isStarting || (priorityOnlyMode ? priorityUrls.length === 0 : (sitemapUrls.length === 0 && priorityUrls.length === 0))}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/20"
                >
                  {isStarting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : priorityOnlyMode ? (
                    <Target className="w-4 h-4" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {isStarting ? 'Starting...' : priorityOnlyMode ? `Process ${priorityUrls.length} URLs` : 'Start God Mode'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status strip */}
        <div className="grid grid-cols-4 border-t border-border divide-x divide-border bg-muted/20">
          <div className="px-5 py-3.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
              <Activity className="w-3.5 h-3.5" />
              Cycle
            </div>
            <div className="text-xl font-bold text-foreground tabular-nums">
              {state.stats.cycleCount}
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
              <Target className="w-3.5 h-3.5" />
              Queue
            </div>
            <div className="text-xl font-bold text-foreground tabular-nums">
              {state.queue.length}
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
              <Clock className="w-3.5 h-3.5" />
              {priorityOnlyMode ? 'Mode' : 'Last Scan'}
            </div>
            <div className="text-base font-semibold text-foreground">
              {priorityOnlyMode ? 'Priority' : formatTime(state.stats.lastScanAt)}
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
              <RefreshCw className="w-3.5 h-3.5" />
              {priorityOnlyMode ? 'Remaining' : 'Next Scan'}
            </div>
            <div className="text-base font-semibold text-foreground tabular-nums">
              {priorityOnlyMode ? `${state.queue.length} / ${priorityUrls.length}` : formatTime(state.stats.nextScanAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <GodModeConfigPanel onClose={() => setShowConfig(false)} />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard
          icon={<FileText className="w-5 h-5 text-blue-400" />}
          iconBg="bg-blue-500/15"
          value={state.stats.totalProcessed}
          label="Processed"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
          iconBg="bg-green-500/15"
          value={state.stats.successCount}
          label="Success"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5 text-red-400" />}
          iconBg="bg-red-500/15"
          value={state.stats.errorCount}
          label="Errors"
        />
        <StatCard
          icon={<TrendingUp className={cn(
            "w-5 h-5",
            state.stats.avgQualityScore >= 90 ? "text-emerald-400" :
            state.stats.avgQualityScore >= 80 ? "text-yellow-400" : "text-muted-foreground"
          )} />}
          iconBg={cn(
            state.stats.avgQualityScore >= 90 ? "bg-emerald-500/15" :
            state.stats.avgQualityScore >= 80 ? "bg-yellow-500/15" : "bg-muted"
          )}
          value={`${state.stats.avgQualityScore.toFixed(0)}%`}
          label="Avg Quality"
          valueColor={
            state.stats.avgQualityScore >= 90 ? "text-emerald-400" :
            state.stats.avgQualityScore >= 80 ? "text-yellow-400" : undefined
          }
        />
        <StatCard
          icon={<BarChart3 className="w-5 h-5 text-sky-400" />}
          iconBg="bg-sky-500/15"
          value={state.stats.totalWordsGenerated.toLocaleString()}
          label="Words"
        />
      </div>

      {/* SOTA Badge */}
      {state.stats.avgQualityScore >= 90 && state.stats.totalProcessed > 0 && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/25 rounded-xl">
          <Shield className="w-5 h-5 text-emerald-400" />
          <div className="flex-1">
            <span className="text-sm font-semibold text-emerald-300">
              SOTA Quality Achieved
            </span>
            <span className="text-sm text-emerald-400/70 ml-2">
              {state.stats.avgQualityScore.toFixed(1)}% avg across {state.stats.totalProcessed} articles
            </span>
          </div>
        </div>
      )}

      {/* Current Processing */}
      {state.currentUrl && (
        <div className="flex items-center gap-3 p-4 bg-card border border-primary/20 rounded-xl">
          <div className="w-8 h-8 bg-primary/15 rounded-lg flex items-center justify-center">
            {state.currentPhase === 'generating' ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              getPhaseIcon()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {getPhaseLabel()}
              {state.currentPhase === 'generating' && (
                <Timer className="w-3 h-3 text-primary animate-pulse" />
              )}
            </div>
            <div className="text-sm font-medium text-foreground truncate">{state.currentUrl}</div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-5">
        <GodModeActivityFeed />
        <GodModeQueuePanel />
      </div>

      {/* History Section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Processing History
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            {state.history.length} items
          </span>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {state.history.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No processing history yet</p>
              <p className="text-xs mt-1 opacity-70">Start God Mode to begin generating content</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {state.history.slice(0, 30).map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                    item.action === 'published' && "bg-green-500/15",
                    item.action === 'generated' && "bg-blue-500/15",
                    item.action === 'skipped' && "bg-yellow-500/15",
                    item.action === 'error' && "bg-red-500/15"
                  )}>
                    {item.action === 'published' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                    {item.action === 'generated' && <FileText className="w-3.5 h-3.5 text-blue-400" />}
                    {item.action === 'skipped' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />}
                    {item.action === 'error' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {(() => {
                        try {
                          return new URL(item.url).pathname.split('/').filter(Boolean).pop() || item.url;
                        } catch {
                          return item.url;
                        }
                      })()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                      {item.qualityScore != null && (
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                          item.qualityScore >= 90 ? "bg-emerald-500/15 text-emerald-400" :
                          item.qualityScore >= 80 ? "bg-yellow-500/15 text-yellow-400" :
                          "bg-red-500/15 text-red-400"
                        )}>
                          {item.qualityScore}%
                        </span>
                      )}
                      {item.wordCount != null && (
                        <span>{item.wordCount.toLocaleString()} words</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.generatedContent && (
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted/50 transition-colors"
                        title="View content"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {item.wordPressUrl && (
                      <a
                        href={item.wordPressUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-muted-foreground hover:text-green-400 rounded-lg hover:bg-muted/50 transition-colors"
                        title="View on WordPress"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prerequisites Warning */}
      {sitemapUrls.length === 0 && priorityUrls.length === 0 && (
        <div className="flex items-center gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-400/80">
            <span className="font-semibold text-yellow-400">No URLs available.</span> Crawl your sitemap in "Content Hub" or add priority URLs in "Gap Analysis" before starting.
          </p>
        </div>
      )}

      {/* Content Preview Modal */}
      {previewItem && (
        <GodModeContentPreview
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  value,
  label,
  valueColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: string | number;
  label: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className={cn("text-xl font-bold tabular-nums truncate", valueColor || "text-foreground")}>
            {value}
          </div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}
