import React, { useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Image, Row, Col, FloatButton } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
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
import { Spacer, PhotoCreditText, ProjectInfoEntry } from '../components/lib';
import { formatTitle, formatTechnique, navigateToAnotherProject, getTitleAlt } from '../utils/project';
import { ProjectAvailability } from '../components/ProjectAvailability';
import { Helmet } from 'react-helmet';
import ReactHtmlParser from 'react-html-parser';
import { WEBSITE, PROJECT_BASE } from '../constants/routes';

const StyledRow = styled(Row)`
  margin-top: 5vh;
  margin-bottom: 5vh;
`;

const StyledMetaData = styled.div`
  height: 50vh;
`;

export const Project = ({ projects }) => {
  const ref = useRef(null);
  const [opacity, setOpacity] = useState(1);
  const [{ x, y }, api] = useSpring(() => ({
    x: 0,
    y: 0,
  }));
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
      },
      onDrag: ({ down, movement: [mx], target }) => {
        if (!mobileAndTabletCheck() || target.localName === 'img' || target.localName === 'svg') return;
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
    {
      target: ref,
      drag: {
        axis: 'x',
      },
    },
  );

  const {
    src,
    alt,
    title,
    technique,
    dimension,
    year,
    description,
    price,
    available,
    'buy-ref': buyRef,
    'additional-images': additionalImages,
  } = project;
  const photoCredits = useMemo(
    () => [project['photo-credit'], additionalImages?.map(({ 'photo-credit': pc }) => pc)].flat(),
    [additionalImages, project],
  );

  // Build list of all images for preview group
  const allImages = useMemo(() => {
    const images = [`${PROJECTS_FOLDER}/${src}`];
    if (additionalImages?.length > 0) {
      images.push(...additionalImages.map(({ src: additionalSrc }) => `${PROJECTS_FOLDER}/${additionalSrc}`));
    }
    return images;
  }, [src, additionalImages]);

  const formattedTitle = formatTitle(title, t);
  const titleAlt = getTitleAlt(title, t);
  const formattedDescription = description ? ReactHtmlParser(t(description)) : description;
  return (
    <>
      <Helmet>
        <title>{'Laurence Belzile - ' + titleAlt}</title>
        <meta name="description" content={titleAlt} />
        <meta property="og:title" content={titleAlt} />
        <meta property="og:description" content={titleAlt} />
        <meta property="og:image" content={`${WEBSITE}${PROJECTS_FOLDER}/${src}`} />
        <meta property="og:image:secure_url" content={`${WEBSITE}${PROJECTS_FOLDER}/${src}`} />
        <meta property="og:image:alt" content={alt} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:url" content={`${WEBSITE}${PROJECT_BASE}/${id}`} />
      </Helmet>

      <animated.div ref={ref} style={{ x, y, touchAction: 'pan-y', opacity }}>
        <StyledRow gutter={[0, 50]}>
          <Col xs={{ span: 20 }} lg={{ span: 12 }}>
            <Image.PreviewGroup
              items={allImages}
              preview={{
                movable: true,
                mask: 'transparent',
                toolbarRender: (_, { image, actions }) => (
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      justifyContent: 'center',
                    }}
                  >
                    <ZoomInOutlined key="zoom-in" onClick={actions.onZoomIn} style={{ cursor: 'pointer' }} />
                    <ZoomOutOutlined key="zoom-out" onClick={actions.onZoomOut} style={{ cursor: 'pointer' }} />
                  </div>
                ),
              }}
            >
              <Image
                key={src}
                alt={alt}
                draggable={false}
                width="100%"
                fluid="true"
                src={`${PROJECTS_FOLDER}/${src}`}
                placeholder={<Image width="100%" src={`${PLACEHOLDER_FOLDER}/${src}`} preview={false} alt={alt} />}
              />
            </Image.PreviewGroup>
            <Row>
              <PhotoCreditText>{t('photo-credit') + t(photoCredits[0])}</PhotoCreditText>
            </Row>
            {additionalImages?.map(({ src: additionalSrc }, i) => (
              <div key={additionalSrc}>
                <Image.PreviewGroup
                  items={allImages}
                  preview={{
                    mask: 'transparent',
                    toolbarRender: (_, { image, actions }) => (
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'center',
                        }}
                      >
                        <ZoomInOutlined key="zoom-in" onClick={actions.onZoomIn} style={{ cursor: 'pointer' }} />
                        <ZoomOutOutlined key="zoom-out" onClick={actions.onZoomOut} style={{ cursor: 'pointer' }} />
                      </div>
                    ),
                  }}
                >
                  <Image
                    alt={alt}
                    draggable={false}
                    width="100%"
                    fluid="true"
                    src={`${PROJECTS_FOLDER}/${additionalSrc}`}
                    placeholder={
                      <Image width="100%" src={`${PLACEHOLDER_FOLDER}/${additionalSrc}`} preview={false} alt={title} />
                    }
                  />
                </Image.PreviewGroup>
                <Row>
                  <PhotoCreditText>{t('photo-credit') + t(photoCredits[i + 1])}</PhotoCreditText>
                </Row>
              </div>
            ))}
          </Col>
          <Col xs={{ span: 20 }} lg={{ span: 6, offset: 1 }}>
            <StyledMetaData>
              <ProjectInfoEntry>{formattedTitle}</ProjectInfoEntry>
              <ProjectInfoEntry>{formatTechnique(technique, t)}</ProjectInfoEntry>
              <ProjectInfoEntry>{dimension}</ProjectInfoEntry>
              <ProjectInfoEntry>{year}</ProjectInfoEntry>
              {formattedDescription && <Spacer />}
              {formattedDescription && <ProjectInfoEntry>{formattedDescription}</ProjectInfoEntry>}
              <Spacer />
              <ProjectAvailability {...{ available, price, title, id, buyRef }} />
            </StyledMetaData>
            {!mobileAndTabletCheck() && (
              <>
                <FloatButton onClick={navigatePrevious} shape="square" icon={<RightOutlined />} style={{ right: 24 }} />
                <FloatButton
                  onClick={navigateNext}
                  shape="square"
                  icon={<LeftOutlined />}
                  style={{ right: 72, color: 'white' }}
                />
              </>
            )}
          </Col>
        </StyledRow>
      </animated.div>
    </>
  );
};
