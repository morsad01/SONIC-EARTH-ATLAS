/** Views and the v3 sections they belong to (roadmap D2). */
export type Track = 'atlas' | 'frames' | 'monsoon' | 'pulse' | 'about' | 'jukebox';
export type Section = 'explore' | 'jukebox' | 'about';
type TrackKey = 'track1' | 'track2' | 'track3' | 'track4';
export const TRACKS: { id: Exclude<Track, 'about' | 'jukebox'>; key: TrackKey; code: string }[] = [
  { id: 'atlas', key: 'track1', code: 'A1' },
  { id: 'frames', key: 'track2', code: 'A2' },
  { id: 'monsoon', key: 'track3', code: 'B1' },
  { id: 'pulse', key: 'track4', code: 'B2' },
];
/** The Data Jukebox holds A2/B1/B2 as collections. */
export const JUKEBOX_TRACKS = TRACKS.filter((t) => t.id !== 'atlas');
export const sectionOf = (t: Track): Section => (t === 'atlas' ? 'explore' : t === 'about' ? 'about' : 'jukebox');

export const REPO_URL = 'https://github.com/morsad01/SONIC-EARTH-ATLAS';
export const SOURCE_LINKS: { name: string; url: string }[] = [
  { name: 'NASA FIRMS', url: 'https://firms.modaps.eosdis.nasa.gov/' },
  { name: 'NASA POWER', url: 'https://power.larc.nasa.gov/' },
  { name: 'JPL MUR SST', url: 'https://podaac.jpl.nasa.gov/MEaSUREs-MUR' },
  { name: 'NASA GISS GISTEMP', url: 'https://data.giss.nasa.gov/gistemp/' },
  { name: 'NASA GIBS', url: 'https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api' },
  { name: 'Earth Information Center', url: 'https://earth.gov/' },
];
