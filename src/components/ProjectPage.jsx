import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Image, Row, Col, Carousel } from 'antd';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import i18n from '../i18n';
import ReactHtmlParser from 'react-html-parser';
import { useHistory } from 'react-router-dom';
import { PROJECT_BASE } from '../constants/routes';
import { PROJECTS_FOLDER } from '../constants/folders';
import useKeypress from 'react-use-keypress';
import { PLACEHOLDER_FOLDER } from '../constants/folders';

const PhotoCreditText = styled.div`
  text-align: right;
  width: 100%;
  color: #aaaaaa;
`;

const StyledRow = styled(Row)`
  margin-top: 5vh;
  margin-bottom: 5vh;
`;

const StyledInfo = styled.div`
  font-size: 1.5em;
`;

const Spacer = styled.div`
  height: 3vh;
`;

const DraggableCarousel = styled(Carousel)`
  &:hover,
  &:focus {
    cursor: grab;
  }
  > .slick-dots li button {
    background: black;
    opacity: 0.5;
  }
  > .slick-dots li.slick-active button {
    background: black;
  }
`;

const getPriceCad = (price) => (i18n.language === 'en' ? `$${price}` : `${price} $`);

const formatTitle = (title, t) => {
  if (!(title ?? '@@untitled').startsWith('@@')) {
    return <i>{title}</i>;
  }

  return ReactHtmlParser(t(title));
};

const formatTechnique = (techniques, t) => {
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

const navigateToAnotherProject = (id, history) => {
  history.push(`${PROJECT_BASE}/${id}`);
};

export const ProjectPage = ({ projects }) => {
  const [photoCredit, setPhotoCredit] = useState(0);
  const history = useHistory();
  const { id } = useParams();
  const { t } = useTranslation('work');
  useKeypress('ArrowLeft', () => navigateToAnotherProject(projects[id].next, history));
  useKeypress('ArrowRight', () => navigateToAnotherProject(projects[id].previous, history));

  const {
    src,
    title,
    technique,
    dimension,
    year,
    price,
    available,
    'additional-images': additionalImages,
  } = projects[id];
  const photoCredits = useMemo(
    () => [projects[id]['photo-credit'], additionalImages?.map(({ 'photo-credit': pc }) => pc)].flat(),
    [additionalImages, id, projects],
  );
  const translatedTitle = formatTitle(title, t);

  return (
    <StyledRow gutter={[0, 50]}>
      <Col xs={{ span: 20 }} lg={{ span: 13 }}>
        <DraggableCarousel
          draggable
          adaptiveHeight
          dotPosition="top"
          beforeChange={(current, next) => setPhotoCredit(next)}
        >
          <Image
            key={src}
            draggable={false}
            width="100%"
            fluid="true"
            preview={false}
            src={`${PROJECTS_FOLDER}/${src}`}
            placeholder={<Image width="100%" src={`${PLACEHOLDER_FOLDER}/${src}`} preview={false} alt={title} />}
          />
          {additionalImages?.map(({ src: additionalSrc }) => (
            <Image
              key={additionalSrc}
              draggable={false}
              width="100%"
              fluid="true"
              preview={false}
              src={`${PROJECTS_FOLDER}/${additionalSrc}`}
              placeholder={
                <Image width="100%" src={`${PLACEHOLDER_FOLDER}/${additionalSrc}`} preview={false} alt={title} />
              }
            />
          ))}
        </DraggableCarousel>
        <Row>
          <PhotoCreditText>{t('photo-credit') + t(photoCredits[photoCredit])}</PhotoCreditText>
        </Row>
      </Col>
      <Col xs={{ span: 20 }} lg={{ span: 9, offset: 1 }}>
        <StyledInfo>{translatedTitle}</StyledInfo>
        <StyledInfo>{formatTechnique(technique, t)}</StyledInfo>
        <StyledInfo>{dimension}</StyledInfo>
        <StyledInfo>{year}</StyledInfo>
        <Spacer />
        {available !== null && <StyledInfo>{available ? t('available') : t('sold')}</StyledInfo>}
        {available && price && <StyledInfo>{getPriceCad(price)}</StyledInfo>}
      </Col>
    </StyledRow>
  );
};
