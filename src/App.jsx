import React, { useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import styled from '@emotion/styled';
import { ConfigProvider } from 'antd';
import { NavBar } from './components/NavBar';
import { Work } from './components/Work';
import { Contact } from './components/Contact';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Name } from './components/Name';
import { Resume } from './components/Resume';
import { Info } from './components/Info';
import { ABOUT, CONTACT, CV, LANDING, PROJECT, WORK } from './constants/routes';
import { ProjectPage } from './components/ProjectPage';
import projects from './data/projects.json';

const StyledApp = styled.div`
  background: white;
  font-family: Rokkitt, serif;
  font-size: 12pt;
  margin-left: 10vw;
  min-height: 100vh;
`;

export const App = () => {
  const projectsById = useMemo(() => {
    let p = {};
    let i = 0;
    const firstProject = projects[0].id;
    const lastProject = projects[projects.length - 1].id;
    for (const project of projects) {
      p[project.id] = {
        ...project,
        previous: i === 0 ? lastProject : projects[i - 1].id,
        next: i === projects.length - 1 ? firstProject : projects[i + 1].id,
      };
      i++;
    }
    return p;
  }, []);
  console.log(projectsById);
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
              <Work />
            </Route>
            <Route path={PROJECT}>
              <ProjectPage projects={projectsById} />
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
