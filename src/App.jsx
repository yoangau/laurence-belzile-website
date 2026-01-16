import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import styled from '@emotion/styled';
import { ConfigProvider } from 'antd';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { Work, Project, Contact, Resume, Info, Exhibitions } from './pages';
import { Name } from './components/Name';
import { ABOUT, CONTACT, CV, LANDING, PROJECT, WORK, EXHIBITIONS } from './constants/routes';
import { useProjects } from './hooks/useProjects';
import { CustomHelmet } from './components/CustomHelmet';

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
      <CustomHelmet description="Artiste en art visuel" />
      <StyledApp>
        <Router>
          <NavBar />
          <Name />
          <Switch>
            <Route exact path={[LANDING]}>
              <Work {...rest} isFilterable={false} />
            </Route>
            <Route exact path={[WORK]}>
              <Work
                projects={rest.workProjects}
                anchorProjectsIds={rest.workAnchorProjectsIds}
                anchorProjects={rest.workAnchorProjects}
                availableProjects={rest.availableProjects}
                anchorAvailableProjectsIds={rest.anchorAvailableProjectsIds}
                anchorAvailableProjects={rest.anchorAvailableProjects}
                isFilterable
              />
            </Route>
            <Route exact path={[EXHIBITIONS]}>
              <Exhibitions />
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
