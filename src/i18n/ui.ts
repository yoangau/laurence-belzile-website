/**
 * Interface strings (menus, labels). Content (titles, CV, bio…) is edited in the admin instead.
 * French is served at the root (`/work`), English under `/en` (`/en/work`).
 */
import { DEFAULT_LOCALE, type Locale } from '../content/schema';

export const ui = {
  fr: {
    'nav.work': 'œuvres',
    'nav.exhibitions': 'expositions',
    'nav.cv': 'cv',
    'nav.info': 'infos',
    'nav.contact': 'contact',
    'nav.switch': 'en',
    'nav.switchLabel': 'English',
    'site.description': 'Artiste en art visuel',
    'work.title': 'Œuvres',
    'work.filterAll': 'Toutes',
    'work.filterAvailable': 'Disponibles',
    'work.available': 'disponible',
    'work.unavailable': 'non disponible',
    'work.sold': 'vendue',
    'work.photoCredit': 'crédit photo : ',
    'work.previous': 'Œuvre précédente',
    'work.next': 'Œuvre suivante',
    'work.years': 'Années',
    'exhibitions.title': 'Expositions',
    'cv.title': 'Curriculum vitæ',
    'info.title': 'Infos',
    'contact.title': 'Me contacter',
    'contact.mailingList': "Liste d'envoi",
    'contact.email': 'Votre adresse courriel',
    'contact.subscribe': "S'abonner",
    'contact.subscribing': 'Abonnement en cours…',
    'contact.subscribed': "Vous êtes abonné·e à la liste d'envoi. Merci!",
    'contact.failed': 'Une erreur est survenue. Veuillez réessayer.',
    'notFound.title': 'Page introuvable',
    'notFound.back': "Retour à l'accueil",
  },
  en: {
    'nav.work': 'work',
    'nav.exhibitions': 'exhibitions',
    'nav.cv': 'cv',
    'nav.info': 'info',
    'nav.contact': 'contact',
    'nav.switch': 'fr',
    'nav.switchLabel': 'Français',
    'site.description': 'Visual artist',
    'work.title': 'Work',
    'work.filterAll': 'All',
    'work.filterAvailable': 'Available',
    'work.available': 'available',
    'work.unavailable': 'unavailable',
    'work.sold': 'sold',
    'work.photoCredit': 'photo credit: ',
    'work.previous': 'Previous work',
    'work.next': 'Next work',
    'work.years': 'Years',
    'exhibitions.title': 'Exhibitions',
    'cv.title': 'Curriculum vitae',
    'info.title': 'Info',
    'contact.title': 'Contact me',
    'contact.mailingList': 'Mailing list',
    'contact.email': 'Your email address',
    'contact.subscribe': 'Subscribe',
    'contact.subscribing': 'Subscribing…',
    'contact.subscribed': 'You are subscribed to the mailing list. Thank you!',
    'contact.failed': 'Something went wrong. Please try again.',
    'notFound.title': 'Page not found',
    'notFound.back': 'Back to the home page',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UiKey = keyof (typeof ui)['fr'];

export const useTranslations = (locale: Locale) => (key: UiKey) => ui[locale][key];

/** `lang` route param → locale (`undefined` = French at the root). */
export const localeFromParam = (lang: string | undefined): Locale => (lang === 'en' ? 'en' : DEFAULT_LOCALE);

/** Static paths for pages under `src/pages/[...lang]/`. */
export const localeParams = () => [{ params: { lang: undefined } }, { params: { lang: 'en' } }];

/** Prefixes an internal path for the locale: `/work` → `/en/work`. External URLs are untouched. */
export const localePath = (locale: Locale, path: string): string => {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  if (locale === DEFAULT_LOCALE) return path;
  return path === '/' ? '/en' : `/en${path}`;
};

/** The same page in the other language. */
export const alternatePath = (pathname: string, to: Locale): string => {
  const bare = pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  return localePath(to, bare);
};

export const HTML_LANG: Record<Locale, string> = { fr: 'fr-CA', en: 'en-CA' };
