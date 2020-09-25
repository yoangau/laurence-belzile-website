import React from 'react';
import LazyLoad from 'react-lazy-load';
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

export const Project = ({ imageSrc, title }) => (
  <StyledProject>
    <LazyLoad offsetVertical={512}>
      <Image src={imageSrc} alt={title} fluid></Image>
    </LazyLoad>
  </StyledProject>
);
