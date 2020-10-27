import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
/** @jsx jsx */
import { Global } from '@emotion/core';
import styled from '@emotion/styled';
import { NavBar } from './components/NavBar';
import { Work } from './components/Work';
import { Contact } from './components/Contact';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { Name } from './components/Name';
import { Resume } from './components/Resume';

const StyledGlobal = styled(Global)`
  background: white;
  font-family: Rokkitt, serif;
  
  body::-webkit-scrollbar {
    width: 0.25rem;
  }

  body::-webkit-scrollbar-track {
    background: white;
  }

  body::-webkit-scrollbar-thumb {
    background: black;
  }
`;

const StyledApp = styled.div`
  margin-left: 10vw;
  min-height: 100vh;
`;

export const App = () => {
  return (
    <StyledApp>
      <StyledGlobal />
      <Router>
        <NavBar />
        <Name />
        <Switch>
          <Route exact path={['/', '/travail']}>
            <Work />
          </Route>
          <Route path="/contact">
            <Contact />
          </Route>
          <Route path="/cv">
            <Resume />
          </Route>
        </Switch>
      </Router>
    </StyledApp>
  );
};
