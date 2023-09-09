import React from 'react';
import ReactHtmlParser from 'react-html-parser';
import { PROJECT_BASE } from '../constants/routes';
import i18n from '../i18n';

const translateTitle = (title, t) => {
  const needsTranslation = (title ?? '@@untitled').startsWith('@@');
  return [needsTranslation ? t(title) : title, needsTranslation];
};

export const getPriceCad = (price) => (i18n.language === 'en' ? `$${price}` : `${price} $`);

export const formatTitle = (title, t) => {
  const [mightBeTranslatedTitle, translated] = translateTitle(title, t);
  if (!translated) {
    return <i>{mightBeTranslatedTitle}</i>;
  }

  return ReactHtmlParser(mightBeTranslatedTitle);
};

export const formatTechnique = (techniques, t) => {
  if (!techniques) {
    return null;
  }
  if (techniques.length === 1) {
    return t(techniques[0]);
  }
  if (techniques.length === 2) {
    return t(techniques[0]) + ' ' + t(techniques[1]);
  }

  return `${techniques.slice(0, -2).map(t).join(', ')} ${t('and')} ${t(techniques.slice(-2))} ${t(
    techniques.slice(-1),
  )}`;
};

export const navigateToAnotherProject = (id, history) => {
  history.push(`${PROJECT_BASE}/${id}`);
};

export const getTitleAlt = (title, t) => {
  const [translatedTitle] = translateTitle(title, t);
  return `${translatedTitle.replaceAll(/(<i>|<\/i>)/g, '"')}`;
};

export const formatAvailableHref = (href, id, title, t) => {
  if (!href) return null;
  const mailto = href.startsWith('mailto');
  if (!mailto) return href;
  return `${href}?subject=[${id}] ${getTitleAlt(title, t)}`;
};
