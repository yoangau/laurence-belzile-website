import React from 'react';
import LazyLoad from 'react-lazyload';
import styled from '@emotion/styled';
import { Image } from 'antd';
import Fade from 'react-reveal';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COMPRESSED_FOLDER, PLACEHOLDER_FOLDER } from '../constants/folders';
import { PROJECT_BASE } from '../constants/routes';
import { formatTitle } from '../utils/project';
import imageDimensions from '../data/image-dimensions.json';

const StyledExhibition = styled.div`
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  justify-content: flex-start;
  margin-top: 4em;
  margin-bottom: 8em;
  max-width: 80vw;
  min-width: 80vw;
  position: relative;
  @media (max-width: 768px) {
    margin-top: 2em;
    margin-bottom: 4em;
    max-width: 70vw;
    min-width: 70vw;
  }
`;

const ClickableImage = styled(Image)`
  &:hover,
  &:focus {
    cursor: pointer;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  }
`;

const ImageContainer = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
  aspect-ratio: ${(props) => props.aspectRatio};
  overflow: hidden;
`;

const ImageOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 2em 1em 1em 1em;
  pointer-events: none;
`;

const OverlayTitle = styled.div`
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 0.5em;
`;

const OverlayYear = styled.div`
  font-size: 1.2em;
`;

const OverlayDimension = styled.div`
  font-size: 1em;
  opacity: 0.9;
`;
export const Exhibition = ({ id, src, alt, width, year, title, dimension, isYearAnchor }) => {
  const { t } = useTranslation('work');
  const formattedTitle = formatTitle(title, t);

  // Get aspect ratio from dimensions data, fallback to 0.75 (3/4)
  const dims = imageDimensions[id] || { aspectRatio: 0.75 };
  const aspectRatio = dims.aspectRatio || 0.75;

  return (
    <>
      {isYearAnchor && <div id={year} />}
      <StyledExhibition id={id}>
        <LazyLoad once debounce height="100%" offset={200}>
          <Link to={`${PROJECT_BASE}/${id}`}>
            <Fade bottom>
              <ImageContainer style={{ width: width || '100%' }} aspectRatio={aspectRatio}>
                <ClickableImage
                  width="100%"
                  height="100%"
                  style={{ objectFit: 'cover' }}
                  src={`${COMPRESSED_FOLDER}/${src}`}
                  decoding="async"
                  preview={false}
                  alt={alt}
                  placeholder={
                    <Image
                      width="100%"
                      height="100%"
                      style={{ objectFit: 'cover' }}
                      src={`${PLACEHOLDER_FOLDER}/${src}`}
                      preview={false}
                      alt={alt}
                    />
                  }
                />
                <ImageOverlay>
                  <OverlayTitle>{formattedTitle}</OverlayTitle>
                  <OverlayYear>{year}</OverlayYear>
                  <OverlayDimension>{dimension}</OverlayDimension>
                </ImageOverlay>
              </ImageContainer>
            </Fade>
          </Link>
        </LazyLoad>
      </StyledExhibition>
    </>
  );
};
