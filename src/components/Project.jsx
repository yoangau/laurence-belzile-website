import React, { useMemo } from 'react';
import LazyLoad from 'react-lazyload';
import styled from '@emotion/styled';
import { Image } from 'antd';
import Fade from 'react-reveal';
import { useHistory } from 'react-router-dom';
import { PROJECT_BASE } from '../constants/routes';
import { animateScroll as scroll } from 'react-scroll';
import { Blurhash } from 'react-blurhash';

const StyledProject = styled.div`
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  justify-content: flex-start;
  margin-top: 4em;
  margin-bottom: 8em;
  max-width: 80vw;
`;

const ClickableImage = styled(Image)`
  &:hover,
  &:focus {
    cursor: pointer;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  }
`;

export const Project = ({ id, src, title, h, w, blurhash, width, year, isYearAnchor }) => {
  const history = useHistory();
  const placeholder = useMemo(() => {
    const ratio = h / w;
    const floatWidth = +width.slice(0, -1) / 100;
    return {
      width: floatWidth * w,
      height: floatWidth * h * ratio,
      heightPercent: `${floatWidth * h * ratio * 100}%`,
    };
  }, [h, w, width]);

  return (
    <>
      {isYearAnchor && <div id={year} />}
      <StyledProject id={id}>
        <LazyLoad
          once
          debounce
          throttle
          placeholder={
            <div
              style={{
                width: placeholder.width,
                height: placeholder.heightPercent,
                backgroundColor: '#aaaaaa',
              }}
            />
          }
        >
          <Fade bottom>
            <ClickableImage
              fluid
              width={width}
              preview={false}
              src={src}
              loading="lazy"
              alt={title}
              onClick={() => {
                history.push(`#${id}`);
                history.push(`${PROJECT_BASE}/${id}`);
                scroll.scrollToTop({ delay: 0, duration: 0 });
              }}
              placeholder={
                <Blurhash
                  hash={blurhash}
                  width={placeholder.width}
                  height={placeholder.height}
                  resolutionX={32}
                  resolutionY={32}
                  punch={1}
                />
              }
            />
          </Fade>
        </LazyLoad>
      </StyledProject>
    </>
  );
};
