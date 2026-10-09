import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { Overlay } from '../components/Overlay';
import { useDialog } from '../lib/useDialog';
import { usePrefs } from '../lib/prefs';

/** Bottom sheet for the Atlas panels on phones and tablets. */
export const MobileSheet: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => {
  const { t } = usePrefs();
  const ref = useRef<HTMLDivElement>(null);
  useDialog(true, onClose, ref);
  return (
    <Overlay>
      <div className="lg:hidden fixed inset-0 z-50 scrim flex items-end" onClick={onClose}>
        <div ref={ref} tabIndex={-1} className="glass-pop w-full max-h-[78dvh] overflow-y-auto rounded-b-none rounded-t-2xl p-3 pb-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('panels')}>
          <div className="flex justify-end"><button className="btn btn-ghost btn-icon" onClick={onClose} aria-label={t('close')}><X className="w-5 h-5" /></button></div>
          {children}
        </div>
      </div>
    </Overlay>
  );
};
