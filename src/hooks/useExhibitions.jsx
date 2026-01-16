import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import projects from '../data/projects.json';
import { getTitleAlt } from '../utils/project';

export const useExhibitions = () => {
  const { t } = useTranslation('work');

  const exhibitions = useMemo(() => {
    // Get exhibition projects based on expo field
    const exhibitionProjects = projects.filter((project) => project.expo === true);

    // Sort chronologically (newest first)
    const sortedExhibitions = exhibitionProjects
      .sort((a, b) => b.year - a.year)
      .map((project) => ({
        ...project,
        alt: getTitleAlt(project.title, t),
      }));

    return sortedExhibitions;
  }, [t]);

  return { exhibitions };
};
