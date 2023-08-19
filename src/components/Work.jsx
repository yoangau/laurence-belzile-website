import React, { useMemo } from 'react';
import { Project } from './Project';
import projects from '../data/projects.json';
import { Anchor, Row, Col } from 'antd';
import { groupBy } from 'lodash';

export const Work = () => {
  const reversedProjects = useMemo(() => [...projects].reverse(), []);
  const anchorProjects = useMemo(() => {
    const groupedProjects = groupBy(reversedProjects, (project) => project.year);
    return Object.keys(groupedProjects)
      .map((year) => groupedProjects[year][0])
      .reverse();
  }, [reversedProjects]);
  const anchorProjectsIds = useMemo(() => new Set(anchorProjects.map(({ id }) => id)), [anchorProjects]);
  return (
    <Row>
      <Col span={20}>
        {reversedProjects.map((project) => (
          <Project isYearAnchor={anchorProjectsIds.has(project.id)} key={project.id} {...project} />
        ))}
      </Col>
      <Col span={4}>
        <Anchor
          items={anchorProjects.map(({ id, year }) => ({
            key: id,
            href: `#${year}`,
            title: year,
          }))}
        />
      </Col>
    </Row>
  );
};
