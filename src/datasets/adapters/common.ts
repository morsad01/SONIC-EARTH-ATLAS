import type { DatasetTimeSlice, EarthObservation } from '../../types/dataset';

export interface SliceJson { generated?: string; slices: DatasetTimeSlice[] }

/** Atlas layers key their slices by calendar date. */
export const byDate = (j: { slices: DatasetTimeSlice[] }) => new Map(j.slices.map((s) => [s.dateLabel, s.observations]));

/** Valid = finite value and coordinates on Earth. Invalid rows are dropped, never repaired. */
export const validObs = (o: EarthObservation) => Number.isFinite(o.value) && Math.abs(o.latitude) <= 90 && Math.abs(o.longitude) <= 180;

export const sliceDates = (j: SliceJson) => j.slices.map((s) => s.dateLabel).sort();
