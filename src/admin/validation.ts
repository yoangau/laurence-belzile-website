/**
 * Validates the draft with the shared schema and turns Zod issues into French messages
 * that name the field ("Œuvre LB00654 · Prix : Ce champ est requis").
 */
import type { z } from 'zod';
import { ContentSchema, type Content } from '../content/schema';
import type { Issue } from './api';

type ErrorMap = NonNullable<NonNullable<Parameters<typeof ContentSchema.safeParse>[1]>['error']>;

/** French messages for Zod's built-in checks. Messages written in the schema take precedence. */
const frenchError: ErrorMap = (issue) => {
  switch (issue.code) {
    case 'too_small':
      if (issue.origin === 'array') return 'Au moins un élément est requis';
      if (issue.origin === 'string') return 'Ce champ est requis';
      return issue.inclusive ? `Doit être au moins ${issue.minimum}` : `Doit être plus grand que ${issue.minimum}`;
    case 'too_big':
      return `Doit être au plus ${issue.maximum}`;
    case 'invalid_type':
      if (issue.input === undefined) return 'Ce champ est requis';
      return issue.expected === 'int' ? 'Doit être un nombre entier' : 'Valeur invalide';
    case 'invalid_format':
      if (issue.format === 'email') return 'Adresse courriel invalide';
      if (issue.format === 'url') return 'Adresse web invalide (elle doit commencer par https://)';
      if (issue.format === 'datetime') return 'Date invalide';
      return 'Format invalide';
    default:
      return 'Valeur invalide';
  }
};

const FIELDS: Record<string, string> = {
  title: 'Titre',
  year: 'Année',
  description: 'Description',
  images: 'Images',
  displayWidth: "Taille d'affichage",
  medium: 'Technique',
  dimensions: 'Dimensions',
  availability: 'Disponibilité',
  price: 'Prix',
  saleUrl: "Lien d'achat",
  venue: 'Lieu',
  credit: 'Crédit photo',
  text: 'Texte',
  url: 'Lien',
  label: 'Libellé',
  file: 'Fichier',
  placement: 'Emplacement',
  email: 'Courriel',
  instagramUrl: 'Instagram',
  facebookUrl: 'Facebook',
  photographers: 'Photographes',
  priceTable: 'Grille de prix',
  portrait: 'Portrait',
  analyticsId: 'Google Analytics',
  name: 'Nom',
  id: 'Identifiant',
  fr: 'FR',
  en: 'EN',
};

/** "works.3.title.fr" → "Œuvre LB00654 · Titre · FR" */
export const describePath = (content: Content, path: PropertyKey[]): string => {
  const [root, index, ...rest] = path;
  const parts: string[] = [];
  let fields = rest;
  if (root === 'works' && typeof index === 'number') {
    const work = content.works[index];
    parts.push(`${work?.kind === 'exhibition' ? 'Exposition' : 'Œuvre'} ${work?.id ?? index + 1}`);
  } else if (root === 'cv' && typeof index === 'number') {
    const section = content.cv[index];
    parts.push(`CV « ${section?.title.fr || index + 1} »`);
    if (rest[0] === 'entries' && typeof rest[1] === 'number') {
      parts.push(`ligne ${rest[1] + 1}`);
      fields = rest.slice(2);
    }
  } else if (root === 'documents' && typeof index === 'number') {
    parts.push(`Document « ${content.documents[index]?.label.fr || index + 1} »`);
  } else if (root === 'settings') {
    parts.push('Réglages');
    fields = [index ?? '', ...rest];
  } else if (root === 'bio') {
    parts.push('Bio');
    fields = [index ?? ''];
  }
  for (const field of fields) {
    if (typeof field === 'number') parts.push(`n° ${field + 1}`);
    else if (typeof field === 'string' && FIELDS[field]) parts.push(FIELDS[field]);
  }
  return parts.join(' · ');
};

export type ValidationIssue = Issue & {
  /** Where the problem is, in words. */
  where: string;
};

const toIssue = (content: Content, issue: z.core.$ZodIssue): ValidationIssue => {
  const message =
    issue.code === 'too_small' && issue.path.at(-1) === 'images' ? 'Ajoutez au moins une image' : issue.message;
  return { path: issue.path.join('.'), message, where: describePath(content, issue.path) };
};

export const validateContent = (content: Content): ValidationIssue[] => {
  const result = ContentSchema.safeParse(content, { error: frenchError });
  return result.success ? [] : result.error.issues.map((issue) => toIssue(content, issue));
};

/** Server-side issues (422) only carry a dotted path. */
export const fromServerIssues = (content: Content, issues: Issue[]): ValidationIssue[] =>
  issues.map((issue) => ({
    ...issue,
    where: describePath(
      content,
      issue.path.split('.').map((p) => (/^\d+$/.test(p) ? Number(p) : p)),
    ),
  }));
