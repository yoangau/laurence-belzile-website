import React from 'react';
import { Project } from '../components/Project';
import { Anchor } from 'antd';

export const Work = ({ projects, anchorProjectsIds, anchorProjects }) => {
  return (
    <>
      {projects.map((project) => (
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
