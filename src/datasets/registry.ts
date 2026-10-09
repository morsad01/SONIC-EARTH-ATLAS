import type { Track } from '../lib/nav';
import type { CoverageRow } from '../countries/countryCoverage';
import type { Coverage } from './series';

/** The datasets the app knows about, and what each one can honestly say about a place (roadmap D6). */
export type DatasetId = 'fire' | 'precipitation' | 'sst' | 'power-monthly' | 'monsoon' | 'gistemp' | 'vital-signs' | 'eic';
export type Scope = 'global' | 'country' | 'bgd-only';

export interface DatasetEntry {
  id: DatasetId;
  title: string;
  titleBn: string;
  scope: Scope;
  coverage: Coverage; // how it relates to a country when it does apply
  collection: Track; // where it plays today
}

export const REGISTRY: DatasetEntry[] = [
  { id: 'fire', title: 'Fire detections (NASA FIRMS VIIRS)', titleBn: 'আগুনের শনাক্তকরণ (NASA FIRMS VIIRS)', scope: 'country', coverage: 'cells-in-border', collection: 'atlas' },
  { id: 'precipitation', title: 'Daily rain (NASA POWER, sampled grid)', titleBn: 'দৈনিক বৃষ্টি (NASA POWER, নমুনা গ্রিড)', scope: 'country', coverage: 'points-in-border', collection: 'atlas' },
  { id: 'sst', title: 'Sea surface temperature anomaly (JPL MUR)', titleBn: 'সমুদ্রপৃষ্ঠের তাপমাত্রার ব্যতিক্রম (JPL MUR)', scope: 'country', coverage: 'cells-in-border', collection: 'atlas' },
  { id: 'power-monthly', title: 'Monthly temperature and rain at one point (NASA POWER, 1981–2025)', titleBn: 'একটি বিন্দুতে মাসিক তাপমাত্রা ও বৃষ্টি (NASA POWER, ১৯৮১–২০২৫)', scope: 'country', coverage: 'point-sample', collection: 'atlas' },
  { id: 'monsoon', title: 'Bangladesh monsoon, 8 divisions (NASA POWER)', titleBn: 'বাংলাদেশের বর্ষা, ৮ বিভাগ (NASA POWER)', scope: 'bgd-only', coverage: 'point-sample', collection: 'monsoon' },
  { id: 'gistemp', title: 'Global temperature since 1880 (GISTEMP)', titleBn: '১৮৮০ থেকে বৈশ্বিক তাপমাত্রা (GISTEMP)', scope: 'global', coverage: 'global-context', collection: 'pulse' },
  { id: 'vital-signs', title: 'CO₂ and Arctic sea ice (Vital Signs)', titleBn: 'CO₂ ও আর্কটিক সামুদ্রিক বরফ (Vital Signs)', scope: 'global', coverage: 'global-context', collection: 'pulse' },
  { id: 'eic', title: 'Earth Information Center frames', titleBn: 'আর্থ ইনফরমেশন সেন্টারের ছবি', scope: 'global', coverage: 'global-context', collection: 'frames' },
];

export type Availability = 'data' | 'global-context';
export interface AvailableDataset { entry: DatasetEntry; availability: Availability }

/**
 * Datasets that genuinely apply to a place. 'global' lists everything that has a global form. For a country code:
 * a gridded layer only when at least one cell or point lies inside the border (per `coverage`), POWER monthly always (it is a point sample on land),
 * the monsoon only for Bangladesh, and the global records as context, labelled as such. Nothing is listed "just in case".
 */
export function availableFor(target: string | 'global', coverage: CoverageRow[] = []): AvailableDataset[] {
  if (target === 'global') return REGISTRY.filter((e) => e.scope !== 'bgd-only' && e.id !== 'power-monthly').map((entry) => ({ entry, availability: entry.scope === 'global' ? 'global-context' : 'data' }));
  const out: AvailableDataset[] = [];
  for (const entry of REGISTRY) {
    if (entry.scope === 'global') out.push({ entry, availability: 'global-context' });
    else if (entry.scope === 'bgd-only') { if (target === 'BGD') out.push({ entry, availability: 'data' }); }
    else if (entry.id === 'power-monthly') out.push({ entry, availability: 'data' });
    else if (coverage.some((r) => r.dataset === entry.id && r.count > 0)) out.push({ entry, availability: 'data' });
  }
  return out;
}
