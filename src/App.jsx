import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import styled from '@emotion/styled';
import { ConfigProvider } from 'antd';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { Work, Project, Contact, Resume, Info } from './pages';
import { Name } from './components/Name';
import { ABOUT, CONTACT, CV, LANDING, PROJECT, WEBSITE, WORK } from './constants/routes';
import { useProjects } from './hooks/useProjects';
import { Helmet } from 'react-helmet';

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
      <Helmet>
        <title>Laurence Belzile</title>
        <meta name="description" content="Laurence Belzile - Artiste en art visuel" />
        <meta name="author" content="Laurence Belzile" />
        <meta name="og:title" content="Laurence Belzile" />
        <meta name="og:description" content="Laurence Belzile - Artiste en art visuel" />
        <meta name="og:url" content={WEBSITE} />
        <meta property="og:image" content={`${WEBSITE}/Laurence_Belzile_profil.jpg`} />
        <meta property="og:image:secure_url" content={`${WEBSITE}/Laurence_Belzile_profil.jpg`} />
        <meta property="og:image:alt" content="Laurence Belzile" />
        <meta property="og:image:type" content="image/jpeg" />
      </Helmet>
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
