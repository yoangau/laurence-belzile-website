import React from 'react';
import LazyLoad from 'react-lazyload';
import styled from '@emotion/styled';
import { Image } from 'antd';
import Fade from 'react-reveal';
import { useHistory } from 'react-router-dom';
import { PROJECT_BASE } from '../constants/routes';
import { animateScroll as scroll } from 'react-scroll';

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

export const Project = ({ id, src, title, width, year, isYearAnchor }) => {
  const history = useHistory();
  return (
    <>
      {isYearAnchor && <div id={year} />}
      <StyledProject id={id}>
        <LazyLoad once debounce height={'100%'}>
          <Fade bottom>
            <ClickableImage
              width={width}
              fluid="fluid"
              src={src}
              decoding="async"
              preview={false}
              alt={title}
              onClick={() => {
                history.push(`#${id}`);
                history.push(`${PROJECT_BASE}/${id}`);
                scroll.scrollToTop({ delay: 0, duration: 0 });
              }}
            />
          </Fade>
        </LazyLoad>
      </StyledProject>
    </>
  );
};
