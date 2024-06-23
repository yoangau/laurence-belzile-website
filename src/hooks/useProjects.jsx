import { useMemo } from 'react';
import { groupBy } from 'lodash';
import { useTranslation } from 'react-i18next';
import projects from '../data/projects.json';
import { getTitleAlt } from '../utils/project';

const createAnchorProjects = (projects) => {
  const groupedProjects = groupBy(projects, (project) => project.year);
  return Object.keys(groupedProjects)
    .map((year) => groupedProjects[year][0])
    .reverse();
};

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
  const anchorProjects = useMemo(() => createAnchorProjects(reversedProjects), [reversedProjects]);

  const anchorProjectsIds = useMemo(() => new Set(anchorProjects.map(({ id }) => id)), [anchorProjects]);

  const availableProjects = useMemo(() => reversedProjects.filter(({ available }) => available), [reversedProjects]);
  const anchorAvailableProjects = useMemo(() => createAnchorProjects(availableProjects), [availableProjects]);
  const anchorAvailableProjectsIds = useMemo(
    () =>
      new Set(
        anchorAvailableProjects.map(({ id }) => id),
        [anchorAvailableProjects],
      ),
    [anchorAvailableProjects],
  );

  return {
    projectsById,
    projects: reversedProjects,
    anchorProjects,
    anchorProjectsIds,
    availableProjects,
    anchorAvailableProjects,
    anchorAvailableProjectsIds,
  };
};
