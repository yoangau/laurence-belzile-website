import React from 'react';
import LazyLoad from 'react-lazyload';
import styled from '@emotion/styled';
import Image from 'react-bootstrap/Image';
import Fade from 'react-reveal';

const StyledProject = styled.div`
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  justify-content: flex-start;
  margin-top: 4em;
  margin-bottom: 8em;
  max-width: 80vw;
`;

export const Project = ({ id, src, title, width, year, isYearAnchor }) => (
  <>
    {isYearAnchor && <div id={year} />}
    <StyledProject id={id}>
      <LazyLoad once debounce height={'100%'}>
        <Fade bottom>
          <Image width={width} src={src} alt={title} fluid></Image>
        </Fade>
      </LazyLoad>
    </StyledProject>
  </>
);
