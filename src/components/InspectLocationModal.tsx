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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-white space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-lg"
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
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                {observation.regionName || observation.variable}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {catalog.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Core Scientific Values Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block">MEASURED VALUE</span>
            <span className="text-xl font-bold text-white mt-0.5 block">
              {observation.value} <span className="text-xs text-slate-400">{observation.unit}</span>
            </span>
            {observation.delta !== undefined && (
              <span className={`text-[11px] block mt-1 ${observation.delta >= 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                Δ {observation.delta > 0 ? `+${observation.delta.toFixed(1)}` : observation.delta.toFixed(1)} vs prev
              </span>
            )}
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block">NORMALIZED [0.0 - 1.0]</span>
            <span className="text-xl font-bold text-cyan-400 mt-0.5 block">
              {observation.normalizedValue.toFixed(3)}
            </span>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full"
                style={{ width: `${Math.round(observation.normalizedValue * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Spatial Coordinates & Sonification Parameters */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              Coordinates:
            </span>
            <span className="text-slate-200">
              {observation.latitude.toFixed(2)}° Lat, {observation.longitude.toFixed(2)}° Lon
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              Stereo Spatial Pan:
            </span>
            <span className="text-cyan-300 font-semibold">
              {panValue} ({panLabel})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Timestamp:
            </span>
            <span className="text-slate-200">{observation.timestamp}</span>
          </div>

          {observation.confidence !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Algorithmic Confidence:</span>
              <span className="text-emerald-400 font-semibold">{observation.confidence}%</span>
            </div>
          )}
        </div>

        {/* Audio Synthesis Formula Mapping */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mb-1">
            <Sliders className="w-3 h-3 text-cyan-400" />
            SYNTHESIS MAPPING FORMULA
          </div>
          <p className="text-[11px] font-mono text-slate-300">
            {catalog.audioFormula}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <a
            href={catalog.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Source Provider ({catalog.provider})</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={handlePlaySound}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition"
          >
            <Volume2 className="w-4 h-4" />
            <span>PLAY LOCATION AUDIO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
