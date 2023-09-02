import { useMemo } from 'react';
import { groupBy } from 'lodash';
import projects from '../data/projects.json';

export const useProjects = () => {
  const projectsById = useMemo(() => {
    const p = {};
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

  const reversedProjects = useMemo(() => [...projects].reverse(), []);
  const anchorProjects = useMemo(() => {
    const groupedProjects = groupBy(reversedProjects, (project) => project.year);
    return Object.keys(groupedProjects)
      .map((year) => groupedProjects[year][0])
      .reverse();
  }, [reversedProjects]);

  const anchorProjectsIds = useMemo(() => new Set(anchorProjects.map(({ id }) => id)), [anchorProjects]);

  return { projectsById, projects, reversedProjects, anchorProjects, anchorProjectsIds };
};
