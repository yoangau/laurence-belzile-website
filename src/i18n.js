import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './i18n/en.json';
import fr from './i18n/fr.json';

const resources = {
  en,
  fr,
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(LanguageDetector)
  .init({
    defaultNS: 'common',
    defaultLanguage: 'fr',
    otherLanguages: ['en'],
    fallbackLng: 'fr',
    resources,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
