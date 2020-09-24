import React from 'react';
import Fade from 'react-reveal/Fade';
import styled from '@emotion/styled';

const StyledName = styled.h1`
  font-size: 5em;
  text-align: left;
  padding-bottom: 0.5em;
`;

export const Name = () => (
  <Fade bottom>
    <StyledName>laurence belzile</StyledName>
  </Fade>
);
