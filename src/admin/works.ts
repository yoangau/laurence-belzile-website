/** Domain helpers for works (artworks and exhibitions) used by the list and the editor. */
import type { Draft } from 'immer';
import { AVAILABILITIES, type Artwork, type Content, type Exhibition, type Work } from '../content/schema';
import { edit } from './state';

export type Kind = Work['kind'];
export type Availability = (typeof AVAILABILITIES)[number];

export const KIND = {
  artwork: { path: '/oeuvres', plural: 'Œuvres', one: 'œuvre', new: 'Nouvelle œuvre' },
  exhibition: { path: '/expositions', plural: 'Expositions', one: 'exposition', new: 'Nouvelle exposition' },
} as const satisfies Record<Kind, unknown>;

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  available: 'Disponible',
  sold: 'Vendue',
  unavailable: 'Non disponible',
  none: 'Rien afficher',
};

export const AVAILABILITY_COLORS: Record<Availability, string> = {
  available: 'teal',
  sold: 'red',
  unavailable: 'gray',
  none: 'gray',
};

/** Next free id: "LB" + 5 digits, one more than the largest number in use (LB00051.1 counts as 51). */
export const nextWorkId = (content: Content): string => {
  const taken = new Set(content.works.map((w) => w.id));
  let n = Math.max(0, ...content.works.map((w) => Number(/^LB(\d+)/i.exec(w.id)?.[1] ?? 0))) + 1;
  while (taken.has(`LB${String(n).padStart(5, '0')}`)) n++;
  return `LB${String(n).padStart(5, '0')}`;
};

export const newWork = (kind: Kind, id: string): Work => {
  const base = {
    id,
    title: { fr: '', en: '' },
    year: new Date().getFullYear(),
    images: [],
    hidden: false,
  };
  return kind === 'artwork'
    ? ({ ...base, kind, displayWidth: 60, availability: 'available' } satisfies Artwork)
    : ({ ...base, kind, displayWidth: 100 } satisfies Exhibition);
};

export const updateWork = (id: string, recipe: (work: Draft<Work>) => void) =>
  edit((draft) => {
    const work = draft.works.find((w) => w.id === id);
    if (work) recipe(work);
  });

export const updateArtwork = (id: string, recipe: (work: Draft<Artwork>) => void) =>
  updateWork(id, (work) => {
    if (work.kind === 'artwork') recipe(work);
  });

/**
 * Moves `id` next to `targetId` in the full feed order: before it when moving up, after it when
 * moving down. This is what reordering a filtered list (only artworks, only 2024…) means.
 */
export const moveWork = (id: string, targetId: string, direction: 'up' | 'down') =>
  edit((draft) => {
    const from = draft.works.findIndex((w) => w.id === id);
    if (from < 0 || id === targetId) return;
    const [work] = draft.works.splice(from, 1);
    const target = draft.works.findIndex((w) => w.id === targetId);
    draft.works.splice(direction === 'up' ? target : target + 1, 0, work!);
  });

/** Distinct existing values of a text field, most used first (for autocomplete). */
export const distinctValues = (values: (string | undefined)[]): string[] => {
  const counts = new Map<string, number>();
  for (const v of values) if (v?.trim()) counts.set(v.trim(), (counts.get(v.trim()) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
};
