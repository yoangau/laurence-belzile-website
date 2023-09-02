import React from 'react';
import { Project } from './Project';
import { Anchor } from 'antd';

export const Work = ({ reversedProjects, anchorProjectsIds, anchorProjects }) => {
  return (
    <>
      {reversedProjects.map((project) => (
        <Project isYearAnchor={anchorProjectsIds.has(project.id)} key={project.id} {...project} />
      ))}
      <Anchor
        offsetTop={20}
        style={{ position: 'fixed', top: '50%', right: '4%', transform: 'translateY(-50%)' }}
        items={anchorProjects.map(({ id, year }) => ({
          key: id,
          href: `#${year}`,
          title: year,
        }))}
      />
    </>
  );
};
