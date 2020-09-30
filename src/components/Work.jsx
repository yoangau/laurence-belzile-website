import React from 'react';
import { Project } from './Project';
import Fade from 'react-reveal';

const images_func = () => {
  const images = [];
  for (let i = 77; i > 0; i--) {
    images.push({
      id: i,
      imageSrc: `https://laulau.s3.ca-central-1.amazonaws.com/LB${i}.jpg`,
    });
  }
  return images;
};

export const Work = () => (
  <Fade bottom>
    {images_func().map((project) => (
      <Project key={project.id} title={project.id} imageSrc={project.imageSrc}></Project>
    ))}
  </Fade>
);
