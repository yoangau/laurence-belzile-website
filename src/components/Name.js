import React from 'react';
import Fade from 'react-reveal/Fade';
import styled from '@emotion/styled';

const StyledName = styled.h1`
  font-size: 7vw;
  text-align: left;
  padding-bottom: 0.5em;
  margin-top: 0.7em;
  margin-left: -0.2em;
`;

export const Name = () => (
  <Fade bottom>
    <StyledName>laurence belzile</StyledName>
  </Fade>
);
