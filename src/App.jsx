import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import styled from '@emotion/styled';
import { NavBar } from './components/NavBar';
import { Work } from './components/Work';
import { Contact } from './components/Contact';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { Name } from './components/Name';
import { Resume } from './components/Resume';

const StyledApp = styled.div`
  background: white;
  font-family: Rokkitt, serif;
  margin-left: 10vw;
  min-height: 100vh;
  
  ::-webkit-scrollbar {
    width: 0.25rem;
  }

  ::-webkit-scrollbar-track {
    background: white;
  }

  ::-webkit-scrollbar-thumb {
    background: black;
  }
`;

export const App = () => {
  return (
    <StyledApp>
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
