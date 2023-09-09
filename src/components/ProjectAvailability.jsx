import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { getPriceCad, formatAvailableHref } from '../utils/project';
import { ProjectInfoEntry } from './lib';

const StyledAvailable = styled.a`
  font-size: 1.5em;
  color: #000000;
  text-decoration: underline;

  &:hover,
  &:focus {
    cursor: pointer;
    color: #aaaaaa;
  }
`;

export const ProjectAvailability = ({ available, price, title, id, buyRef }) => {
  const { t } = useTranslation('work');

  if (available === null) return <></>;

  if (!available) return <ProjectInfoEntry>{t('sold')}</ProjectInfoEntry>;

  if (!buyRef || !price) return <ProjectInfoEntry>{t('unavailable')}</ProjectInfoEntry>;

  return (
    <>
      <StyledAvailable href={formatAvailableHref(buyRef, id, title, t)} target="_blank">
        {t('available')}
      </StyledAvailable>
      <ProjectInfoEntry>{getPriceCad(price)}</ProjectInfoEntry>
    </>
  );
};
