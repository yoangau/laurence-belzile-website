import React from 'react';
import Fade from 'react-reveal/Fade';
import styled from '@emotion/styled';
import { useHistory } from 'react-router-dom';
import { WORK } from '../constants/routes';

const ClickableHomeName = styled.h1`
  font-size: 7vw;
  text-align: left;
  padding-bottom: 0.5em;
  margin-top: 0.7em;
  margin-left: -0.2em;

  &:hover,
  &:focus {
    cursor: pointer;
    color: #aaaaaa;
  }
`;

export const Name = () => {
  const history = useHistory();
  return (
    <Fade bottom>
      <ClickableHomeName onClick={() => history.push(WORK)}>Laurence Belzile</ClickableHomeName>
    </Fade>
  );
};
