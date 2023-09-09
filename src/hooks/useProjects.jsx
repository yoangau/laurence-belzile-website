import { useMemo } from 'react';
import { groupBy } from 'lodash';
import { useTranslation } from 'react-i18next';
import projects from '../data/projects.json';
import { getTitleAlt } from '../utils/project';

export const useProjects = () => {
  const { t } = useTranslation('work');

  const enhancedProjects = useMemo(
    () =>
      projects.map((project) => ({
        ...project,
        alt: getTitleAlt(project.title, t),
      })),
    [t],
  );
  const projectsById = useMemo(() => {
    const p = {};
    let i = 0;
    const firstProject = enhancedProjects[0].id;
    const lastProject = enhancedProjects[projects.length - 1].id;
    for (const project of enhancedProjects) {
      p[project.id] = {
        ...project,
        previous: i === 0 ? lastProject : enhancedProjects[i - 1].id,
        next: i === enhancedProjects.length - 1 ? firstProject : enhancedProjects[i + 1].id,
      };
      i++;
    }
    return p;
  }, [enhancedProjects]);

  const reversedProjects = useMemo(() => [...enhancedProjects].reverse(), [enhancedProjects]);
  const anchorProjects = useMemo(() => {
    const groupedProjects = groupBy(reversedProjects, (project) => project.year);
    return Object.keys(groupedProjects)
      .map((year) => groupedProjects[year][0])
      .reverse();
  }, [reversedProjects]);

  const anchorProjectsIds = useMemo(() => new Set(anchorProjects.map(({ id }) => id)), [anchorProjects]);

  return { projectsById, projects: reversedProjects, anchorProjects, anchorProjectsIds };
};
