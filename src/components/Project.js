import React from 'react';
import LazyLoad from 'react-lazy-load';
import styled from '@emotion/styled';
import Image from 'react-bootstrap/Image';

const StyledProject = styled.div`
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  justify-content: flex-start;
  margin-top: 2em;
  margin-bottom: 2em;
  max-width: 85vw;
`;

export const Project = ({ imageSrc, title }) => (
  <StyledProject>
    <LazyLoad offsetVertical={512}>
      <Image src={imageSrc} alt={title} fluid></Image>
    </LazyLoad>
  </StyledProject>
);
