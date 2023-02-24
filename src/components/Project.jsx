import React from 'react';
import LazyLoad from 'react-lazyload';
import styled from '@emotion/styled';
import Image from 'react-bootstrap/Image';

const StyledProject = styled.div`
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  justify-content: flex-start;
  margin-top: 4em;
  margin-bottom: 8em;
  max-width: 80vw;
`;

export const Project = ({ src, title, width }) => (
  <StyledProject>
    <LazyLoad height={1024}>
      <Image width={width} src={src} alt={title} fluid></Image>
    </LazyLoad>
  </StyledProject>
);
