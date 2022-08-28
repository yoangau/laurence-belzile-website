import React from 'react';
import Fade from 'react-reveal/Fade';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';

const StyledTitle = styled.h5`
  margin-bottom: 0.5em;
  margin-top: 1em;
`;

const StyledYear = styled.div`
  margin-bottom: 1em;
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  justify-content: flex-start;
`;

const StyledDate = styled.div`
  width: 10ch;
  min-width: 10ch;
  max-width: 10ch;
  display: flex;
  flex-wrap: nowrap;
  flex-direction: column;
  align-content: flex-start;
`;

const StyledContentList = styled.div`
  display: flex;
  flex-wrap: nowrap;
  flex-direction: column;
  align-content: flex-start;
`;

const StyledLink = styled.a`
  color: inherit;
  &:hover,
  &:focus {
    color: #aaaaaa;
    cursor: pointer;
  }
`;

const content = [
  {
    title: 'studies-title',
    year: [
      {
        date: 2019,
        list: [{ val: 'studies-2019' }],
      },
      {
        date: 2016,
        list: [{ val: 'studies-2016' }],
      },
    ],
  },
  {
    title: 'rep-title',
    year: [
      {
        date: '',
        list: [{ val: 'rep-champagne', link: 'https://champagneparadis.com/collections/belzile-laurence' }],
      },
    ],
  },
  {
    title: 'expo-ind-title',
    year: [
      {
        date: 2022,
        list: [{ val: 'expo-ind-2022-0' }, { val: 'expo-ind-2022-1' }],
      },
      {
        date: 2021,
        list: [{ val: 'expo-ind-2021-0' }, { val: 'expo-ind-2021-1' }],
      },
      {
        date: 2020,
        list: [{ val: 'expo-ind-2020-0' }, { val: 'expo-ind-2020-1' }],
      },
      {
        date: 2019,
        list: [{ val: 'expo-ind-2019-0' }, { val: 'expo-ind-2019-1' }],
      },
      {
        date: 2018,
        list: [{ val: 'expo-ind-2018-0' }],
      },
      {
        date: 2017,
        list: [{ val: 'expo-ind-2017-0' }],
      },
    ],
  },
  {
    title: 'expo-col-title',
    year: [
      {
        date: 2021,
        list: [{ val: 'expo-col-2021-0' }],
      },
      {
        date: 2020,
        list: [{ val: 'expo-col-2020-0' }, { val: 'expo-col-2020-1' }, { val: 'expo-col-2020-2' }],
      },
      {
        date: 2018,
        list: [{ val: 'expo-col-2018-0' }, { val: 'expo-col-2018-1' }, { val: 'expo-col-2018-2' }],
      },
      {
        date: 2017,
        list: [
          { val: 'expo-col-2017-0' },
          { val: 'expo-col-2017-1' },
          { val: 'expo-col-2017-2' },
          { val: 'expo-col-2017-3' },
        ],
      },
      {
        date: 2016,
        list: [{ val: 'expo-col-2016-0' }, { val: 'expo-col-2016-1' }, { val: 'expo-col-2016-2' }],
      },
    ],
  },
  {
    title: 'resid-title',
    year: [
      {
        date: 2022,
        list: [{ val: 'resid-2022-0' }],
      },
      {
        date: 2019,
        list: [{ val: 'resid-2019-0' }],
      },
      {
        date: 2018,
        list: [{ val: 'resid-2018-0' }],
      },
      {
        date: 2017,
        list: [{ val: 'resid-2017-0' }],
      },
    ],
  },
  {
    title: 'awards-title',
    year: [
      {
        date: 2021,
        list: [{ val: 'awards-2021-0' }, { val: 'awards-2021-1' }, { val: 'awards-2021-2' }],
      },
      {
        date: 2020,
        list: [{ val: 'awards-2020-0' }],
      },
      {
        date: 2019,
        list: [{ val: 'awards-2019-0' }],
      },
      {
        date: 2018,
        list: [{ val: 'awards-2018-0' }, { val: 'awards-2018-1' }],
      },
      {
        date: 2017,
        list: [{ val: 'awards-2017-0' }],
      },
      {
        date: 2014,
        list: [{ val: 'awards-2014-0' }],
      },
    ],
  },
  {
    title: 'jobs-title',
    year: [
      {
        date: '2018-2021',
        list: [{ val: 'jobs-2018-2021' }],
      },
      {
        date: 2018,
        list: [{ val: 'jobs-2018' }],
      },
      {
        date: 2017,
        list: [{ val: 'jobs-2017' }],
      },
    ],
  },
  {
    title: 'other-title',
    year: [
      {
        date: 2021,
        list: [{ val: 'other-2021-0' }, { val: 'other-2021-1' }, { val: 'other-2021-2' }],
      },
      {
        date: 2020,
        list: [{ val: 'other-2020-0' }, { val: 'other-2020-1' }],
      },
      {
        date: 2019,
        list: [{ val: 'other-2019-0' }],
      },
      {
        date: '2018-2021',
        list: [{ val: 'other-2018-2021-0' }, { val: 'other-2018-2021-1' }],
      },
    ],
  },
  {
    title: 'collection-title',
    year: [
      {
        date: '',
        list: ['collection-0'],
      },
    ],
  },
];

export const Resume = () => {
  const { t } = useTranslation('resume');
  return (
    <Fade bottom>
      <h1>Curriculum vitae</h1>
      {content.map((element, i) => (
        <div key={`${element.title}-${i}`}>
          <StyledTitle>{t(element.title)}</StyledTitle>
          {element.year.map((year, j) => (
            <StyledYear key={`${year.date}-${j}`}>
              <StyledDate>{year.date}</StyledDate>
              <StyledContentList>
                {year.list.map(({ val, link }, k) => (
                  <div key={`${val}-${k}`}>
                    {link ? (
                      <StyledLink href="https://champagneparadis.com/collections/belzile-laurence">{t(val)}</StyledLink>
                    ) : (
                      t(val)
                    )}
                  </div>
                ))}
              </StyledContentList>
            </StyledYear>
          ))}
        </div>
      ))}
    </Fade>
  );
};
