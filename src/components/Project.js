import React from 'react';
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
    <Image src={imageSrc} alt={title} fluid></Image>
  </StyledProject>
);
