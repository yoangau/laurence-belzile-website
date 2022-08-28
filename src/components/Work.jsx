import React from 'react';
import { Project } from './Project';
import Fade from 'react-reveal';
import projects from '../data/projects.json';

export const Work = () => {
  console.log(projects);
  return (
    <Fade bottom>
      {projects.reverse().map((project) => (
        <Project key={project.id} {...project}></Project>
      ))}
    </Fade>
  );
};
