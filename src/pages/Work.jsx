import React, { useMemo, useState } from 'react';
import { Project } from '../components/Project';
import { Anchor } from 'antd';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';

const FilterContainer = styled.div`
  display: flex;
  flex-direction: row;
  padding-left: 15px;
  @media (max-width: 768px) {
    padding-left: 0;
  }
`;

const FilterOption = styled.div`
  cursor: pointer;
  margin-right: 20px;
  color: ${(props) => (props.active ? 'black' : '#aaa')};
  &:hover,
  &:focus {
    color: black;
  }
`;

export const Work = ({
  projects,
  anchorProjectsIds,
  anchorProjects,
  availableProjects,
  anchorAvailableProjectsIds,
  anchorAvailableProjects,
  isFilterable,
}) => {
  const { t } = useTranslation('work');
  const filterOptions = useMemo(
    () => ({
      all: { label: t('filter-all'), value: 'all', projects, anchors: anchorProjects, anchorIds: anchorProjectsIds },
      available: {
        label: t('filter-available'),
        value: 'available',
        projects: availableProjects,
        anchors: anchorAvailableProjects,
        anchorIds: anchorAvailableProjectsIds,
      },
    }),
    [
      anchorAvailableProjects,
      anchorAvailableProjectsIds,
      anchorProjects,
      anchorProjectsIds,
      availableProjects,
      projects,
      t,
    ],
  );
  const [filter, setFilter] = useState(filterOptions.all.value);

  const data = filterOptions[filter];

  return (
    <>
      {isFilterable && (
        <FilterContainer>
          {Object.values(filterOptions).map(({ label, value }) => (
            <FilterOption active={filter === value} onClick={() => setFilter(value)}>
              {label}
            </FilterOption>
          ))}
        </FilterContainer>
      )}
      {data.projects.map((project) => (
        <Project isYearAnchor={data.anchorIds.has(project.id)} key={project.id} {...project} />
      ))}
      <Anchor
        offsetTop={20}
        style={{ position: 'fixed', top: '50%', right: '4%', transform: 'translateY(-50%)' }}
        items={data.anchors.map(({ id, year }) => ({
          key: id,
          href: `#${year}`,
          title: year,
        }))}
      />
    </>
  );
};
