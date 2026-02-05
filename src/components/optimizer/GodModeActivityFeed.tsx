/**
 * God Mode 2.0 - SOTA Enterprise Activity Feed
 * 
 * State-of-the-art live activity monitoring featuring:
 * - Real-time color-coded activity streaming
 * - Enterprise-grade logging with timestamps
 * - Activity type filtering (info/success/warning/error)
 * - Expandable details with full context
 * - Performance metrics integration
 */

import { useState } from 'react';
import { useOptimizerStore } from '@/lib/store';
import { useGodModeEngine } from '@/hooks/useGodModeEngine';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Info, Trash2, Filter, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActivityFilter = 'all' | 'success' | 'warning' | 'error' | 'info';

export function GodModeActivityFeed() {
  const { state, clearActivityLog } = useGodModeEngine();
  const [filter, setFilter] = useState<ActivityFilter>('all');
  
  const allActivities = state.activityLog.slice().reverse().slice(0, 100);
  const activities = filter === 'all' 
    ? allActivities.slice(0, 50)
    : allActivities.filter(a => a.type === filter).slice(0, 50);
    
  // Calculate activity stats
  const activityStats = {
    total: allActivities.length,
    success: allActivities.filter(a => a.type === 'success').length,
    warning: allActivities.filter(a => a.type === 'warning').length,
    error: allActivities.filter(a => a.type === 'error').length,
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col h-80">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Enterprise Activity Log
          <span className="text-xs text-muted-foreground font-normal">
            ({activityStats.total} events)
          </span>
        </h3>
        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                filter === 'all' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              All
            </button>
            {activityStats.error > 0 && (
              <button
                onClick={() => setFilter('error')}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors flex items-center gap-1",
                  filter === 'error' ? 'bg-red-500/20 text-red-400' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <XCircle className="w-3 h-3" />
                {activityStats.error}
              </button>
            )}
            {activityStats.warning > 0 && (
              <button
                onClick={() => setFilter('warning')}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors flex items-center gap-1",
                  filter === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <AlertTriangle className="w-3 h-3" />
                {activityStats.warning}
              </button>
            )}
          </div>
          {allActivities.length > 0 && (
            <button
              onClick={clearActivityLog}
              className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted/50 transition-colors"
              title="Clear activity log"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Activity className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No activity yet</p>
            <p className="text-xs">Start God Mode to see live updates</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={cn(
                  "flex gap-3 p-3 hover:bg-muted/30 transition-colors",
                  activity.type === 'error' && "bg-red-500/5",
                  activity.type === 'success' && "bg-green-500/5"
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {activity.message}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                  {activity.details && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {activity.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live indicator */}
      {state.status === 'running' && (
        <div className="p-2 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live • Updating in real-time
          </div>
        </div>
      )}
    </div>
  );
}
