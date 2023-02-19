import React from 'react';
import Fade from 'react-reveal/Fade';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';

const StyledInfo = styled.p`
  //   font-size: 7vw;
  text-align: left;
  padding-bottom: 0.5em;
  margin-top: 0.7em;
  margin-left: -0.2em;
`;

export const Info = () => {
  const { t } = useTranslation('info');

  return (
    <Fade bottom>
      <StyledInfo>{t('content')}</StyledInfo>
    </Fade>
  );
};
