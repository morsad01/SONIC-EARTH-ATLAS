import { Flame, CloudRain, Waves } from 'lucide-react';
import type { PhenomenonType } from '../types/dataset';
import type { StringKey } from '../lib/strings';

/** Name, unit, sound description, colour and icon of each Atlas layer. */
export const LAYER_META: Record<PhenomenonType, { name: StringKey; unit: StringKey; sound: StringKey; color: string; Icon: typeof Flame }> = {
  fire: { name: 'fire', unit: 'fireUnit', sound: 'fireSound', color: 'var(--fire)', Icon: Flame },
  precipitation: { name: 'rain', unit: 'rainUnit', sound: 'rainSound', color: 'var(--rain)', Icon: CloudRain },
  sst: { name: 'ocean', unit: 'oceanUnit', sound: 'oceanSound', color: 'var(--warm)', Icon: Waves },
};
