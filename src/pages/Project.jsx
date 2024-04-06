import React, { useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Image, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { useHistory } from 'react-router-dom';
import { PROJECTS_FOLDER } from '../constants/folders';
import useKeypress from 'react-use-keypress';
import { PLACEHOLDER_FOLDER } from '../constants/folders';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useGesture } from '@use-gesture/react';
import { mobileAndTabletCheck } from '../utils/browser';
import { useSpring, animated } from '@react-spring/web';
import { Carousel, Spacer, PhotoCreditText, ProjectInfoEntry } from '../components/lib';
import { formatTitle, formatTechnique, navigateToAnotherProject } from '../utils/project';
import { ProjectAvailability } from '../components/ProjectAvailability';

const StyledRow = styled(Row)`
  margin-top: 5vh;
  margin-bottom: 5vh;
`;

const StyledArrows = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const StyledNavArrows = styled.div`
  font-size: 2vw;
  &:hover,
  &:focus {
    cursor: pointer;
    color: #aaaaaa;
  }
`;

let scrollY = window.scrollY;

export const Project = ({ projects }) => {
  const ref = useRef(null);
  const [opacity, setOpacity] = useState(1);
  const [{ x, y }, api] = useSpring(() => ({
    x: 0,
    y: 0,
  }));
  const [photoCredit, setPhotoCredit] = useState(0);
  const history = useHistory();
  const { id } = useParams();
  const { t } = useTranslation('work');
  const project = projects[id];
  const navigateNext = () => navigateToAnotherProject(project.next, history);
  const navigatePrevious = () => navigateToAnotherProject(project.previous, history);
  useKeypress('ArrowLeft', navigateNext);
  useKeypress('ArrowRight', navigatePrevious);
  useGesture(
    {
      onDragStart: ({ target }) => {
        if (!mobileAndTabletCheck() || target.localName === 'img' || target.localName === 'svg') return;
        scrollY = window.scrollY;
      },
      onDrag: ({ down, movement: [mx, my], target }) => {
        if (!mobileAndTabletCheck() || target.localName === 'img' || target.localName === 'svg') return;
        window.scrollTo({ top: scrollY - my });
        setOpacity(1 - Math.abs(mx) / 200);
        api.start({ x: down ? mx : 0, y: 0, immediate: down });
      },

      onDragEnd: ({ down, movement: [mx] }) => {
        if (!mobileAndTabletCheck() || down || Math.abs(mx) < 150) return;
        navigateToAnotherProject(mx > 0 ? project.next : project.previous, history);
        setOpacity(1);
        api.start({ x: 0, y: 0 });
      },
    },
    { target: ref },
  );

  const {
    src,
    alt,
    title,
    technique,
    dimension,
    year,
    price,
    available,
    'buy-ref': buyRef,
    'additional-images': additionalImages,
  } = project;
  const photoCredits = useMemo(
    () => [project['photo-credit'], additionalImages?.map(({ 'photo-credit': pc }) => pc)].flat(),
    [additionalImages, project],
  );
  const formattedTitle = formatTitle(title, t);
  return (
    <animated.div ref={ref} style={{ x, y, touchAction: 'none', opacity }}>
      <StyledRow gutter={[0, 50]}>
        <Col xs={{ span: 20 }} lg={{ span: 13 }}>
          <Carousel
            arrows
            prevArrow={<LeftOutlined />}
            nextArrow={<RightOutlined />}
            draggable
            adaptiveHeight
            dotPosition="top"
            beforeChange={(current, next) => setPhotoCredit(next)}
          >
            <Image
              key={src}
              alt={alt}
              draggable={false}
              width="100%"
              fluid="true"
              preview={false}
              src={`${PROJECTS_FOLDER}/${src}`}
              placeholder={<Image width="100%" src={`${PLACEHOLDER_FOLDER}/${src}`} preview={false} alt={alt} />}
            />
            {additionalImages?.map(({ src: additionalSrc }) => (
              <Image
                key={additionalSrc}
                alt={alt}
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
          </Carousel>
          <Row>
            <PhotoCreditText>{t('photo-credit') + t(photoCredits[photoCredit])}</PhotoCreditText>
          </Row>
        </Col>
        <Col xs={{ span: 20 }} lg={{ span: 9, offset: 1 }}>
          <Spacer />

          <ProjectInfoEntry>{formattedTitle}</ProjectInfoEntry>
          <ProjectInfoEntry>{formatTechnique(technique, t)}</ProjectInfoEntry>
          <ProjectInfoEntry>{dimension}</ProjectInfoEntry>
          <ProjectInfoEntry>{year}</ProjectInfoEntry>
          <Spacer />
          <ProjectAvailability {...{ available, price, title, id, buyRef }} />
          <Spacer />
          <Spacer />
          <Spacer />
          {!mobileAndTabletCheck() && (
            <StyledArrows>
              <StyledNavArrows onClick={navigateNext}>
                <LeftOutlined />
              </StyledNavArrows>
              <StyledNavArrows onClick={navigatePrevious}>
                <RightOutlined />
              </StyledNavArrows>
            </StyledArrows>
          )}
        </Col>
      </StyledRow>
    </animated.div>
  );
};
