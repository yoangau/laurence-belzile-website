import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import styled from '@emotion/styled';
import { ConfigProvider } from 'antd';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { Work, Project, Contact, Resume, Info } from './pages';
import { Name } from './components/Name';
import { ABOUT, CONTACT, CV, LANDING, PROJECT, WORK } from './constants/routes';
import { useProjects } from './hooks/useProjects';

const StyledApp = styled.div`
  background: white;
  font-size: 12pt;
  margin-left: 10vw;
  min-height: 100vh;
  * {
    font-family: Rokkitt, serif;
  }
`;

export const App = () => {
  const { projectsById, ...rest } = useProjects();
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: 'black',
        },
      }}
    >
      <StyledApp>
        <Router>
          <NavBar />
          <Name />
          <Switch>
            <Route exact path={[LANDING, WORK]}>
              <Work {...rest} />
            </Route>
            <Route path={PROJECT}>
              <Project projects={projectsById} />
            </Route>
            <Route path={CONTACT}>
              <Contact />
            </Route>
            <Route path={ABOUT}>
              <Info />
            </Route>
            <Route path={CV}>
              <Resume />
            </Route>
          </Switch>
        </Router>
      </StyledApp>
    </ConfigProvider>
  );
};
