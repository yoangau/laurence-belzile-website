/** Shape of the v1 (Create React App) data, read from a checkout of `master`. */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export type LegacyProject = {
  id: string;
  src: string;
  available: boolean | null;
  title: string | null;
  dimension: string | null | [];
  technique: string[] | null;
  year: number;
  price: number | null;
  'buy-ref': string | null;
  expo: boolean;
  'expo-only'?: boolean;
  'photo-credit': string;
  width: string;
  description?: string;
  'additional-images'?: { src: string; 'photo-credit': string }[];
  [key: string]: unknown;
};

export type LegacyResume = {
  title: string;
  year: { date: number | string; list: { val: string; link?: string }[] }[];
}[];

type Namespaces = Record<'common' | 'resume' | 'work' | 'info' | 'contact', Record<string, string>>;

export type Legacy = {
  root: string;
  projects: LegacyProject[];
  resume: LegacyResume;
  fr: Namespaces;
  en: Namespaces;
  priceMap: Record<string, number>;
};

const readJson = async <T>(root: string, path: string): Promise<T> =>
  JSON.parse(await readFile(join(root, path), 'utf8')) as T;

export const loadLegacy = async (root: string): Promise<Legacy> => ({
  root,
  projects: await readJson(root, 'src/data/projects.json'),
  resume: await readJson(root, 'src/data/resume.json'),
  fr: await readJson(root, 'src/i18n/fr.json'),
  en: await readJson(root, 'src/i18n/en.json'),
  priceMap: (
    await readJson<{ dimension_price_map: Record<string, number> }>(root, 'image_processing/price_config.json')
  ).dimension_price_map,
});

export const LEGACY_PATHS = {
  projects: 'public/projects',
  portrait: 'public/Laurence_Belzile_profil.jpg',
  resume: 'public/resume',
  catalogueUrl: 'https://s3.us-east-1.amazonaws.com/laurencebelzile.com/catalogue2026.pdf',
};
