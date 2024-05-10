import React from 'react';
import Fade from 'react-reveal/Fade';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { Image } from 'antd';
import { CustomHelmet } from '../components/CustomHelmet';

const StyledInfo = styled.p`
  font-weight: bold;
  text-align: justify;
  padding-bottom: 0.5em;
  margin-top: 6em;
  margin-left: -0.2em;
  margin-right: 5em;
`;

const StyledInfo1 = styled.p`
  text-align: justify;
  padding-bottom: 0.5em;
  margin-top: 1em;
  margin-left: -0.2em;
  margin-right: 7em;
`;

const StyledInfo2 = styled.p`
  font-weight: bold;
  text-align: justify;
  padding-bottom: 1.5em;
  margin-top: 6em;
  margin-left: -0.2em;
  margin-right: 7em;
`;

const StyledInfo3 = styled.p`
  text-align: justify;
  padding-bottom: 0.5em;
  margin-left: -0.2em;
  margin-right: 7em;
`;

const StyledInfo4 = styled.p`
  text-align: justify;
  padding-bottom: 3.5em;
  margin-left: -0.2em;
  margin-right: 7em;
`;

export const Info = () => {
  const { t } = useTranslation('info');

  return (
    <>
      <CustomHelmet description={t('content-0')} />
      <Fade bottom>
        <Image draggable={false} width="70%" fluid="true" preview={false} src="/Laurence_Belzile_profil.jpg" />
        <StyledInfo>{t('content-0')}</StyledInfo>
        <StyledInfo1>{t('content')}</StyledInfo1>
        <StyledInfo2>{t('content-2')}</StyledInfo2>
        <StyledInfo3>{t('content-3')}</StyledInfo3>
        <StyledInfo3>{t('content-4')}</StyledInfo3>
        <StyledInfo3>{t('content-5')}</StyledInfo3>
        <StyledInfo3>{t('content-6')}</StyledInfo3>
        <StyledInfo3>{t('content-7')}</StyledInfo3>
        <StyledInfo3>{t('content-8')}</StyledInfo3>
        <StyledInfo4>{t('content-9')}</StyledInfo4>
      </Fade>
    </>
  );
};
