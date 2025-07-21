import React, { useMemo } from 'react';
import { Exhibition } from '../components/Exhibition';
import { Anchor } from 'antd';
import { useExhibitions } from '../hooks/useExhibitions';
import { CustomHelmet } from '../components/CustomHelmet';
import { groupBy } from 'lodash';

export const Exhibitions = () => {
  const { exhibitions } = useExhibitions();

  // Create anchor points for year navigation
  const anchorExhibitions = useMemo(() => {
    const groupedExhibitions = groupBy(exhibitions, (exhibition) => exhibition.year);
    return Object.keys(groupedExhibitions)
      .map((year) => groupedExhibitions[year][0])
      .reverse();
  }, [exhibitions]);

  // Create a set of anchor exhibition IDs for quick lookup
  const anchorExhibitionIds = useMemo(() => new Set(anchorExhibitions.map(({ id }) => id)), [anchorExhibitions]);

  return (
    <>
      <CustomHelmet description="Exhibitions" />
      {exhibitions.map((exhibition) => (
        <Exhibition 
          key={exhibition.id} 
          {...exhibition} 
          isYearAnchor={anchorExhibitionIds.has(exhibition.id)}
        />
      ))}
      {anchorExhibitions.length > 0 && (
        <Anchor
          offsetTop={20}
          style={{ position: 'fixed', top: '50%', right: '4%', transform: 'translateY(-50%)' }}
          items={anchorExhibitions.map(({ id, year }) => ({
            key: id,
            href: `#${year}`,
            title: year,
          }))}
        />
      )}
    </>
  );
};
