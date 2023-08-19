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
  return (
    <Row>
      <Col span={20}>
        {reversedProjects.map((project) => (
          <Project id={project.id} key={project.id} {...project} />
        ))}
      </Col>
      <Col span={4}>
        <Anchor
          items={anchorProjects.map(({ id, year }) => ({
            key: id,
            href: `#${id}`,
            title: year,
          }))}
        />
      </Col>
    </Row>
  );
};
