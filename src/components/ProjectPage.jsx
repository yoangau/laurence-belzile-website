import React from 'react';
import { useParams } from 'react-router-dom';
import { Image, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import i18n from '../i18n';

const PhotoCreditText = styled.div`
  text-align: right;
  width: 100%;
`;

const StyledRow = styled(Row)`
  margin-top: 5vh;
  margin-bottom: 5vh;
`;

const getPriceCad = (price) => (i18n.language === 'en' ? `$${price}` : `${price} $`);
export const ProjectPage = ({ projects }) => {
  const { id } = useParams();
  const { t } = useTranslation('work');

  const { src, title, medium, dimension, year, price, available, 'photo-credit': photoCredit } = projects[id];
  const translatedTitle = title?.includes('@@') ? t(title) : title;
  return (
    <StyledRow>
      <Col xs={{ span: 20 }} lg={{ span: 14 }}>
        <Image preview={false} src={src} />
        <Row>
          <PhotoCreditText>{t('photo-credit') + t(photoCredit)}</PhotoCreditText>
        </Row>
      </Col>
      <Col xs={{ span: 20 }} lg={{ span: 3, offset: 1 }}>
        <div>{translatedTitle}</div>
        <div>{medium}</div>
        <div>{dimension}</div>
        <div>{year}</div>
        <div>{available ? t('available') : t('sold')}</div>
        {available && price && <div>{getPriceCad(price)}</div>}
      </Col>
    </StyledRow>
  );
};
