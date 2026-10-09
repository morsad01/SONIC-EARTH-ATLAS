import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { usePrefs } from '../lib/prefs';

/** An image that shows a labelled placeholder instead of the browser's broken-image icon when it can't load (offline, blocked, 404). */
export const ImgOr: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className = '', alt = '', onError, ...rest }) => {
  const { t } = usePrefs();
  const [failed, setFailed] = useState<string | null>(null);
  if (failed === rest.src) {
    return <div className={`${className} grid place-items-center gap-1 bg-[var(--panel-2)] text-[var(--ink-3)] text-xs text-center`} role="img" aria-label={alt || t('imgUnavailable')}><span className="inline-flex items-center gap-1"><ImageOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /><span className="hidden sm:inline">{t('imgUnavailable')}</span></span></div>;
  }
  return <img {...rest} alt={alt} className={className} onError={(e) => { setFailed(rest.src ?? ''); onError?.(e); }} />;
};
