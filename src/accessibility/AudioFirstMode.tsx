import React, { useState } from 'react';
import type { EarthObservation, PhenomenonType } from '../types/dataset';
import { SonificationEngine } from '../audio/sonificationEngine';
import { CountryPanel } from '../countries/CountryPanel';
import type { Country } from '../countries/countries';
import { usePrefs } from '../lib/prefs';
import { Volume2, VolumeX, Radio, Flame, CloudRain, Waves } from 'lucide-react';

interface AudioFirstModeProps {
  observations: EarthObservation[];
  currentDateLabel: string;
  selectedObservation: EarthObservation | null;
  onSelectObservation: (obs: EarthObservation | null) => void;
  onExitAudioFirst: () => void;
  countries?: { list: Country[]; country: Country | null; point: { lat: number; lon: number } | null; onSelect: (c: Country | null) => void };
}

export const AudioFirstMode: React.FC<AudioFirstModeProps> = ({
  observations,
  currentDateLabel,
  selectedObservation,
  onSelectObservation,
  onExitAudioFirst,
  countries,
}) => {
  const { t } = usePrefs();
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [activePhenomenonFilter, setActivePhenomenonFilter] = useState<'all' | PhenomenonType>('all');

  const filtered = activePhenomenonFilter === 'all'
    ? observations
    : observations.filter((o) => o.phenomenon === activePhenomenonFilter);

  const speakDescription = (text: string) => {
    if (speechEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelect = (obs: EarthObservation) => {
    onSelectObservation(obs);
    SonificationEngine.getInstance().playObservation(obs);
    const spokenText = `${obs.regionName}. ${obs.variable}: ${obs.value} ${obs.unit}. Panned ${
      obs.longitude < 0 ? `${Math.abs(Math.round(obs.longitude / 1.8))}% to the left` : `${Math.round(obs.longitude / 1.8)}% to the right`
    }.`;
    speakDescription(spokenText);
  };

  return (
    <div
      className="px-4 sm:px-6 pt-14 pb-40 max-w-4xl mx-auto w-full space-y-5"
      role="region"
      aria-label={t('afmLabel')}
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 panel p-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[var(--brass)]" />
            <h2 className="font-display text-2xl font-bold">
              {t('afmList')}
            </h2>
          </div>
          <p className="text-sm text-[var(--ink-2)] mt-1 max-w-[60ch]">
            {t('afmListNote')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const next = !speechEnabled;
              setSpeechEnabled(next);
              if (next) speakDescription('Spoken text descriptions enabled.');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs  font-semibold flex items-center gap-1.5 border transition ${
              speechEnabled
                ? 'bg-[var(--rain)] text-[var(--brass-ink)] border-[var(--rain)]'
                : 'bg-[var(--panel-2)] text-[var(--ink-2)] border-[var(--line)] hover:bg-[var(--panel-2)]'
            }`}
            aria-pressed={speechEnabled}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>Voice Narration: {speechEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onExitAudioFirst}
            className="px-3 py-1.5 rounded-lg text-xs  bg-[var(--panel-2)] hover:bg-[var(--panel-2)] border border-[var(--line)] text-[var(--ink)] transition"
          >
            {t('afmSwitch')}
          </button>
        </div>
      </div>

      {countries && <CountryPanel list={countries.list} country={countries.country} point={countries.point} onSelect={countries.onSelect} />}

      {/* Phenomenon Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs  text-[var(--ink-3)] mr-2">{t('afmShow')}</span>
        <button
          onClick={() => setActivePhenomenonFilter('all')}
          className={`px-3 py-1 rounded text-xs  font-medium transition ${
            activePhenomenonFilter === 'all'
              ? 'bg-[var(--ink)] text-[var(--brass-ink)] font-semibold'
              : 'bg-[var(--panel)] text-[var(--ink-2)] hover:bg-[var(--panel-2)] border border-[var(--line)]'
          }`}
        >
          All Data ({observations.length})
        </button>
        <button
          onClick={() => setActivePhenomenonFilter('fire')}
          className={`px-3 py-1 rounded text-xs  font-medium flex items-center gap-1.5 transition ${
            activePhenomenonFilter === 'fire'
              ? 'bg-[var(--brass)] text-[var(--brass-ink)] font-semibold'
              : 'bg-[var(--panel)] text-[var(--brass)] hover:bg-[var(--panel-2)] border border-[var(--line)]'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{t('afmFires')}</span>
        </button>
        <button
          onClick={() => setActivePhenomenonFilter('precipitation')}
          className={`px-3 py-1 rounded text-xs  font-medium flex items-center gap-1.5 transition ${
            activePhenomenonFilter === 'precipitation'
              ? 'bg-[var(--rain)] text-[var(--brass-ink)] font-semibold'
              : 'bg-[var(--panel)] text-[var(--rain)] hover:bg-[var(--panel-2)] border border-[var(--line)]'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>{t('afmPrecip')}</span>
        </button>
        <button
          onClick={() => setActivePhenomenonFilter('sst')}
          className={`px-3 py-1 rounded text-xs  font-medium flex items-center gap-1.5 transition ${
            activePhenomenonFilter === 'sst'
              ? 'bg-[var(--warm)] text-[var(--brass-ink)] font-semibold'
              : 'bg-[var(--panel)] text-[var(--warm)] hover:bg-[var(--panel-2)] border border-[var(--line)]'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          <span>{t('afmOcean')}</span>
        </button>
      </div>

      {/* High-Contrast Accessible Observation Table / List */}
      <div className="panel overflow-hidden">
        <div className="p-3 border-b border-[var(--line)] flex items-center justify-between text-sm text-[var(--ink-2)]">
          <span className="text-[var(--ink-3)]">Date: {currentDateLabel}</span>
          <span>{t('afmTab')}</span>
        </div>

        <div className="divide-y divide-[var(--line)]">
          {filtered.map((obs) => {
            const isSelected = selectedObservation?.id === obs.id;
            const panPercent = Math.round((obs.longitude / 180) * 100);
            const panLabel = panPercent < 0 ? `${Math.abs(panPercent)}% Left` : panPercent > 0 ? `${panPercent}% Right` : 'Center';

            return (
              <div
                key={obs.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(obs)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(obs);
                  }
                }}
                className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer transition ${
                  isSelected
                    ? 'bg-[color-mix(in_srgb,var(--rain)_12%,transparent)] border-l-4 border-[var(--rain)] text-white'
                    : 'hover:bg-[var(--panel-2)] text-[var(--ink)]'
                }`}
                aria-label={`${obs.regionName}. ${obs.variable}: ${obs.value} ${obs.unit}. Stereo position: ${panLabel}.`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg mt-0.5"
                    style={{
                      backgroundColor:
                        obs.phenomenon === 'fire'
                          ? 'rgba(255, 77, 0, 0.15)'
                          : obs.phenomenon === 'precipitation'
                          ? 'rgba(0, 208, 255, 0.15)'
                          : 'rgba(191, 90, 242, 0.15)',
                      color:
                        obs.phenomenon === 'fire'
                          ? '#ff4d00'
                          : obs.phenomenon === 'precipitation'
                          ? '#00d0ff'
                          : '#bf5af2',
                    }}
                  >
                    {obs.phenomenon === 'fire' ? (
                      <Flame className="w-5 h-5" />
                    ) : obs.phenomenon === 'precipitation' ? (
                      <CloudRain className="w-5 h-5" />
                    ) : (
                      <Waves className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-sm text-white flex items-center gap-2">
                      <span>{obs.regionName}</span>
                      {isSelected && (
                        <span className="text-2xs  px-2 py-0.5 rounded bg-[var(--rain)] text-[var(--brass-ink)] font-semibold uppercase">
                          {t('afmNow')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--ink-3)] mt-0.5">
                      {obs.variable} • Coordinates: {obs.latitude > 0 ? `+${obs.latitude.toFixed(1)}°` : `${obs.latitude.toFixed(1)}°`} Lat, {obs.longitude > 0 ? `+${obs.longitude.toFixed(1)}°` : `${obs.longitude.toFixed(1)}°`} Lon
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs ">
                  <div className="text-right">
                    <div className="text-base font-semibold text-white">
                      {obs.value} <span className="text-xs text-[var(--ink-3)]">{obs.unit}</span>
                    </div>
                    {obs.delta !== undefined && (
                      <div className={`text-2xs ${obs.delta >= 0 ? 'text-[var(--brass)]' : 'text-[var(--cold)]'}`}>
                        Δ {obs.delta > 0 ? `+${obs.delta.toFixed(1)}` : obs.delta.toFixed(1)} vs day before
                      </div>
                    )}
                  </div>

                  <div className="chip tnum">
                    Pan: {panLabel}
                  </div>

                  <button
                    className="p-2 rounded-lg bg-[var(--panel-2)] hover:bg-[var(--panel-2)] text-[var(--ink)] transition"
                    title={t('afmPlay')}
                    aria-label={`Play audio for ${obs.regionName}`}
                  >
                    <Volume2 className="w-4 h-4 text-[var(--brass)]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
