import React from 'react';
import Fade from 'react-reveal/Fade';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';

const StyledInfo = styled.p`
  font-size: 1.2vw;
  font-weight: bold;
  text-align: justify;
  padding-bottom: 0.5em;
  margin-top: 1.8em;
  margin-left: -0.2em;
  margin-right: 18em;
`;

const StyledInfo1 = styled.p`
  font-size: 1.2vw;
  text-align: justify;
  padding-bottom: 0.5em;
  margin-top: 1em;
  margin-left: -0.2em;
  margin-right: 18em;
`;

const StyledInfo2 = styled.p`
  font-size: 1.2vw;
  font-weight: bold;
  text-align: justify;
  padding-bottom: 1.5em;
  margin-top: 6em;
  margin-left: -0.2em;
`;

const StyledInfo3 = styled.p`
  font-size: 1.2vw;
  text-align: justify;
  padding-bottom: 0.5em;
  margin-left: -0.2em;
  margin-right: 18em;
`;

export const Info = () => {
  const { t } = useTranslation('info');

  return (
    <Fade bottom>
      <StyledInfo>{t('content-0')}</StyledInfo>
      <StyledInfo1>{t('content')}</StyledInfo1>
      <StyledInfo2>{t('content-2')}</StyledInfo2>
      <StyledInfo3>{t('content-3')}</StyledInfo3>
      <StyledInfo3>{t('content-4')}</StyledInfo3>
      <StyledInfo3>{t('content-5')}</StyledInfo3>
    </Fade>
  );
};