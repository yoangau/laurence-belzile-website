import React from 'react';
import ReactHtmlParser from 'react-html-parser';
import { PROJECT_BASE } from '../constants/routes';
import i18n from '../i18n';

export const getPriceCad = (price) => (i18n.language === 'en' ? `$${price}` : `${price} $`);

export const formatTitle = (title, t) => {
  if (!(title ?? '@@untitled').startsWith('@@')) {
    return <i>{title}</i>;
  }

  return ReactHtmlParser(t(title));
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

export const formatAvailableHref = (href, { id, title }, t) =>
  href.startsWith('mailto')
    ? `${href}?subject=[${id}] ${title.startsWith('@@') ? t(title).replaceAll(/(<i>|<\/i>)/g, '"') : title}`
    : href;
