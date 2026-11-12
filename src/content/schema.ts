/**
 * The whole site's content, as one JSON document.
 *
 * This file is the single source of truth: the public site, the admin, the API
 * and the migration script all validate against it. Change the model here first.
 *
 * Text fields accept a tiny markdown subset (see `src/content/text.ts`):
 * `*italic*`, `**bold**`, `[link](https://…)`, and blank lines for paragraphs in long texts.
 */
import { z } from 'zod';

export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'fr';

/** A translated string. An empty `en` falls back to `fr`. */
export const L10nSchema = z.object({
  fr: z.string(),
  en: z.string(),
});
export type L10n = z.infer<typeof L10nSchema>;

const idSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9._-]+$/, 'Lettres, chiffres, point, tiret et soulignement seulement');

/** Image widths generated for every upload (only those ≤ the original width are kept). */
export const IMAGE_WIDTHS = [480, 960, 1600, 2400] as const;

/**
 * An uploaded image. Files live in the public media bucket:
 *   img/<id>/<width>.webp   for each entry of `widths`
 *   img/<id>/og.jpg          1200px JPEG for social previews
 */
export const ImageSchema = z.object({
  id: idSchema,
  /** Pixel size of the largest variant. */
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  widths: z.array(z.number().int().positive()).min(1),
  /** Tiny blurred preview, as a data URI. */
  lqip: z.string().startsWith('data:image/'),
  /** Dominant color, `#rrggbb`. */
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  /** Photographer id (see `settings.photographers`). */
  credit: z.string().optional(),
});
export type Image = z.infer<typeof ImageSchema>;

const workBase = {
  /** Shown in URLs (`/projet/<id>`) and in purchase e-mail subjects. Never change it once published. */
  id: idSchema,
  /** Shown in italics. Empty → "sans titre" / "untitled". */
  title: L10nSchema,
  year: z.number().int().min(1900).max(2200),
  description: L10nSchema.optional(),
  /** First image is the main one. */
  images: z.array(ImageSchema).min(1),
  /** Width of the image in the feed, in % of the column. Reflects the artwork's scale. */
  displayWidth: z.number().int().min(10).max(100),
  /** Hidden works are kept in the admin but not published. */
  hidden: z.boolean(),
};

export const AVAILABILITIES = ['available', 'sold', 'unavailable', 'none'] as const;

export const ArtworkSchema = z
  .object({
    ...workBase,
    kind: z.literal('artwork'),
    /** E.g. "acrylique sur toile" / "acrylic on canvas". */
    medium: L10nSchema.optional(),
    /** In inches, in the order they are displayed (`a" x b"`). */
    dimensions: z.tuple([z.number().positive(), z.number().positive()]).optional(),
    /**
     * available   → "disponible" link + price
     * sold        → "vendue"
     * unavailable → "non disponible"
     * none        → nothing shown (studies, residency projects…)
     */
    availability: z.enum(AVAILABILITIES),
    /** CAD. Required when available. */
    price: z.number().int().positive().optional(),
    /** Link to a gallery's shop. Empty → e-mail to the artist with the id in the subject. */
    saleUrl: z.url().optional(),
  })
  .refine((a) => a.availability !== 'available' || a.price !== undefined, {
    message: 'Un prix est requis pour une œuvre disponible',
    path: ['price'],
  });
export type Artwork = z.infer<typeof ArtworkSchema>;

export const ExhibitionSchema = z.object({
  ...workBase,
  kind: z.literal('exhibition'),
  /** E.g. "Galerie Montcalm, Gatineau (QC)". */
  venue: z.string().optional(),
});
export type Exhibition = z.infer<typeof ExhibitionSchema>;

export const WorkSchema = z.discriminatedUnion('kind', [ArtworkSchema, ExhibitionSchema]);
export type Work = z.infer<typeof WorkSchema>;

export const CvEntrySchema = z.object({
  /** Free text: "2024", "2022-2025", or empty. */
  year: z.string(),
  text: L10nSchema,
  /** External URL, or an internal path such as `/projet/LB00528`. */
  url: z.string().optional(),
});
export type CvEntry = z.infer<typeof CvEntrySchema>;

export const CvSectionSchema = z.object({
  id: idSchema,
  title: L10nSchema,
  entries: z.array(CvEntrySchema),
});
export type CvSection = z.infer<typeof CvSectionSchema>;

export const DOCUMENT_PLACEMENTS = ['nav', 'cv', 'none'] as const;

/** A PDF. Files live in the media bucket under `docs/`. */
export const DocumentSchema = z.object({
  id: idSchema,
  label: L10nSchema,
  /** Media keys per language (`en` may reuse the French file). */
  file: z.object({ fr: z.string().min(1), en: z.string().min(1) }),
  /** `nav` → link in the top menu; `cv` → download link on the CV page. */
  placement: z.enum(DOCUMENT_PLACEMENTS),
  /** Old URLs that should keep working, e.g. `/catalogue2026.pdf`. */
  legacyPaths: z.array(z.string().startsWith('/')),
});
export type Document = z.infer<typeof DocumentSchema>;

export const PhotographerSchema = z.object({ id: idSchema, name: z.string().min(1) });

export const PriceRowSchema = z.object({
  dimensions: z.tuple([z.number().positive(), z.number().positive()]),
  price: z.number().int().positive(),
});
export type PriceRow = z.infer<typeof PriceRowSchema>;

export const SettingsSchema = z.object({
  email: z.email(),
  instagramUrl: z.url().optional(),
  facebookUrl: z.url().optional(),
  photographers: z.array(PhotographerSchema),
  /** Used by the admin to suggest prices from dimensions. */
  priceTable: z.array(PriceRowSchema),
  /** Portrait on the info page. */
  portrait: ImageSchema.optional(),
  /** Google Analytics 4 measurement id (`G-…`). Empty → no analytics. */
  analyticsId: z.string().optional(),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const ContentSchema = z
  .object({
    version: z.literal(1),
    updatedAt: z.iso.datetime(),
    /** In display order: newest first. */
    works: z.array(WorkSchema),
    cv: z.array(CvSectionSchema),
    /** Info page, long markdown text (`## Heading` allowed). */
    bio: L10nSchema,
    documents: z.array(DocumentSchema),
    settings: SettingsSchema,
  })
  .superRefine((content, ctx) => {
    const seen = new Set<string>();
    content.works.forEach((work, i) => {
      if (seen.has(work.id)) {
        ctx.addIssue({ code: 'custom', message: `Identifiant en double : ${work.id}`, path: ['works', i, 'id'] });
      }
      seen.add(work.id);
    });
    const photographers = new Set(content.settings.photographers.map((p) => p.id));
    content.works.forEach((work, i) =>
      work.images.forEach((image, j) => {
        if (image.credit && !photographers.has(image.credit)) {
          ctx.addIssue({
            code: 'custom',
            message: `Photographe inconnu : ${image.credit}`,
            path: ['works', i, 'images', j, 'credit'],
          });
        }
      }),
    );
  });
export type Content = z.infer<typeof ContentSchema>;

export const parseContent = (data: unknown): Content => ContentSchema.parse(data);
