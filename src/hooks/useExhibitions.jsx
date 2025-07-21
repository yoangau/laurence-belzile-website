import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import exhibitionIds from '../data/exhibitions.json';
import projects from '../data/projects.json';
import { getTitleAlt } from '../utils/project';

export const useExhibitions = () => {
  const { t } = useTranslation('work');

  const exhibitions = useMemo(() => {
    // Get exhibition projects based on IDs from exhibitions.json
    const exhibitionProjects = projects.filter(project => 
      exhibitionIds.includes(project.id)
    );

    // Sort chronologically (newest first)
    const sortedExhibitions = exhibitionProjects
      .sort((a, b) => b.year - a.year)
      .map(project => ({
        ...project,
        alt: getTitleAlt(project.title, t),
      }));

    return sortedExhibitions;
  }, [t]);

  return { exhibitions };
};
