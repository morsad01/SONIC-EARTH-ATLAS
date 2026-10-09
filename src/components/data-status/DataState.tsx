import { AlertTriangle, Loader2, RotateCw, WifiOff, Clock, Inbox } from 'lucide-react';
import { usePrefs } from '../../lib/prefs';

export type DataStatus = 'loading' | 'empty' | 'stale' | 'error' | 'offline';

/** Shared loading / empty / stale / error / offline message. Each state has an icon and text, so it never relies on colour. */
export function DataState({ status, message, onRetry }: { status: DataStatus; message?: string; onRetry?: () => void }) {
  const { t } = usePrefs();
  const Icon = { loading: Loader2, empty: Inbox, stale: Clock, error: AlertTriangle, offline: WifiOff }[status];
  const text = message ?? t({ loading: 'dsLoading', empty: 'dsEmpty', stale: 'dsStale', error: 'dsError', offline: 'dsOffline' }[status] as 'dsLoading');
  const urgent = status === 'error' || status === 'offline';
  return (
    <div role={urgent ? 'alert' : 'status'} aria-live={urgent ? 'assertive' : 'polite'} data-state={status} className="flex items-start gap-2 text-sm text-[var(--ink-2)] rounded-lg border border-[var(--line)] p-2.5">
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${status === 'loading' ? 'animate-spin' : ''}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p>{text}</p>
        {onRetry && (status === 'error' || status === 'offline' || status === 'stale') && <button type="button" className="btn btn-ghost min-h-[36px] px-2 mt-1" onClick={onRetry}><RotateCw className="w-4 h-4" aria-hidden="true" />{t('dsRetry')}</button>}
      </div>
    </div>
  );
}
