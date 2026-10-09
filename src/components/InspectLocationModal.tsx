import type { EarthObservation } from '../types/dataset';
import { SonificationEngine } from '../audio/sonificationEngine';
import { DATASET_CATALOG } from '../datasets/datasetMetadata';
import { X, Volume2, ExternalLink, MapPin, Activity, Compass, Clock, Sliders } from 'lucide-react';

interface InspectLocationModalProps {
  observation: EarthObservation | null;
  onClose: () => void;
}

export const InspectLocationModal: React.FC<InspectLocationModalProps> = ({
  observation,
  onClose,
}) => {
  if (!observation) return null;

  const catalog = DATASET_CATALOG[observation.phenomenon];
  const panValue = (observation.longitude / 180).toFixed(2);
  const panLabel = observation.longitude < 0 ? `${Math.abs(Number(panValue)) * 100}% Left` : `${Number(panValue) * 100}% Right`;

  const handlePlaySound = () => {
    SonificationEngine.getInstance().playObservation(observation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-fade-in max-w-[100vw] overflow-x-hidden safe-pb safe-pt">
      <div className="max-w-lg w-full max-h-[85dvh] overflow-y-auto bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 shadow-2xl text-white space-y-3.5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="p-2 rounded-lg shrink-0"
              style={{
                backgroundColor:
                  observation.phenomenon === 'fire'
                    ? 'rgba(255, 77, 0, 0.2)'
                    : observation.phenomenon === 'precipitation'
                    ? 'rgba(0, 208, 255, 0.2)'
                    : 'rgba(191, 90, 242, 0.2)',
                color:
                  observation.phenomenon === 'fire'
                    ? '#ff4d00'
                    : observation.phenomenon === 'precipitation'
                    ? '#00d0ff'
                    : '#bf5af2',
              }}
            >
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {observation.regionName || observation.variable}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                {catalog.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
            aria-label="Close Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Scientific Values Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-[var(--panel-2)] rounded-xl border border-[var(--line)]">
            <span className="text-[var(--ink-3)] text-xs block">Measured value</span>
            <span className="text-lg sm:text-xl font-bold text-white mt-0.5 block">
              {observation.value} <span className="text-xs text-slate-400">{observation.unit}</span>
            </span>
            {observation.delta !== undefined && (
              <span className={`text-[11px] block mt-1 ${observation.delta >= 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                Δ {observation.delta > 0 ? `+${observation.delta.toFixed(1)}` : observation.delta.toFixed(1)} vs prev
              </span>
            )}
          </div>

          <div className="p-3 bg-[var(--panel-2)] rounded-xl border border-[var(--line)]">
            <span className="text-[var(--ink-3)] text-xs block">Sound intensity (0 to 1)</span>
            <span className="text-lg sm:text-xl font-bold text-[var(--brass)] mt-0.5 block">
              {observation.normalizedValue.toFixed(3)}
            </span>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[var(--brass)] h-full rounded-full"
                style={{ width: `${Math.round(observation.normalizedValue * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Spatial Coordinates & Sonification Parameters */}
        <div className="p-3 bg-[var(--panel-2)] rounded-xl border border-[var(--line)] space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              Coordinates:
            </span>
            <span className="text-slate-200 text-[11px] sm:text-xs font-semibold truncate">
              {observation.latitude.toFixed(2)}° Lat, {observation.longitude.toFixed(2)}° Lon
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              Stereo Spatial Pan:
            </span>
            <span className="text-[var(--ink)] font-semibold text-[11px] sm:text-xs truncate">
              {panValue} ({panLabel})
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Timestamp:
            </span>
            <span className="text-slate-200 text-[11px] sm:text-xs truncate">{observation.timestamp}</span>
          </div>

          {observation.confidence !== undefined && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 shrink-0">Algorithmic Confidence:</span>
              <span className="text-emerald-400 font-semibold text-[11px] sm:text-xs">{observation.confidence}%</span>
            </div>
          )}
        </div>

        {/* Audio Synthesis Formula Mapping */}
        <div className="p-3 bg-[var(--panel-2)] rounded-xl border border-[var(--line)] text-xs">
          <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
            <Sliders className="w-3 h-3 text-[var(--brass)]" />
            How this value becomes sound
          </div>
          <p className="text-[11px] text-slate-300 break-words">
            {catalog.audioFormula}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <a
            href={catalog.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[var(--brass)] hover:text-[var(--ink)] flex items-center gap-1 min-h-[44px]"
          >
            <span>Source Provider ({catalog.provider})</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={handlePlaySound}
            className="btn btn-brass w-full sm:w-auto min-h-[44px]"
          >
            <Volume2 className="w-4 h-4" />
            <span>Play this place</span>
          </button>
        </div>
      </div>
    </div>
  );
};
