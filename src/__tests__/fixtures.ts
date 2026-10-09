/** The bundled snapshot files, read through Vite so tests need no node typings. Keys are the public URLs, e.g. "/data/vital_signs.json". */
const files = import.meta.glob('../../public/data/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;
export const dataFile = (url: string) => {
  const hit = files[`../../public${url}`];
  if (!hit) throw new Error(`no fixture for ${url}`);
  return JSON.parse(JSON.stringify(hit)); // a fresh copy, so one test cannot change another's data
};
