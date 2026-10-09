import { createContext } from 'react';
import type { DatasetTimeSlice, PhenomenonType } from '../types/dataset';

/** What the country profile needs from the app: the Atlas slices already loaded, their file stamps, and the "Explore its sound" action. */
export interface ProfileData { slices: DatasetTimeSlice[]; snapshotDates?: Partial<Record<PhenomenonType, string>>; isFallback: boolean; loading: boolean; onExplore?: (country: string) => void }
export const ProfileDataContext = createContext<ProfileData | null>(null);
